// src/app/api/admin/tickets/fast/route.ts - Ultra-fast tickets API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const loadAll = searchParams.get('all') === 'true'
    
    // For optimized filtering, load all data without server-side filtering
    const where: any = {}
    
    // Only apply server-side filters if not loading all data
    if (!loadAll) {
      const status = searchParams.get('status')
      const search = searchParams.get('search')
      
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
    }
    
    // Ultra-optimized query with minimal data selection
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        accessType: true,
        ticketSequence: true,
        issuedAt: true,
        sentAt: true,
        collectedAt: true,
        collectedBy: true,
        eventDate: true,
        venue: true,
        boothLocation: true,
        // Minimal registration data
        registration: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isEmsClient: true,
            status: true
          }
        },
        // Only latest check-in
        checkIns: {
          select: {
            checkedInAt: true,
            checkedInBy: true,
            location: true
          },
          orderBy: { checkedInAt: 'desc' },
          take: 1
        }
      },
      orderBy: { issuedAt: 'desc' },
      take: loadAll ? 1000 : 100 // Load more data when filtering client-side
    })
    
    // Format response efficiently with minimal transformations
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      accessType: ticket.accessType,
      sequence: ticket.ticketSequence,
      issuedAt: ticket.issuedAt.toISOString(),
      sentAt: ticket.sentAt?.toISOString(),
      collectedAt: ticket.collectedAt?.toISOString(),
      collectedBy: ticket.collectedBy,
      customer: {
        id: ticket.registration.id,
        name: `${ticket.registration.firstName} ${ticket.registration.lastName}`,
        email: ticket.registration.email,
      customer: {
        id: ticket.registration.id,
        name: `${ticket.registration.firstName} ${ticket.registration.lastName}`,
        email: ticket.registration.email,
        phone: ticket.registration.phone,
        isEmsClient: ticket.registration.isEmsClient,
        registrationStatus: ticket.registration.status
      },
      lastCheckIn: ticket.checkIns[0] ? {
        checkedInAt: ticket.checkIns[0].checkedInAt.toISOString(),
        checkedInBy: ticket.checkIns[0].checkedInBy,
        location: ticket.checkIns[0].location
      } : undefined
    }}))
    
    return NextResponse.json({
      success: true,
      data: {
        tickets: formattedTickets
      }
    })
    
  } catch (error: any) {
    console.error('Fast tickets API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      },
      { status: 500 }
    )
  }
}