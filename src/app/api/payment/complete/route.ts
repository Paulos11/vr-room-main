
// src/app/api/payment/complete/route.ts - Manual completion endpoint
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Updated API version
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID required' },
        { status: 400 }
      )
    }

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, message: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: sessionId },
      include: { registration: true }
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Update registration status
    const updatedRegistration = await prisma.registration.update({
      where: { id: payment.registrationId },
      data: { status: 'COMPLETED' }
    })

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date()
      }
    })

    // Update ticket status
    await prisma.ticket.updateMany({
      where: { registrationId: payment.registrationId },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      data: {
        registrationId: updatedRegistration.id,
        status: updatedRegistration.status
      }
    })

  } catch (error: any) {
    console.error('Error completing registration:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to complete registration', error: error.message },
      { status: 500 }
    )
  }
}