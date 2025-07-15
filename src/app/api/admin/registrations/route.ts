// src/app/api/admin/registrations/route.ts - VR Room Malta Admin API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status')
    const customerType = searchParams.get('customerType')
    
    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (customerType && customerType !== 'all') {
      where.isEmsClient = customerType === 'ems'
    }

    // Fetch registrations with related data
    const registrations = await prisma.registration.findMany({
      where,
      include: {
        tickets: {
          include: {
            ticketType: {
              select: {
                name: true,
                priceInCents: true
              }
            }
          }
        },
        payment: {
          select: {
            status: true,
            paidAt: true,
            amount: true
          }
        },
        panelInterests: {
          select: {
            id: true,
            panelType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit
    })

    // Get total count for pagination
    const totalCount = await prisma.registration.count({ where })

    // Transform data for VR Room frontend
    const formattedRegistrations = registrations.map(reg => {
      const ticketSummary = reg.tickets.reduce((acc, ticket) => {
        const existing = acc.find(t => t.name === ticket.ticketType.name)
        if (existing) {
          existing.quantity += 1
        } else {
          acc.push({
            name: ticket.ticketType.name || 'VR Session',
            quantity: 1,
            price: ticket.ticketType.priceInCents || 0
          })
        }
        return acc
      }, [] as Array<{ name: string; quantity: number; price: number }>)

      return {
        id: reg.id,
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        phone: reg.phone || 'N/A',
        status: reg.status,
        isEmsClient: reg.isEmsClient,
        finalAmount: reg.finalAmount,
        originalAmount: reg.originalAmount,
        discountAmount: reg.discountAmount,
        selectedTickets: ticketSummary.length > 0 ? ticketSummary : [
          { name: 'VR Experience', quantity: 1, price: 0 }
        ],
        sessionCount: reg.tickets.length || 1,
        createdAt: reg.createdAt.toISOString(),
        updatedAt: reg.updatedAt.toISOString(),
        paidAt: reg.payment?.paidAt?.toISOString(),
        paymentStatus: reg.payment?.status,
        hasPartyBooking: reg.panelInterests.length > 0,
        
        // Additional VR-specific fields
        vrExperiences: ticketSummary.map(t => t.name).join(', '),
        totalSessions: reg.tickets.length,
        customerType: reg.isEmsClient ? 'VIP' : 'Regular',
        bookingValue: reg.isEmsClient ? 0 : reg.finalAmount
      }
    })

    // Calculate summary stats
    const stats = {
      total: totalCount,
      pending: registrations.filter(r => r.status === 'PENDING').length,
      verified: registrations.filter(r => r.status === 'VERIFIED').length,
      completed: registrations.filter(r => r.status === 'COMPLETED').length,
      paymentPending: registrations.filter(r => r.status === 'PAYMENT_PENDING').length,
      vipClients: registrations.filter(r => r.isEmsClient).length,
      totalRevenue: registrations.reduce((sum, r) => sum + r.finalAmount, 0),
      totalSessions: registrations.reduce((sum, r) => sum + r.tickets.length, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        registrations: formattedRegistrations,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        },
        stats
      },
      message: `Found ${formattedRegistrations.length} VR bookings`
    })

  } catch (error: any) {
    console.error('VR Admin registrations API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch VR bookings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        data: {
          registrations: [],
          pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
          stats: {
            total: 0,
            pending: 0,
            verified: 0,
            completed: 0,
            paymentPending: 0,
            vipClients: 0,
            totalRevenue: 0,
            totalSessions: 0
          }
        }
      },
      { status: 500 }
    )
  }
}

// POST endpoint for creating new VR bookings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      isEmsClient = false,
      selectedTickets = [],
      customerName,
      orderNumber
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: firstName, lastName, email' },
        { status: 400 }
      )
    }

    // Create the registration
    const registration = await prisma.registration.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || '',
        isEmsClient,
        customerName: isEmsClient ? customerName : null,
        orderNumber: isEmsClient ? orderNumber : null,
        status: isEmsClient ? 'VERIFIED' : 'PENDING',
        originalAmount: 0, // Will be calculated based on tickets
        discountAmount: 0,
        finalAmount: 0
      }
    })

    return NextResponse.json({
      success: true,
      data: { registration },
      message: 'VR booking created successfully'
    })

  } catch (error: any) {
    console.error('Create VR booking error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create VR booking',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}