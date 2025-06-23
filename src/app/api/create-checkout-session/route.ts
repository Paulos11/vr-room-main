
// src/app/api/create-checkout-session/route.ts - Fixed with dynamic pricing
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Updated API version
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

    // Get registration details with tickets
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { 
        panelInterests: true,
        tickets: {
          include: {
            ticketType: true  // Include ticket type for pricing
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

    // Calculate total from actual ticket prices
    let totalAmount = 0
    const lineItems = []

    // Group tickets by type
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

    // Create line items for each ticket type
    for (const group of Object.values(ticketGroups)) {
      const itemTotal = group.ticketType.priceInCents * group.count
      totalAmount += itemTotal

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

    console.log(`Creating checkout for total: €${totalAmount/100}`)

    try {
      // Create new Stripe Checkout Session
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
          ticketQuantity: registration.tickets.length.toString(),
          totalTickets: registration.tickets.length.toString()
        },
        customer_email: registration.email,
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancelled?id=${registrationId}`,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      })

      console.log('Stripe session created:', session.id)

      // Create or update payment record
      await prisma.payment.upsert({
        where: { registrationId },
        update: {
          stripePaymentId: session.id,
          amount: totalAmount,
          originalAmount: totalAmount,  // Use calculated amount
          status: 'PENDING'
        },
        create: {
          registrationId,
          stripePaymentId: session.id,
          amount: totalAmount,
          originalAmount: totalAmount,  // Use calculated amount
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

  } catch (error: any) {
    console.error('Checkout session error:', error.message)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: `Server error: ${error.message}` },
      { status: 500 }
    )
  }
}