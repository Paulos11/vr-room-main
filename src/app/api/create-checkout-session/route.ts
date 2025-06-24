// src/app/api/create-checkout-session/route.ts - Fixed with discount application
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const CheckoutSchema = z.object({
  registrationId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== CHECKOUT SESSION DEBUG ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { registrationId } = CheckoutSchema.parse(body)

    // Get registration details with tickets and applied coupon
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

    console.log('Registration data:', {
      originalAmount: registration.originalAmount,
      discountAmount: registration.discountAmount,
      finalAmount: registration.finalAmount,
      appliedCouponCode: registration.appliedCouponCode
    })

    // Use the final amount from registration (already includes discount)
    const totalAmount = registration.finalAmount || 0

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // Group tickets by type for line items
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

    const lineItems = []

    // If there's a discount, show original price and discount as separate line items
    if (registration.discountAmount && registration.discountAmount > 0) {
      // Add original ticket items
      for (const group of Object.values(ticketGroups)) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${group.ticketType.name}${group.count > 1 ? ` (${group.count} tickets)` : ''}`,
              description: `EMS Trade Fair 2025 - ${group.ticketType.name}`,
            },
            unit_amount: group.ticketType.priceInCents,
          },
          quantity: group.count,
        })
      }

      // Add discount as a separate line item (negative amount not allowed, so we'll use Stripe coupons)
      // Create a one-time coupon for this specific discount
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

      console.log('Created Stripe coupon:', coupon.id, 'for discount:', registration.discountAmount)

      // Create checkout session with discount
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        discounts: [{
          coupon: coupon.id
        }],
        metadata: {
          registrationId,
          customerName: `${registration.firstName} ${registration.lastName}`,
          customerEmail: registration.email,
          customerPhone: registration.phone,
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
      })

      console.log('Stripe session created with discount:', session.id)

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

    } else {
      // No discount - create normal checkout session
      for (const group of Object.values(ticketGroups)) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${group.ticketType.name}${group.count > 1 ? ` (${group.count} tickets)` : ''}`,
              description: `EMS Trade Fair 2025 - ${group.ticketType.name}`,
            },
            unit_amount: group.ticketType.priceInCents,
          },
          quantity: group.count,
        })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        metadata: {
          registrationId,
          customerName: `${registration.firstName} ${registration.lastName}`,
          customerEmail: registration.email,
          customerPhone: registration.phone,
          panelInterest: registration.panelInterests.length > 0 ? 'yes' : 'no',
          eventName: 'EMS Trade Fair 2025',
          ticketQuantity: registration.tickets.length.toString()
        },
        customer_email: registration.email,
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancelled?id=${registrationId}`,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      })

      console.log('Stripe session created without discount:', session.id)

      await prisma.payment.upsert({
        where: { registrationId },
        update: {
          stripePaymentId: session.id,
          amount: totalAmount,
          originalAmount: totalAmount,
          status: 'PENDING'
        },
        create: {
          registrationId,
          stripePaymentId: session.id,
          amount: totalAmount,
          originalAmount: totalAmount,
          currency: 'eur',
          status: 'PENDING'
        }
      })

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        quantity: registration.tickets.length,
        totalAmount: totalAmount
      })
    }

  } catch (stripeError: any) {
    console.error('Stripe API Error:', stripeError.message)
    return NextResponse.json(
      { 
        success: false, 
        message: `Stripe Error: ${stripeError.message}`,
        errorType: stripeError.type
      },
      { status: 400 }
    )
  }
}
