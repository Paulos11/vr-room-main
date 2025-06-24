
// 2. Fixed checkout session route - src/app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe' // Use centralized config
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import Stripe from 'stripe'

const CheckoutSchema = z.object({
  registrationId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== CHECKOUT SESSION DEBUG ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { registrationId } = CheckoutSchema.parse(body)

    // Get registration details
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { 
        panelInterests: true,
        tickets: {
          include: {
            ticketType: true
          }
        },
        payment: true
      }
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

    const totalAmount = registration.finalAmount || 0

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // Build line items
    const ticketGroups = registration.tickets.reduce((groups, ticket) => {
      const key = ticket.ticketType.id
      if (!groups[key]) {
        groups[key] = {
          ticketType: ticket.ticketType,
          count: 0
        }
      }
      groups[key].count++
      return groups
    }, {} as Record<string, { ticketType: any, count: number }>)

    const lineItems = Object.values(ticketGroups).map(group => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${group.ticketType.name}${group.count > 1 ? ` (${group.count} tickets)` : ''}`,
          description: `EMS Trade Fair 2025 - ${group.ticketType.name}`,
        },
        unit_amount: group.ticketType.priceInCents,
      },
      quantity: group.count,
    }))

    // Create checkout session configuration
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        registrationId,
        customerName: `${registration.firstName} ${registration.lastName}`,
        customerEmail: registration.email,
        customerPhone: registration.phone || '',
        panelInterest: registration.panelInterests.length > 0 ? 'yes' : 'no',
        eventName: 'EMS Trade Fair 2025',
        ticketQuantity: registration.tickets.length.toString(),
        originalAmount: registration.originalAmount?.toString() || '0',
        discountAmount: registration.discountAmount?.toString() || '0',
        appliedCouponCode: registration.appliedCouponCode || ''
      },
      customer_email: registration.email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancelled?id=${registrationId}`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    }

    // Add discount if applicable
    if (registration.discountAmount && registration.discountAmount > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: registration.discountAmount,
          currency: 'eur',
          duration: 'once',
          name: registration.appliedCouponCode || 'Discount Applied',
          metadata: {
            registrationId: registrationId,
            originalCouponCode: registration.appliedCouponCode || 'DISCOUNT'
          }
        })

        sessionConfig.discounts = [{
          coupon: coupon.id
        }]

        console.log('Created Stripe coupon:', coupon.id)
      } catch (couponError: any) {
        console.error('Failed to create discount coupon:', couponError.message)
        // Continue without discount rather than failing completely
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('Stripe session created:', session.id)

    // Update payment record
    await prisma.payment.upsert({
      where: { registrationId },
      update: {
        stripePaymentId: session.id,
        amount: totalAmount,
        originalAmount: registration.originalAmount || totalAmount,
        status: 'PENDING'
      },
      create: {
        registrationId,
        stripePaymentId: session.id,
        amount: totalAmount,
        originalAmount: registration.originalAmount || totalAmount,
        currency: 'eur',
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      quantity: registration.tickets.length,
      totalAmount: totalAmount,
      originalAmount: registration.originalAmount,
      discountAmount: registration.discountAmount,
      appliedCouponCode: registration.appliedCouponCode
    })

  } catch (error: any) {
    console.error('Stripe API Error:', error)
    
    // Better error handling for different Stripe error types
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid request: ${error.message}`,
          errorType: error.type
        },
        { status: 400 }
      )
    }

    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication failed - check API keys',
          errorType: error.type
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: `Payment processing error: ${error.message}`,
        errorType: error.type || 'UnknownError'
      },
      { status: 500 }
    )
  }
}
