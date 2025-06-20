// src/app/api/admin/registrations/route.ts - Optimized for speed
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    // Build optimized where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      const searchTerm = search.trim()
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { idCardNumber: { contains: searchTerm, mode: 'insensitive' } },
        { companyName: { contains: searchTerm, mode: 'insensitive' } },
        { emsCustomerId: { contains: searchTerm, mode: 'insensitive' } },
        { id: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }
    
    // Parallel queries for speed
    const [registrations, totalCount, stats] = await Promise.all([
      // Main data query with minimal includes
      prisma.registration.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          idCardNumber: true,
          isEmsClient: true,
          companyName: true,
          emsCustomerId: true,
          accountManager: true,
          status: true,
          createdAt: true,
          verifiedAt: true,
          verifiedBy: true,
          rejectedReason: true,
          adminNotes: true,
          // Optimized ticket selection
          tickets: {
            select: {
              id: true,
              ticketNumber: true,
              status: true,
              ticketSequence: true,
              issuedAt: true
            },
            orderBy: { ticketSequence: 'asc' }
          },
          // Optimized payment selection
          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              paidAt: true,
              stripePaymentId: true
            }
          },
          // Minimal panel interests
          panelInterests: {
            select: {
              id: true,
              panelType: true,
              interestLevel: true,
              status: true,
              createdAt: true
            },
            take: 1 // Only get first one for display
          },
          // Latest email only
          emailLogs: {
            select: {
              emailType: true,
              subject: true,
              status: true,
              sentAt: true
            },
            orderBy: { sentAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      
      // Count query
      prisma.registration.count({ where }),
      
      // Stats query
      prisma.registration.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ])
    
    // Process stats
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>)
    
    // Format response data efficiently
    const formattedRegistrations = registrations.map(reg => ({
      id: reg.id,
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email,
      phone: reg.phone,
      idCardNumber: reg.idCardNumber,
      isEmsClient: reg.isEmsClient,
      companyName: reg.companyName,
      emsCustomerId: reg.emsCustomerId,
      accountManager: reg.accountManager,
      status: reg.status,
      createdAt: reg.createdAt.toISOString(),
      verifiedAt: reg.verifiedAt?.toISOString(),
      verifiedBy: reg.verifiedBy,
      rejectedReason: reg.rejectedReason,
      adminNotes: reg.adminNotes,
      
      // Ticket info
      ticketCount: reg.tickets.length,
      tickets: reg.tickets,
      
      // Payment info
      payment: reg.payment,
      
      // Panel interests
      panelInterests: reg.panelInterests,
      
      // Latest email
      latestEmail: reg.emailLogs[0] || null
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        registrations: formattedRegistrations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
          limit
        },
        stats: {
          total: totalCount,
          pending: statusStats.PENDING || 0,
          completed: statusStats.COMPLETED || 0,
          rejected: statusStats.REJECTED || 0,
          paymentPending: statusStats.PAYMENT_PENDING || 0
        }
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching admin registrations:', error.message)
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch registrations', error: error.message },
      { status: 500 }
    )
  }
}
