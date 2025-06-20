// src/app/api/tickets/download/route.ts - Updated to handle payment completion
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'
import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const DownloadSchema = z.object({
  registrationId: z.string().optional(),
  ticketNumber: z.string().optional(),
  sessionId: z.string().optional(),
}).refine(data => data.registrationId || data.ticketNumber || data.sessionId, {
  message: "Either registrationId, ticketNumber, or sessionId must be provided"
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('registrationId')
    const ticketNumber = searchParams.get('ticketNumber')
    const sessionId = searchParams.get('sessionId')

    console.log('Ticket download request:', { registrationId, ticketNumber, sessionId })

    // Validate input
    const validatedData = DownloadSchema.parse({
      registrationId: registrationId || undefined,
      ticketNumber: ticketNumber || undefined,
      sessionId: sessionId || undefined
    })

    let registration = null

    // Find registration by different methods
    if (registrationId) {
      registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { 
          tickets: { orderBy: { ticketSequence: 'asc' } },
          payment: true
        }
      })
    } else if (ticketNumber) {
      const ticket = await prisma.ticket.findUnique({
        where: { ticketNumber },
        include: { 
          registration: { 
            include: { 
              tickets: { orderBy: { ticketSequence: 'asc' } },
              payment: true
            } 
          } 
        }
      })
      registration = ticket?.registration
    } else if (sessionId) {
      // If using sessionId, verify with Stripe first
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      if (session.payment_status === 'paid') {
        const payment = await prisma.payment.findUnique({
          where: { stripePaymentId: sessionId },
          include: { 
            registration: { 
              include: { 
                tickets: { orderBy: { ticketSequence: 'asc' } },
                payment: true
              } 
            } 
          }
        })
        
        registration = payment?.registration
        
        // If payment is successful but registration not completed, update it
        if (registration && registration.status === 'PAYMENT_PENDING') {
          console.log('Payment successful, updating registration status to COMPLETED')
          
          registration = await prisma.registration.update({
            where: { id: registration.id },
            data: { status: 'COMPLETED' },
            include: { 
              tickets: { orderBy: { ticketSequence: 'asc' } },
              payment: true
            }
          })
          
          // Also update tickets to SENT status
          await prisma.ticket.updateMany({
            where: { registrationId: registration.id },
            data: { 
              status: 'SENT',
              sentAt: new Date()
            }
          })
          
          // Update payment status
          await prisma.payment.update({
            where: { stripePaymentId: sessionId },
            data: {
              status: 'SUCCEEDED',
              paidAt: new Date()
            }
          })
          
          console.log('Registration and tickets updated successfully')
        }
      }
    }

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration or tickets not found' },
        { status: 404 }
      )
    }

    if (!registration.tickets || registration.tickets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No tickets found for this registration' },
        { status: 404 }
      )
    }

    // For paid registrations, allow download even if status is PAYMENT_PENDING
    // as long as payment is successful
    const isPaymentSuccessful = registration.payment?.status === 'SUCCEEDED' || 
                               (sessionId && await isStripePaymentSuccessful(sessionId))
    
    if (registration.status !== 'COMPLETED' && !isPaymentSuccessful) {
      return NextResponse.json(
        { success: false, message: 'Registration not completed yet' },
        { status: 400 }
      )
    }

    // Prepare ticket data for PDF generation
    const ticketDataArray = registration.tickets.map((ticket, index) => ({
      ticketNumber: ticket.ticketNumber,
      customerName: `${registration.firstName} ${registration.lastName}`,
      email: registration.email,
      phone: registration.phone,
      qrCode: ticket.qrCode,
      sequence: ticket.ticketSequence || (index + 1),
      totalTickets: registration.tickets.length,
      isEmsClient: registration.isEmsClient
    }))

    console.log(`Generating PDF for ${ticketDataArray.length} ticket(s)`)

    // Generate PDF
    const pdfBuffer = await PDFTicketGenerator.generateAllTicketsPDF(ticketDataArray)

    // Determine filename
    const customerName = `${registration.firstName}_${registration.lastName}`.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = registration.tickets.length === 1 
      ? `EMS_VIP_Ticket_${registration.tickets[0].ticketNumber}.pdf`
      : `EMS_VIP_Tickets_${customerName}_${registration.tickets.length}tickets.pdf`

    console.log(`Generated PDF: ${filename}`)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error: any) {
    console.error('Error generating ticket PDF:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request parameters', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to generate ticket PDF', error: error.message },
      { status: 500 }
    )
  }
}

async function isStripePaymentSuccessful(sessionId: string): Promise<boolean> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session.payment_status === 'paid'
  } catch (error) {
    console.error('Error checking Stripe payment status:', error)
    return false
  }
}
