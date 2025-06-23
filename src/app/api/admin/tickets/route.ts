// src/app/api/admin/tickets/route.ts - Tickets management API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { registration: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ]
    }
    
    // Get tickets with registration details
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        registration: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isEmsClient: true,
            status: true,
            createdAt: true
          }
        },
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
          take: 1
        }
      },
      orderBy: { issuedAt: 'desc' },
      skip,
      take: limit
    })
    
    // Get total count
    const totalCount = await prisma.ticket.count({ where })
    
    // Get statistics
    const stats = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    const totalStats = await prisma.ticket.count()
    
    const formattedStats = {
      total: totalStats,
      generated: stats.find(s => s.status === 'GENERATED')?._count.id || 0,
      sent: stats.find(s => s.status === 'SENT')?._count.id || 0,
      collected: stats.find(s => s.status === 'COLLECTED')?._count.id || 0,
      used: stats.find(s => s.status === 'USED')?._count.id || 0,
      expired: stats.find(s => s.status === 'EXPIRED')?._count.id || 0,
      cancelled: stats.find(s => s.status === 'CANCELLED')?._count.id || 0
    }
    
    // Format response
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      // Removed accessType as it's not in the Prisma schema
      sequence: ticket.ticketSequence,
      issuedAt: ticket.issuedAt,
      sentAt: ticket.sentAt,
      collectedAt: ticket.collectedAt,
      collectedBy: ticket.collectedBy,
      eventDate: ticket.eventDate,
      venue: ticket.venue,
      boothLocation: ticket.boothLocation,
      customer: {
        id: ticket.registration.id,
        name: `${ticket.registration.firstName} ${ticket.registration.lastName}`,
        email: ticket.registration.email,
        phone: ticket.registration.phone,
        isEmsClient: ticket.registration.isEmsClient,
        registrationStatus: ticket.registration.status,
        registeredAt: ticket.registration.createdAt
      },
      lastCheckIn: ticket.checkIns[0] ? {
        checkedInAt: ticket.checkIns[0].checkedInAt,
        checkedInBy: ticket.checkIns[0].checkedInBy,
        location: ticket.checkIns[0].location
      } : null
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        tickets: formattedTickets,
        stats: formattedStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tickets', error: error.message },
      { status: 500 }
    )
  }
}