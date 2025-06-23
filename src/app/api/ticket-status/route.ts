// src/app/api/ticket-status/route.ts - Fixed for multiple tickets with proper data structure
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SearchSchema = z.object({
  searchType: z.enum(['email', 'ticket']),
  searchValue: z.string().min(1, 'Search value is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchType, searchValue } = SearchSchema.parse(body)

    let registration
    let specificTicket = null

    if (searchType === 'email') {
      registration = await prisma.registration.findUnique({
        where: { email: searchValue },
        include: {
          tickets: {
            include: {
              ticketType: true
            },
            orderBy: { createdAt: 'desc' }
          },
          payment: true,
          panelInterests: true
        }
      })
    } else {
      // Search by ticket number
      const ticket = await prisma.ticket.findUnique({
        where: { ticketNumber: searchValue },
        include: {
          ticketType: true,
          registration: {
            include: {
              tickets: {
                include: {
                  ticketType: true
                },
                orderBy: { createdAt: 'desc' }
              },
              payment: true,
              panelInterests: true
            }
          }
        }
      })
      
      if (ticket) {
        registration = ticket.registration
        specificTicket = ticket
      }
    }

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'No registration found with the provided details' },
        { status: 404 }
      )
    }

    // Get the primary ticket (either the searched ticket or the most recent one)
    const primaryTicket = specificTicket || registration.tickets[0] || null

    // Format the response data
    const responseData = {
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      registrationStatus: registration.status,
      isEmsClient: registration.isEmsClient,
      createdAt: registration.createdAt,
      customerName: registration.customerName, 
      panelInterest: registration.panelInterests.length > 0,
      
      // Primary ticket information
      primaryTicket: primaryTicket ? {
        id: primaryTicket.id,
        ticketNumber: primaryTicket.ticketNumber,
        status: primaryTicket.status,
        qrCode: primaryTicket.qrCode,
        pdfUrl: primaryTicket.pdfUrl,
        issuedAt: primaryTicket.issuedAt,
        sentAt: primaryTicket.sentAt,
        collectedAt: primaryTicket.collectedAt,
        eventDate: primaryTicket.eventDate,
        venue: primaryTicket.venue,
        boothLocation: primaryTicket.boothLocation,
        sequence: primaryTicket.ticketSequence,
        ticketType: primaryTicket.ticketType ? {
          name: primaryTicket.ticketType.name,
          description: primaryTicket.ticketType.description
        } : null
      } : null,
      
      // Legacy fields for backward compatibility
      ticketNumber: primaryTicket?.ticketNumber,
      ticketStatus: primaryTicket?.status,
      qrCode: primaryTicket?.qrCode,
      pdfUrl: primaryTicket?.pdfUrl,
      eventDate: primaryTicket?.eventDate,
      venue: primaryTicket?.venue,
      
      // All tickets summary
      ticketsSummary: {
        total: registration.tickets.length,
        generated: registration.tickets.filter(t => t.status === 'GENERATED').length,
        sent: registration.tickets.filter(t => t.status === 'SENT').length,
        collected: registration.tickets.filter(t => t.status === 'COLLECTED').length,
        used: registration.tickets.filter(t => t.status === 'USED').length,
        cancelled: registration.tickets.filter(t => t.status === 'CANCELLED').length
      },
      
      // All tickets list (for detailed view)
      allTickets: registration.tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        sequence: ticket.ticketSequence,
        issuedAt: ticket.issuedAt,
        sentAt: ticket.sentAt,
        collectedAt: ticket.collectedAt,
        ticketType: ticket.ticketType ? {
          name: ticket.ticketType.name,
          description: ticket.ticketType.description
        } : null
      })),
      
      // Payment information
      payment: registration.payment ? {
        status: registration.payment.status,
        amount: registration.payment.amount,
        currency: registration.payment.currency,
        paidAt: registration.payment.paidAt
      } : null,
      
      // Panel interests
      panelInterests: registration.panelInterests.map(interest => ({
        id: interest.id,
        panelType: interest.panelType,
        interestLevel: interest.interestLevel,
        status: interest.status
      }))
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Error searching ticket status:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid search parameters', errors: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for simpler searches
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const ticketNumber = searchParams.get('ticket')
    
    if (!email && !ticketNumber) {
      return NextResponse.json(
        { success: false, message: 'Either email or ticket parameter is required' },
        { status: 400 }
      )
    }
    
    // Use the same logic as POST
    const searchType = email ? 'email' : 'ticket'
    const searchValue = email || ticketNumber || ''
    
    // Create a mock request body and call POST
    const mockBody = { searchType, searchValue }
    const mockRequest = {
      json: async () => mockBody
    } as NextRequest
    
    return await POST(mockRequest)
    
  } catch (error) {
    console.error('Error in GET ticket status:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}