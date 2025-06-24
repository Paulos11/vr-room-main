// src/app/api/send-payment-email/route.ts - Manual email sending for testing
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, registrationId } = await request.json()

    if (!sessionId && !registrationId) {
      return NextResponse.json(
        { success: false, message: 'Session ID or Registration ID required' },
        { status: 400 }
      )
    }

    console.log('Manual email sending for:', { sessionId, registrationId })

    // Find registration either by sessionId or registrationId
    let registration
    if (sessionId) {
      const payment = await prisma.payment.findUnique({
        where: { stripePaymentId: sessionId },
        include: {
          registration: {
            include: {
              tickets: { 
                include: {
                  ticketType: true // Include ticket type information for sessionId path too
                },
                orderBy: { ticketSequence: 'asc' } 
              }
            }
          }
        }
      })
      registration = payment?.registration
    } else {
      registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          tickets: { 
            include: {
              ticketType: true // Include ticket type information
            },
            orderBy: { ticketSequence: 'asc' } 
          }
        }
      })
    }

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    if (!registration.tickets || registration.tickets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No tickets found for this registration' },
        { status: 404 }
      )
    }

    console.log('Found registration:', {
      id: registration.id,
      email: registration.email,
      ticketCount: registration.tickets.length,
      isEmsClient: registration.isEmsClient
    })

    // Generate PDF tickets
    console.log('Generating PDF tickets...')
    const pdfBuffer = await PDFTicketGenerator.generateTicketsFromRegistration(registration)
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

    // Prepare email data
    const customerName = `${registration.firstName} ${registration.lastName}`
    const emailData: RegistrationEmailData = {
      registrationId: registration.id,
      customerName,
      email: registration.email,
      phone: registration.phone,
      isEmsClient: registration.isEmsClient,
      ticketCount: registration.tickets.length,
      finalAmount: registration.finalAmount,
      appliedCouponCode: registration.appliedCouponCode || undefined,
      tickets: registration.tickets.map(ticket => ({
        ticketNumber: ticket.ticketNumber,
        customerName,
        email: registration.email,
        phone: registration.phone,
        qrCode: ticket.qrCode,
        sequence: ticket.ticketSequence || 1,
        totalTickets: registration.tickets.length,
        isEmsClient: registration.isEmsClient,
        ticketTypeName: ticket.ticketType?.name || 'General Admission',
        ticketTypePrice: ticket.purchasePrice || 0
      }))
    }

    // Send email with PDF attachment
    console.log('Sending email to:', registration.email)
    const emailSent = await EmailService.sendPaymentConfirmation(emailData, pdfBuffer)
    console.log('Email sent result:', emailSent)

    if (emailSent) {
      // Update tickets status to SENT
      await prisma.ticket.updateMany({
        where: { registrationId: registration.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      })

      // Log successful email
      await prisma.emailLog.create({
        data: {
          registrationId: registration.id,
          emailType: 'PAYMENT_CONFIRMATION',
          subject: '🎉 Payment Successful - Your EMS Tickets Are Ready!',
          recipient: registration.email,
          status: 'SENT'
        }
      })
    } else {
      // Log failed email
      await prisma.emailLog.create({
        data: {
          registrationId: registration.id,
          emailType: 'PAYMENT_CONFIRMATION',
          subject: 'Failed to send payment confirmation',
          recipient: registration.email,
          status: 'FAILED',
          errorMessage: 'Email service returned false'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? 'Email sent successfully!' : 'Email failed to send',
      data: {
        registrationId: registration.id,
        email: registration.email,
        ticketCount: registration.tickets.length,
        emailSent,
        pdfGenerated: true
      }
    })

  } catch (error: any) {
    console.error('Error sending manual email:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}