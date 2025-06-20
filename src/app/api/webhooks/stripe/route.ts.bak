// src/app/api/webhooks/stripe/route.ts - Complete webhook handler
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
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

    console.log(`Received webhook: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed':
        await handlePaymentSuccess(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'checkout.session.expired':
        await handlePaymentExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded:', event.data.object.id)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
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

    // Update payment status
    const payment = await prisma.payment.update({
      where: { stripePaymentId: session.id },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date()
      }
    })

    // Update registration status
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'COMPLETED' }
    })

    // Generate ticket if it doesn't exist
    let ticket = await prisma.ticket.findUnique({
      where: { registrationId }
    })

    if (!ticket) {
      ticket = await TicketService.createTicket(registrationId)
    }

    // Update ticket as sent
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    })

    // Log successful ticket delivery email
    await prisma.emailLog.create({
      data: {
        registrationId,
        emailType: 'TICKET_DELIVERY',
        subject: 'Your EMS VIP Ticket is Ready!',
        recipient: registration.email,
        status: 'SENT'
      }
    })

    console.log(`Successfully processed payment for registration ${registrationId}`)

  } catch (error: any) {
    console.error('Error handling payment success:', error.message)
    
    // Log the error in database for admin review
    try {
      await prisma.emailLog.create({
        data: {
          emailType: 'TICKET_DELIVERY',
          subject: 'Failed to process payment webhook',
          recipient: 'admin@ems-events.com',
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

    // Log payment expiration
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

      // Log payment failure
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
    timestamp: new Date().toISOString()
  })
}