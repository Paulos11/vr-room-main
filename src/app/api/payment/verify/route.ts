// src/app/api/payment/verify/route.ts - Fixed ordering issue
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    console.log('Verifying payment session:', sessionId)

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID required' },
        { status: 400 }
      )
    }

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log('Stripe session status:', session.payment_status)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, message: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Get payment record from database
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: sessionId },
      include: {
        registration: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Get all tickets for this registration - Fixed ordering
    const tickets = await prisma.ticket.findMany({
      where: { registrationId: payment.registrationId },
      orderBy: { issuedAt: 'asc' } // Use issuedAt instead of createdAt
    })

    console.log(`Found ${tickets.length} tickets for registration ${payment.registrationId}`)

    const responseData = {
      registrationId: payment.registrationId,
      customerName: `${payment.registration.firstName} ${payment.registration.lastName}`,
      email: payment.registration.email,
      quantity: tickets.length,
      totalAmount: payment.amount,
      currency: payment.currency,
      paidAt: payment.paidAt || new Date().toISOString(),
      sessionId: session.id,
      ticketNumbers: tickets.map(t => t.ticketNumber)
    }

    console.log('Payment verification successful:', responseData)

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error: any) {
    console.error('Error verifying payment:', error.message)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json(
      { success: false, message: 'Failed to verify payment', error: error.message },
      { status: 500 }
    )
  }
}
