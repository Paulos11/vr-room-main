// src/app/api/create-checkout-session/route.ts - COMPLETE FIXED VERSION (NO COUPONS)
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import Stripe from 'stripe'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'

// Type definitions
interface SelectedTicket {
  ticketTypeId: string;
  name: string;
  priceInCents: number;
  quantity: number;
}

const CheckoutSchema = z.object({
  registrationId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== VR CHECKOUT SESSION DEBUG ===')
    
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

    console.log('🎮 VR Registration details:', {
      registrationId,
      status: registration.status,
      finalAmount: registration.finalAmount,
      hasTickets: registration.tickets.length > 0,
      hasAdminNotes: !!registration.adminNotes
    })

    // Handle different VR registration statuses
    if (registration.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: 'This VR booking is already completed' },
        { status: 400 }
      )
    }

    if (registration.status !== 'PAYMENT_PENDING') {
      return NextResponse.json(
        { success: false, message: `VR booking status is ${registration.status}. Payment not available.` },
        { status: 400 }
      )
    }

    const totalAmount = registration.finalAmount || 0

    console.log('VR Registration pricing details:', {
      registrationId,
      originalAmount: registration.originalAmount,
      discountAmount: registration.discountAmount,
      finalAmount: registration.finalAmount,
      existingTicketCount: registration.tickets.length
    })

    // Parse VR experience selections from adminNotes
    let selectedTickets: SelectedTicket[] = []
    if (registration.adminNotes) {
      try {
        if (registration.adminNotes.includes('VR Booking - Selected experiences:')) {
          const match = registration.adminNotes.match(/Selected experiences: (\[.*\])/)
          if (match) {
            selectedTickets = JSON.parse(match[1]) as SelectedTicket[]
            console.log('✅ Parsed VR selections from adminNotes:', selectedTickets)
          }
        } else {
          const notesData = JSON.parse(registration.adminNotes)
          if (notesData.pendingTickets) {
            selectedTickets = notesData.pendingTickets as SelectedTicket[]
          }
        }
      } catch (parseError) {
        console.warn('⚠️  Failed to parse VR selections from adminNotes:', parseError)
      }
    }

    // If no selections found, create fallback
    if (selectedTickets.length === 0) {
      console.warn('⚠️  No VR selections found in adminNotes - creating fallback')
      
      const defaultVRType = await prisma.ticketType.findFirst({
        where: { 
          isActive: true,
          availableStock: { gt: 0 },
          OR: [
            { category: 'VR_EXPERIENCE' },
            { tags: { contains: 'VR' } },
            { name: { contains: 'VR' } }
          ]
        }
      })

      if (!defaultVRType) {
        return NextResponse.json(
          { success: false, message: 'No VR experiences available. Please contact support.' },
          { status: 500 }
        )
      }

      selectedTickets = [{
        ticketTypeId: defaultVRType.id,
        name: defaultVRType.name,
        priceInCents: registration.originalAmount || defaultVRType.priceInCents,
        quantity: 1
      }]
    }

    console.log('🎮 VR Experiences to process:', selectedTickets)

    // Handle 100% free VR bookings ONLY (bypass Stripe completely)
    if (totalAmount <= 0) {
      console.log('🎉 Processing 100% free VR booking - bypassing Stripe')
      
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Update registration status
          await tx.registration.update({
            where: { id: registrationId },
            data: { 
              status: 'COMPLETED',
              verifiedAt: new Date()
            }
          })

          // Update payment record as completed
          await tx.payment.upsert({
            where: { registrationId },
            update: {
              status: 'SUCCEEDED',
              paidAt: new Date(),
              amount: 0
            },
            create: {
              registrationId,
              stripePaymentId: `free_vr_${Date.now()}`,
              amount: 0,
              originalAmount: registration.originalAmount || 0,
              currency: 'eur',
              status: 'SUCCEEDED',
              paidAt: new Date()
            }
          })

          // Generate VR session tickets for free bookings
          const tickets = []
          let sessionSequence = 1

          for (const selectedTicket of selectedTickets) {
            const ticketType = await tx.ticketType.findUnique({
              where: { id: selectedTicket.ticketTypeId }
            })

            if (!ticketType || !ticketType.isActive) {
              throw new Error(`VR experience ${selectedTicket.name} is no longer available`)
            }

            if (ticketType.availableStock < selectedTicket.quantity) {
              throw new Error(`Insufficient VR sessions for ${selectedTicket.name}`)
            }

            // Create individual VR session tickets
            for (let i = 0; i < selectedTicket.quantity; i++) {
              const sessionNumber = `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
              const qrCode = `${process.env.NEXT_PUBLIC_SITE_URL}/vr/checkin/${sessionNumber}`

              const ticket = await tx.ticket.create({
                data: {
                  registrationId: registration.id,
                  ticketTypeId: selectedTicket.ticketTypeId,
                  ticketNumber: sessionNumber,
                  ticketSequence: sessionSequence++,
                  qrCode,
                  purchasePrice: 0,
                  eventDate: new Date(),
                  venue: 'VR Room Malta',
                  boothLocation: 'Bugibba Square',
                  status: 'SENT'
                }
              })

              tickets.push(ticket)
            }

            // Update stock for VR experiences
            await tx.ticketType.update({
              where: { id: selectedTicket.ticketTypeId },
              data: {
                availableStock: { decrement: selectedTicket.quantity },
                reservedStock: { decrement: selectedTicket.quantity },
                soldStock: { increment: selectedTicket.quantity }
              }
            })
          }

          // Increment coupon usage if applied
          if (registration.appliedCouponId) {
            await tx.coupon.update({
              where: { id: registration.appliedCouponId },
              data: { currentUses: { increment: 1 } }
            })
          }

          return { tickets }
        })

        // Send VR confirmation email with tickets
        try {
          const customerName = `${registration.firstName} ${registration.lastName}`
          
          const emailData: RegistrationEmailData = {
            registrationId: registration.id,
            customerName,
            email: registration.email,
            phone: registration.phone,
            isEmsClient: false,
            ticketCount: result.tickets.length,
            finalAmount: 0,
            appliedCouponCode: registration.appliedCouponCode || undefined,
            tickets: result.tickets.map(ticket => ({
              ticketNumber: ticket.ticketNumber,
              customerName,
              email: registration.email,
              phone: registration.phone,
              qrCode: ticket.qrCode,
              sequence: ticket.ticketSequence || 1,
              totalTickets: result.tickets.length,
              isEmsClient: false
            }))
          }

          const emailSent = await EmailService.sendTicketDelivery(emailData)

          await prisma.emailLog.create({
            data: {
              registrationId,
              emailType: 'TICKET_DELIVERY',
              subject: '🎮 Your FREE VR Room Malta Session Tickets!',
              recipient: registration.email,
              status: emailSent ? 'SENT' : 'FAILED',
              errorMessage: emailSent ? null : 'Failed to send free VR tickets email'
            }
          })

          console.log(`Free VR booking completed successfully: ${registrationId}`)

        } catch (emailError: any) {
          console.error('Error sending free VR confirmation:', emailError)
        }

        return NextResponse.json({
          success: true,
          isFreeOrder: true,
          message: 'Free VR booking completed successfully! Your session tickets have been generated.',
          registrationId,
          totalAmount: 0,
          originalAmount: registration.originalAmount,
          discountAmount: registration.discountAmount,
          appliedCouponCode: registration.appliedCouponCode,
          sessionCount: result.tickets.length,
          redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?free_order=true&registration_id=${registrationId}&vr_booking=true`
        })

      } catch (freeOrderError: any) {
        console.error('Error processing free VR booking:', freeOrderError)
        return NextResponse.json(
          { success: false, message: `Failed to process free VR booking: ${freeOrderError.message}` },
          { status: 500 }
        )
      }
    }

    // Check for amounts too small for Stripe (but not zero)
    const STRIPE_MINIMUM_AMOUNT = 50 // €0.50
    
    if (totalAmount > 0 && totalAmount < STRIPE_MINIMUM_AMOUNT) {
      console.log(`⚠️  Amount ${totalAmount} cents is below Stripe minimum - cannot process payment`)
      return NextResponse.json(
        { 
          success: false, 
          message: `Payment amount €${(totalAmount/100).toFixed(2)} is below the minimum charge of €0.50. Please contact support or adjust your order.`,
          errorType: 'BelowMinimumAmount',
          suggestedAction: 'contact_support'
        },
        { status: 400 }
      )
    }

    // ✅ FIXED: Build line items using FINAL AMOUNT ONLY (NO COUPONS)
    console.log('🔧 FIXED: Building line items using final amount directly')
    
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const totalFinalAmount = registration.finalAmount || 0

    if (selectedTickets.length === 1) {
      // Single VR experience - use final amount directly
      const selectedTicket = selectedTickets[0]
      
      // Validate VR experience is still available
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: selectedTicket.ticketTypeId }
      })

      if (!ticketType || !ticketType.isActive) {
        return NextResponse.json(
          { success: false, message: `VR experience ${selectedTicket.name} is no longer available` },
          { status: 400 }
        )
      }

      if (ticketType.availableStock < selectedTicket.quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient VR sessions for ${selectedTicket.name}` },
          { status: 400 }
        )
      }

      // ✅ KEY FIX: Use final amount divided by quantity
      const unitAmount = Math.max(1, Math.round(totalFinalAmount / selectedTicket.quantity))
      const itemName = selectedTicket.quantity > 1 
        ? `${selectedTicket.name} (${selectedTicket.quantity} sessions)`
        : selectedTicket.name

      console.log('🔧 Single item calculation:', {
        finalAmount: totalFinalAmount,
        quantity: selectedTicket.quantity,
        unitAmount: unitAmount,
        calculatedTotal: unitAmount * selectedTicket.quantity
      })

      lineItems.push({
        price_data: {
          currency: 'eur', // ✅ ENSURE EUR CURRENCY
          product_data: {
            name: itemName,
            description: `VR Room Malta - ${selectedTicket.name} | Duration: 5 Minutes per session`,
          },
          unit_amount: unitAmount,
        },
        quantity: selectedTicket.quantity,
      })
    } else {
      // Multiple VR experiences - distribute final amount proportionally
      const totalOriginalCost = selectedTickets.reduce((sum, ticket) => sum + ticket.priceInCents, 0)
      
      for (const selectedTicket of selectedTickets) {
        // Validate VR experience is still available
        const ticketType = await prisma.ticketType.findUnique({
          where: { id: selectedTicket.ticketTypeId }
        })

        if (!ticketType || !ticketType.isActive) {
          return NextResponse.json(
            { success: false, message: `VR experience ${selectedTicket.name} is no longer available` },
            { status: 400 }
          )
        }

        if (ticketType.availableStock < selectedTicket.quantity) {
          return NextResponse.json(
            { success: false, message: `Insufficient VR sessions for ${selectedTicket.name}` },
            { status: 400 }
          )
        }

        // Calculate proportional share of the final amount
        const proportion = selectedTicket.priceInCents / totalOriginalCost
        const ticketFinalAmount = Math.round(totalFinalAmount * proportion)
        const unitAmount = Math.max(1, Math.round(ticketFinalAmount / selectedTicket.quantity))

        const itemName = selectedTicket.quantity > 1 
          ? `${selectedTicket.name} (${selectedTicket.quantity} sessions)`
          : selectedTicket.name

        lineItems.push({
          price_data: {
            currency: 'eur', // ✅ ENSURE EUR CURRENCY
            product_data: {
              name: itemName,
              description: `VR Room Malta - ${selectedTicket.name} | Duration: 5 Minutes per session`,
            },
            unit_amount: unitAmount,
          },
          quantity: selectedTicket.quantity,
        })
      }
    }

    // Verify the calculated total matches the registration final amount
    const calculatedTotal = lineItems.reduce((sum, item) => 
      sum + ((item.price_data?.unit_amount || 0) * (item.quantity || 0)), 0
    )

    console.log('✅ FIXED: VR Total verification:', {
      registrationFinalAmount: totalFinalAmount,
      calculatedFromLineItems: calculatedTotal,
      matches: Math.abs(totalFinalAmount - calculatedTotal) <= 10, // Allow 10 cent tolerance for rounding
      difference: Math.abs(totalFinalAmount - calculatedTotal),
      lineItemsCount: lineItems.length
    })

    console.log('✅ FIXED: VR Stripe line items:', lineItems.map(item => ({
      name: item.price_data?.product_data?.name,
      unit_amount: item.price_data?.unit_amount,
      quantity: item.quantity,
      total: (item.price_data?.unit_amount || 0) * (item.quantity || 0),
      currency: item.price_data?.currency
    })))

    // ✅ CRITICAL: Final validation that we have line items
    if (!lineItems || lineItems.length === 0) {
      console.error('❌ No line items generated for VR Stripe session')
      return NextResponse.json(
        { success: false, message: 'Unable to process VR booking payment. Please contact support.' },
        { status: 500 }
      )
    }

    // ✅ FIXED: Create VR checkout session configuration (NO DISCOUNTS/COUPONS)
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        registrationId,
        customerName: `${registration.firstName} ${registration.lastName}`,
        customerEmail: registration.email,
        customerPhone: registration.phone || '',
        bookingType: 'VR_EXPERIENCE',
        eventName: 'VR Room Malta',
        sessionQuantity: selectedTickets.reduce((sum: number, t) => sum + t.quantity, 0).toString(),
        originalAmount: registration.originalAmount?.toString() || '0',
        discountAmount: registration.discountAmount?.toString() || '0',
        appliedCouponCode: registration.appliedCouponCode || '',
        vrExperiences: JSON.stringify(selectedTickets.map(t => t.name))
      },
      customer_email: registration.email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&vr_booking=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancelled?id=${registrationId}&vr_booking=true`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      // ✅ NO DISCOUNTS SECTION - discount already applied in line items pricing
    }

    console.log('🔧 Creating Stripe session with configuration:', {
      mode: sessionConfig.mode,
      currency: lineItems[0]?.price_data?.currency,
      lineItemsCount: lineItems.length,
      totalAmount: calculatedTotal
    })

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('✅ VR Stripe session created successfully:', {
      sessionId: session.id,
      url: session.url,
      amount_total: session.amount_total,
      currency: session.currency,
      line_items_count: lineItems.length
    })

    // Update payment record for VR booking
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

    console.log('VR Payment record updated/created')

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      quantity: selectedTickets.reduce((sum: number, t) => sum + t.quantity, 0),
      totalAmount: totalAmount,
      originalAmount: registration.originalAmount,
      discountAmount: registration.discountAmount,
      appliedCouponCode: registration.appliedCouponCode,
      bookingType: 'VR_EXPERIENCE'
    })

  } catch (error: any) {
    console.error('VR Stripe API Error:', error)
    
    if (error.type === 'StripeInvalidRequestError') {
      console.error('VR Stripe request details:', {
        message: error.message,
        param: error.param,
        code: error.code
      })
      
      return NextResponse.json(
        { 
          success: false, 
          message: `VR booking payment error: ${error.message}`,
          errorType: error.type
        },
        { status: 400 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid VR booking request data',
          errorType: 'ValidationError',
          errors: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: `VR booking processing error: ${error.message}`,
        errorType: error.type || 'UnknownError'
      },
      { status: 500 }
    )
  }
}