// SOLUTION 4: Complete API Route Example
// File: src/app/api/tickets/download/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const DownloadSchema = z.object({
  registrationId: z.string().optional(),
  ticketNumber: z.string().optional(),
  sessionId: z.string().optional()
}).refine(
  (data) => data.registrationId || data.ticketNumber || data.sessionId,
  {
    message: "At least one of registrationId, ticketNumber, or sessionId must be provided"
  }
)

// Helper function to verify payment session (implement based on your Stripe setup)
async function verifyPaymentSession(sessionId: string) {
  try {
    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: sessionId },
      include: {
        registration: {
          include: {
            tickets: {
              include: {
                ticketType: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    if (payment.status !== 'SUCCEEDED') {
      return { success: false, error: 'Payment not completed' }
    }

    return {
      success: true,
      registrationId: payment.registrationId,
      registration: payment.registration
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return { success: false, error: 'Payment verification failed' }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const params = {
      registrationId: searchParams.get('registrationId'),
      ticketNumber: searchParams.get('ticketNumber'),
      sessionId: searchParams.get('sessionId')
    }

    console.log('Ticket download request:', params)

    // Validate input
    const validatedParams = DownloadSchema.parse(params)

    let registration = null

    // Route 1: Download by Stripe session ID (after payment)
    if (validatedParams.sessionId) {
      console.log(`Verifying payment session: ${validatedParams.sessionId}`)
      
      const paymentVerification = await verifyPaymentSession(validatedParams.sessionId)
      
      if (!paymentVerification.success) {
        return NextResponse.json(
          { error: paymentVerification.error },
          { status: 400 }
        )
      }

      registration = paymentVerification.registration
      console.log(`Payment verification successful for registration: ${registration?.id}`)
    }
    
    // Route 2: Download by registration ID (direct access)
    else if (validatedParams.registrationId) {
      registration = await prisma.registration.findUnique({
        where: { id: validatedParams.registrationId },
        include: {
          tickets: {
            include: {
              ticketType: true // ✅ CRITICAL: Include ticketType relation
            },
            orderBy: { ticketSequence: 'asc' }
          },
          payment: true
        }
      })

      // Verify registration can download tickets
      if (registration && registration.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Registration not completed yet' },
          { status: 400 }
        )
      }
    }
    
    // Route 3: Download by individual ticket number
    else if (validatedParams.ticketNumber) {
      const ticket = await prisma.ticket.findUnique({
        where: { ticketNumber: validatedParams.ticketNumber },
        include: {
          registration: true,
          ticketType: true // ✅ CRITICAL: Include ticketType relation
        }
      })

      if (!ticket) {
        return NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        )
      }

      // Get full registration with all tickets
      registration = await prisma.registration.findUnique({
        where: { id: ticket.registrationId },
        include: {
          tickets: {
            include: {
              ticketType: true // ✅ CRITICAL: Include ticketType relation
            },
            orderBy: { ticketSequence: 'asc' }
          }
        }
      })
    }

    // Validate we found a registration with tickets
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    if (!registration.tickets || registration.tickets.length === 0) {
      return NextResponse.json(
        { error: 'No tickets found for this registration' },
        { status: 404 }
      )
    }

    console.log(`Found ${registration.tickets.length} tickets for registration ${registration.id}`)

    // 🔍 DEBUG: Log ticket data before PDF generation
    console.log('🎫 Ticket data being sent to PDF generator:')
    registration.tickets.forEach((ticket: any, index: number) => {
      console.log(`  Ticket ${index + 1}:`, {
        ticketNumber: ticket.ticketNumber,
        ticketType: ticket.ticketType,
        ticketTypeName: ticket.ticketType?.name,
        ticketTypePrice: ticket.ticketType?.priceInCents,
        purchasePrice: ticket.purchasePrice,
        isEmsClient: registration.isEmsClient
      })
    })

    // Generate PDF with proper ticket type data
    console.log('Generating PDF for ticket(s)...')
    const pdfBuffer = await PDFTicketGenerator.generateTicketsFromRegistration(registration)

    // Generate appropriate filename
    const filename = registration.tickets.length === 1
      ? `EMS_Ticket_${registration.tickets[0].ticketNumber}.pdf`
      : `EMS_Tickets_${registration.firstName}_${registration.lastName}.pdf`

    console.log(`Generated PDF: ${filename}`)

    // Update ticket status to SENT (if not already)
    await prisma.ticket.updateMany({
      where: {
        registrationId: registration.id,
        status: { in: ['GENERATED'] }
      },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    })

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error('❌ Ticket download error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate tickets PDF' },
      { status: 500 }
    )
  }
}

// POST method for bulk ticket operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, registrationIds, ticketNumbers } = body

    if (action === 'bulk-download' && registrationIds) {
      // Bulk download for multiple registrations
      const registrations = await prisma.registration.findMany({
        where: {
          id: { in: registrationIds },
          status: 'COMPLETED'
        },
        include: {
          tickets: {
            include: {
              ticketType: true // ✅ CRITICAL: Include ticketType relation
            }
          }
        }
      })

      if (registrations.length === 0) {
        return NextResponse.json(
          { error: 'No valid registrations found' },
          { status: 404 }
        )
      }

      // Combine all tickets from all registrations
      const allTickets = registrations.flatMap(reg => 
        reg.tickets.map((ticket, index) => ({
          ticketNumber: ticket.ticketNumber,
          customerName: `${reg.firstName} ${reg.lastName}`,
          email: reg.email,
          phone: reg.phone,
          qrCode: ticket.qrCode,
          sequence: ticket.ticketSequence || (index + 1),
          totalTickets: reg.tickets.length,
          isEmsClient: reg.isEmsClient,
          ticketTypeName: ticket.ticketType?.name,
          ticketTypePrice: ticket.purchasePrice || ticket.ticketType?.priceInCents || 0
        }))
      )

      const pdfBuffer = await PDFTicketGenerator.generateAllTicketsPDF(allTickets)

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="EMS_Bulk_Tickets_${new Date().toISOString().split('T')[0]}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Bulk ticket operation error:', error)
    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    )
  }
}