// src/app/api/webhooks/stripe/route.ts - Enhanced with email integration
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Using stable API version
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Processing Stripe webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handlePaymentSuccess(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handlePaymentExpired(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    const registrationId = session.metadata?.registrationId

    if (!registrationId) {
      console.error('No registration ID in payment session metadata')
      return
    }

    console.log(`Processing successful payment for registration: ${registrationId}`)

    // Use transaction to ensure all updates happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // Get registration with all related data including ticket types
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: {
          appliedCoupon: true,
          tickets: {
            include: {
              ticketType: true // Include ticket type information
            },
            orderBy: { ticketSequence: 'asc' }
          }
        }
      })

      if (!registration) {
        throw new Error(`Registration ${registrationId} not found`)
      }

      // Update payment status
      await tx.payment.update({
        where: { stripePaymentId: session.id },
        data: {
          status: 'SUCCEEDED',
          paidAt: new Date()
        }
      })

      // Update registration status
      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'COMPLETED' }
      })

      // CRITICAL: Increment coupon usage for public customers after payment
      if (registration.appliedCouponId && !registration.isEmsClient) {
        await tx.coupon.update({
          where: { id: registration.appliedCouponId },
          data: { currentUses: { increment: 1 } }
        })
        
        console.log(`Coupon ${registration.appliedCouponCode} usage incremented after payment completion`)
      }

      // Handle ticket creation if needed (tickets should already exist from registration)
      let tickets = registration.tickets
      if (tickets.length === 0) {
        console.log(`No tickets found, creating tickets for registration: ${registrationId}`)
        // This shouldn't happen in normal flow, but handle it just in case
        const newTicket = await TicketService.createTicket(registrationId)
        if (newTicket) {
          tickets = [newTicket]
        } else {
          throw new Error('Failed to create ticket - createTicket returned null/undefined')
        }
      }

      // Update all tickets status to SENT
      await tx.ticket.updateMany({
        where: { registrationId: registrationId },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      })

      return { registration, tickets }
    })

    // 🎯 GENERATE PDF TICKETS AND SEND EMAIL
    try {
      const customerName = `${result.registration.firstName} ${result.registration.lastName}`
      
      // Use your existing PDF generator method - much cleaner!
      console.log(`Generating PDF for ${result.tickets.length} tickets`)
      const pdfBuffer = await PDFTicketGenerator.generateTicketsFromRegistration(result.registration)

      // Prepare email data
      const emailData: RegistrationEmailData = {
        registrationId: result.registration.id,
        customerName,
        email: result.registration.email,
        phone: result.registration.phone,
        isEmsClient: result.registration.isEmsClient,
        ticketCount: result.tickets.length,
        finalAmount: result.registration.finalAmount,
        appliedCouponCode: result.registration.appliedCouponCode || undefined,
        tickets: result.tickets.map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          customerName,
          email: result.registration.email,
          phone: result.registration.phone,
          qrCode: ticket.qrCode,
          sequence: ticket.ticketSequence || 1,
          totalTickets: result.tickets.length,
          isEmsClient: result.registration.isEmsClient,
          ticketTypeName: ticket.ticketType?.name || 'General Admission', // Include ticket type name
          ticketTypePrice: ticket.purchasePrice || 0 // Include ticket price
        }))
      }

      // Send payment confirmation email with PDF attachment
      console.log(`Sending payment confirmation email to: ${result.registration.email}`)
      const emailSent = await EmailService.sendPaymentConfirmation(emailData, pdfBuffer)

      // Log email activity
      await prisma.emailLog.create({
        data: {
          registrationId,
          emailType: 'PAYMENT_CONFIRMATION',
          subject: '🎉 Payment Successful - Your EMS Tickets Are Ready!',
          recipient: result.registration.email,
          status: emailSent ? 'SENT' : 'FAILED',
          errorMessage: emailSent ? null : 'Failed to send payment confirmation email'
        }
      })

      console.log(`Payment success processing completed:`, {
        registrationId,
        emailSent,
        ticketCount: result.tickets.length,
        pdfGenerated: true
      })

    } catch (emailError: any) {
      console.error('Error sending payment confirmation email:', emailError)
      
      // Log email failure but don't fail the webhook
      await prisma.emailLog.create({
        data: {
          registrationId,
          emailType: 'PAYMENT_CONFIRMATION',
          subject: 'Failed to send payment confirmation',
          recipient: result.registration.email,
          status: 'FAILED',
          errorMessage: `Email sending failed: ${emailError?.message || 'Unknown error'}`
        }
      })
    }

  } catch (error: any) {
    console.error('Error handling payment success:', error.message)

    // Log the error in database for admin review
    try {
      await prisma.emailLog.create({
        data: {
          emailType: 'TICKET_DELIVERY',
          subject: 'Failed to process payment webhook',
          recipient: 'info@ems.com.mt',
          status: 'FAILED',
          errorMessage: `Webhook processing failed: ${error.message}`
        }
      })
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }
  }
}

async function handlePaymentExpired(session: Stripe.Checkout.Session) {
  try {
    const registrationId = session.metadata?.registrationId

    if (!registrationId) {
      console.error('No registration ID in expired session metadata')
      return
    }

    console.log(`Processing expired payment for registration: ${registrationId}`)

    // Update payment status
    await prisma.payment.update({
      where: { stripePaymentId: session.id },
      data: { status: 'CANCELLED' }
    })

    // TODO: Optionally send payment expiration reminder email
    await prisma.emailLog.create({
      data: {
        registrationId,
        emailType: 'PAYMENT_REQUIRED',
        subject: 'Payment Session Expired - Complete Your Registration',
        recipient: session.customer_email || 'unknown@email.com',
        status: 'SENT'
      }
    })

    console.log(`Payment session expired for registration ${registrationId}`)

  } catch (error: any) {
    console.error('Error handling payment expiration:', error.message)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`Payment failed for intent: ${paymentIntent.id}`)

    // Find the associated payment record
    const payment = await prisma.payment.findFirst({
      where: { 
        stripePaymentId: {
          contains: paymentIntent.id
        }
      },
      include: { registration: true }
    })

    if (payment) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      })

      // TODO: Optionally send payment failure notification email
      await prisma.emailLog.create({
        data: {
          registrationId: payment.registrationId,
          emailType: 'PAYMENT_REQUIRED',
          subject: 'Payment Failed - Please Try Again',
          recipient: payment.registration.email,
          status: 'SENT'
        }
      })
    }

  } catch (error: any) {
    console.error('Error handling payment failure:', error.message)
  }
}

// Utility function to validate webhook in development
export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
    emailServiceEnabled: !!process.env.RESEND_API_KEY
  })
}