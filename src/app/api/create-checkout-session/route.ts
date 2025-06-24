// FIXED: src/app/api/create-checkout-session/route.ts - Use actual paid prices
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
          },
          orderBy: { ticketSequence: 'asc' }
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

    console.log('Registration pricing details:', {
      registrationId,
      originalAmount: registration.originalAmount,
      discountAmount: registration.discountAmount,
      finalAmount: registration.finalAmount,
      ticketCount: registration.tickets.length
    })

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // ✅ FIXED: Build line items using ACTUAL purchase prices from tickets
    const ticketGroups = registration.tickets.reduce((groups, ticket) => {
      const key = `${ticket.ticketType.id}-${ticket.purchasePrice}` // Group by type AND price
      if (!groups[key]) {
        groups[key] = {
          ticketType: ticket.ticketType,
          purchasePrice: ticket.purchasePrice, // ✅ Use actual price paid
          count: 0
        }
      }
      groups[key].count++
      return groups
    }, {} as Record<string, { ticketType: any, purchasePrice: number, count: number }>)

    console.log('Ticket groups for Stripe:', Object.values(ticketGroups).map(group => ({
      name: group.ticketType.name,
      originalPrice: group.ticketType.priceInCents,
      actualPrice: group.purchasePrice,
      count: group.count,
      total: group.purchasePrice * group.count
    })))

    const lineItems = Object.values(ticketGroups).map(group => {
      const itemName = group.count > 1 
        ? `${group.ticketType.name} (${group.count} tickets)`
        : group.ticketType.name
      
      // ✅ Show tier discount in description if applicable
      let description = `EMS Trade Fair 2025 - ${group.ticketType.name}`
      if (group.purchasePrice < group.ticketType.priceInCents) {
        const savedPerTicket = group.ticketType.priceInCents - group.purchasePrice
        description += ` | Volume discount applied: Save €${(savedPerTicket / 100).toFixed(2)} per ticket`
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: itemName,
            description: description,
          },
          unit_amount: group.purchasePrice, // ✅ Use actual purchase price (includes tier discounts)
        },
        quantity: group.count,
      }
    })

    console.log('Stripe line items:', lineItems.map(item => ({
      name: item.price_data.product_data.name,
      unit_amount: item.price_data.unit_amount,
      quantity: item.quantity,
      total: item.price_data.unit_amount * item.quantity
    })))

    // Verify total matches registration
    const calculatedTotal = lineItems.reduce((sum, item) => 
      sum + (item.price_data.unit_amount * item.quantity), 0
    )

    console.log('Total verification:', {
      registrationFinalAmount: totalAmount,
      calculatedFromTickets: calculatedTotal,
      matches: totalAmount === calculatedTotal
    })

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

    // ✅ IMPROVED: Only add coupon discount if there's additional coupon savings beyond tier discounts
    if (registration.discountAmount && registration.discountAmount > 0 && registration.appliedCouponCode) {
      try {
        console.log('Creating Stripe coupon for additional discount:', registration.discountAmount)
        
        const coupon = await stripe.coupons.create({
          amount_off: registration.discountAmount,
          currency: 'eur',
          duration: 'once',
          name: `${registration.appliedCouponCode} - Additional Discount`,
          metadata: {
            registrationId: registrationId,
            originalCouponCode: registration.appliedCouponCode,
            note: 'Additional discount beyond volume pricing'
          }
        })

        sessionConfig.discounts = [{
          coupon: coupon.id
        }]

        console.log('Created Stripe coupon:', coupon.id, 'for amount:', registration.discountAmount)
      } catch (couponError: any) {
        console.error('Failed to create discount coupon:', couponError.message)
        // Continue without coupon discount rather than failing completely
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('Stripe session created successfully:', {
      sessionId: session.id,
      url: session.url,
      amount_total: session.amount_total
    })

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

    console.log('Payment record updated/created')

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