// src/app/api/admin/panel-leads/route.ts - Fixed panel leads API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const interestLevel = searchParams.get('interestLevel') || 'all'
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('Fetching panel leads with filters:', { search, interestLevel, status, limit })

    // Build where clause for panel interests
    const where: any = {}
    
    if (interestLevel !== 'all') {
      where.interestLevel = interestLevel
    }
    
    if (status !== 'all') {
      where.status = status
    }

    // Add search filter for registration data
    let registrationWhere: any = {}
    if (search.trim()) {
      const searchTerm = search.trim()
      registrationWhere.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { companyName: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    // Get all panel interests with registration details
    const panelInterests = await prisma.panelInterest.findMany({
      where: {
        ...where,
        registration: registrationWhere
      },
      include: {
        registration: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isEmsClient: true,
            companyName: true,
            emsCustomerId: true,
            status: true,
            createdAt: true,
            tickets: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: [
        { interestLevel: 'desc' }, // URGENT first, then HIGH, MEDIUM, LOW
        { createdAt: 'desc' }
      ],
      take: limit
    })

    console.log(`Found ${panelInterests.length} panel interests`)

    // Get statistics
    const totalLeads = await prisma.panelInterest.count()
    console.log(`Total panel leads in database: ${totalLeads}`)
    
    const [interestStats, statusStats] = await Promise.all([
      prisma.panelInterest.groupBy({
        by: ['interestLevel'],
        _count: { id: true }
      }),
      prisma.panelInterest.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ])

    // Calculate statistics
    const statistics = {
      total: totalLeads,
      high_interest: (interestStats.find(s => s.interestLevel === 'HIGH')?._count.id || 0),
      medium_interest: (interestStats.find(s => s.interestLevel === 'MEDIUM')?._count.id || 0),
      low_interest: (interestStats.find(s => s.interestLevel === 'LOW')?._count.id || 0),
      urgent_interest: (interestStats.find(s => s.interestLevel === 'URGENT')?._count.id || 0),
      new_status: (statusStats.find(s => s.status === 'NEW')?._count.id || 0),
      contacted_status: (statusStats.find(s => s.status === 'CONTACTED')?._count.id || 0),
      qualified_status: (statusStats.find(s => s.status === 'QUALIFIED')?._count.id || 0),
      converted_status: (statusStats.find(s => s.status === 'CONVERTED')?._count.id || 0),
      lost_status: (statusStats.find(s => s.status === 'LOST')?._count.id || 0),
      closed_status: (statusStats.find(s => s.status === 'CLOSED')?._count.id || 0)
    }

    console.log('Statistics calculated:', statistics)

    // Format the response
    const formattedLeads = panelInterests.map(interest => ({
      id: interest.id,
      registrationId: interest.registrationId,
      customerName: `${interest.registration.firstName} ${interest.registration.lastName}`,
      email: interest.registration.email,
      phone: interest.registration.phone,
      isEmsClient: interest.registration.isEmsClient,
      companyName: interest.registration.companyName,
      emsCustomerId: interest.registration.emsCustomerId,
      registrationStatus: interest.registration.status,
      ticketCount: interest.registration.tickets.length,
      panelType: interest.panelType,
      interestLevel: interest.interestLevel,
      leadStatus: interest.status,
      estimatedBudget: interest.estimatedBudget,
      timeframe: interest.timeframe,
      notes: interest.notes,
      assignedTo: interest.assignedTo,
      followUpDate: interest.followUpDate?.toISOString(),
      lastContactAt: interest.lastContactAt?.toISOString(),
      createdAt: interest.createdAt.toISOString(),
      updatedAt: interest.updatedAt.toISOString()
    }))

    console.log(`Formatted ${formattedLeads.length} leads`)

    return NextResponse.json({
      success: true,
      data: {
        leads: formattedLeads,
        statistics,
        pagination: {
          total: totalLeads,
          showing: formattedLeads.length,
          limit
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching panel leads:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch panel leads', error: error.message },
      { status: 500 }
    )
  }
}

// Update panel lead status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, status, assignedTo, followUpDate, notes } = body

    if (!leadId || !status) {
      return NextResponse.json(
        { success: false, message: 'Lead ID and status are required' },
        { status: 400 }
      )
    }

    const updatedLead = await prisma.panelInterest.update({
      where: { id: leadId },
      data: {
        status,
        assignedTo: assignedTo || undefined,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        notes: notes || undefined,
        lastContactAt: new Date()
      },
      include: {
        registration: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Panel lead updated successfully',
      data: updatedLead
    })

  } catch (error: any) {
    console.error('Error updating panel lead:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update panel lead', error: error.message },
      { status: 500 }
    )
  }
}