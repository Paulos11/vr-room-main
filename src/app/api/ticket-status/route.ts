// CORRECTED: src/app/api/ticket-status/route.ts - Support multiple registrations per email
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SearchSchema = z.object({
  searchType: z.enum(['email', 'ticket']),
  searchValue: z.string().min(1, 'Search value is required'),
  // ✅ NEW: Optional parameter to get all registrations for an email
  includeAllRegistrations: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchType, searchValue, includeAllRegistrations } = SearchSchema.parse(body)

    console.log('Ticket status search:', { searchType, searchValue, includeAllRegistrations })

    let registrations: any[] = []
    let specificTicket = null

    if (searchType === 'email') {
      // ✅ FIXED: Get all registrations for email or just the most recent one
      if (includeAllRegistrations) {
        // Get all registrations for this email
        registrations = await prisma.registration.findMany({
          where: { email: searchValue.toLowerCase().trim() },
          include: {
            tickets: {
              include: {
                ticketType: true
              },
              orderBy: { createdAt: 'desc' }
            },
            payment: true,
            panelInterests: true
          },
          orderBy: { createdAt: 'desc' }
        })
      } else {
        // Get only the most recent registration
        const registration = await prisma.registration.findFirst({
          where: { email: searchValue.toLowerCase().trim() },
          include: {
            tickets: {
              include: {
                ticketType: true
              },
              orderBy: { createdAt: 'desc' }
            },
            payment: true,
            panelInterests: true
          },
          orderBy: { createdAt: 'desc' }
        })
        
        if (registration) {
          registrations = [registration]
        }
      }
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
        registrations = [ticket.registration]
        specificTicket = ticket
      }
    }

    if (registrations.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No registration found with the provided details' },
        { status: 404 }
      )
    }

    // ✅ NEW: Handle multiple registrations response
    if (includeAllRegistrations && registrations.length > 1) {
      // Return summary of all registrations
      const allRegistrationsData = registrations.map((registration: any) => {
        const primaryTicket = registration.tickets[0] || null
        
        return {
          id: registration.id,
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          registrationStatus: registration.status,
          isEmsClient: registration.isEmsClient,
          createdAt: registration.createdAt,
          customerName: registration.customerName,
          
          // Summary ticket info
          ticketCount: registration.tickets.length,
          ticketsSummary: {
            total: registration.tickets.length,
            generated: registration.tickets.filter((t: any) => t.status === 'GENERATED').length,
            sent: registration.tickets.filter((t: any) => t.status === 'SENT').length,
            collected: registration.tickets.filter((t: any) => t.status === 'COLLECTED').length,
            used: registration.tickets.filter((t: any) => t.status === 'USED').length,
            cancelled: registration.tickets.filter((t: any) => t.status === 'CANCELLED').length
          },
          
          // Primary ticket for preview
          primaryTicket: primaryTicket ? {
            ticketNumber: primaryTicket.ticketNumber,
            status: primaryTicket.status,
            ticketType: primaryTicket.ticketType?.name
          } : null,
          
          // Payment info
          paymentStatus: registration.payment?.status || null,
          totalAmount: registration.finalAmount,
          
          // Panel interest
          hasPanelInterest: registration.panelInterests.length > 0
        }
      })

      return NextResponse.json({
        success: true,
        multipleRegistrations: true,
        totalRegistrations: registrations.length,
        data: allRegistrationsData
      })
    }

    // ✅ Single registration response (existing logic)
    const registration = registrations[0]
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
        generated: registration.tickets.filter((t: any) => t.status === 'GENERATED').length,
        sent: registration.tickets.filter((t: any) => t.status === 'SENT').length,
        collected: registration.tickets.filter((t: any) => t.status === 'COLLECTED').length,
        used: registration.tickets.filter((t: any) => t.status === 'USED').length,
        cancelled: registration.tickets.filter((t: any) => t.status === 'CANCELLED').length
      },
      
      // All tickets list (for detailed view)
      allTickets: registration.tickets.map((ticket: any) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        sequence: ticket.ticketSequence,
        issuedAt: ticket.issuedAt,
        sentAt: ticket.sentAt,
        collectedAt: ticket.collectedAt,
        purchasePrice: ticket.purchasePrice,
        qrCode: ticket.qrCode,
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
        paidAt: registration.payment.paidAt,
        stripePaymentId: registration.payment.stripePaymentId
      } : null,
      
      // Panel interests
      panelInterests: registration.panelInterests.map((interest: any) => ({
        id: interest.id,
        panelType: interest.panelType,
        interestLevel: interest.interestLevel,
        status: interest.status
      })),

      // ✅ NEW: Indicate if there are other registrations for this email
      hasMultipleRegistrations: searchType === 'email' && !includeAllRegistrations ? 
        await prisma.registration.count({ 
          where: { email: searchValue.toLowerCase().trim() } 
        }) > 1 : false
    }

    console.log('Ticket status found:', {
      registrationId: responseData.id,
      email: responseData.email,
      ticketCount: responseData.ticketsSummary.total,
      hasMultiple: responseData.hasMultipleRegistrations
    })

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

// ✅ ENHANCED GET method with multiple registrations support
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const ticketNumber = searchParams.get('ticket')
    const includeAll = searchParams.get('includeAll') === 'true'
    
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
    const mockBody = { 
      searchType, 
      searchValue,
      includeAllRegistrations: includeAll
    }
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