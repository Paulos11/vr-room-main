// src/app/api/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Updated API version
})

const PaymentSchema = z.object({
  registrationId: z.string(),
  amount: z.number().min(1),
  currency: z.string().default('eur')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, amount, currency } = PaymentSchema.parse(body)

    // Get registration details
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    if (registration.status !== 'PAYMENT_PENDING') {
      return NextResponse.json(
        { success: false, message: 'Payment not required for this registration' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'EMS VIP Trade Fair Access',
              description: 'VIP access to EMS Trade Fair 2025 at MFCC',
              images: ['https://tickets.ems.com.mt/images/ems-logo.png'],
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        registrationId,
        customerName: `${registration.firstName} ${registration.lastName}`,
        customerEmail: registration.email,
      },
      customer_email: registration.email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment?id=${registrationId}`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        registrationId,
        stripePaymentId: session.id,
        amount,
        currency,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
