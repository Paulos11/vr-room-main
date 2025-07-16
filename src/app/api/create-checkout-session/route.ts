// FIXED: src/app/api/create-checkout-session/route.ts - VR Registration Compatible
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import Stripe from 'stripe'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'

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

    // ✅ UPDATED: Handle different VR registration statuses
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

    // ✅ CRITICAL: Parse VR experience selections from adminNotes
    let selectedTickets: SelectedTicket[] = []
    if (registration.adminNotes) {
      try {
        // Extract the VR booking details
        if (registration.adminNotes.includes('VR Booking - Selected experiences:')) {
          const match = registration.adminNotes.match(/Selected experiences: (\[.*\])/)
          if (match) {
            selectedTickets = JSON.parse(match[1]) as SelectedTicket[]
            console.log('✅ Parsed VR selections from adminNotes:', selectedTickets)
          }
        } else {
          // Try parsing as direct JSON (fallback)
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

    // ✅ Handle 100% free VR bookings (bypass Stripe completely)
    if (totalAmount <= 0) {
      console.log('🎉 Processing 100% free VR booking - bypassing Stripe')
      
      try {
        // Mark as completed and generate tickets in transaction
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

          // ✅ GENERATE VR SESSION TICKETS for free bookings
          const tickets = []
          let sessionSequence = 1

          for (const selectedTicket of selectedTickets) {
            // Validate VR experience
            const ticketType = await tx.ticketType.findUnique({
              where: { id: selectedTicket.ticketTypeId }
            })

            if (!ticketType || !ticketType.isActive) {
              throw new Error(`VR experience ${selectedTicket.name} is no longer available`)
            }

            if (ticketType.availableStock < selectedTicket.quantity) {
              throw new Error(`Insufficient VR sessions for ${selectedTicket.name}`)
            }

            const pricePerSession = Math.round(selectedTicket.priceInCents / selectedTicket.quantity)

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
                  purchasePrice: 0, // Free session
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
                reservedStock: { decrement: selectedTicket.quantity }, // Remove from reserved
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
            console.log(`Coupon ${registration.appliedCouponCode} usage incremented for free VR booking`)
          }

          return { tickets }
        })

        // Send VR confirmation email with tickets
        try {
          const customerName = `${registration.firstName} ${registration.lastName}`
          console.log(`Sending free VR session confirmation: ${result.tickets.length} tickets`)

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
          // Don't fail the booking if email fails
        }

        // Return success response for free VR booking
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

    // ✅ Continue with regular Stripe checkout for paid VR bookings
    console.log('Processing paid VR booking through Stripe')

    // ✅ Build line items from VR experience selections (not existing tickets)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

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

      const itemName = selectedTicket.quantity > 1 
        ? `${selectedTicket.name} (${selectedTicket.quantity} sessions)`
        : selectedTicket.name

      const description = `VR Room Malta - ${selectedTicket.name} | Duration: 5 Minutes per session`
      const unitAmount = Math.max(1, Math.round(selectedTicket.priceInCents / selectedTicket.quantity))

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: itemName,
            description: description,
          },
          unit_amount: unitAmount,
        },
        quantity: selectedTicket.quantity,
      })
    }

    // ✅ CRITICAL: Final validation that we have line items
    if (!lineItems || lineItems.length === 0) {
      console.error('❌ No line items generated for VR Stripe session')
      return NextResponse.json(
        { success: false, message: 'Unable to process VR booking payment. Please contact support.' },
        { status: 500 }
      )
    }

    console.log('VR Stripe line items:', lineItems.map(item => ({
      name: item.price_data?.product_data?.name,
      unit_amount: item.price_data?.unit_amount,
      quantity: item.quantity,
      total: (item.price_data?.unit_amount || 0) * (item.quantity || 0)
    })))

    // Verify total matches registration
    const calculatedTotal = lineItems.reduce((sum: number, item) => 
      sum + ((item.price_data?.unit_amount || 0) * (item.quantity || 0)), 0
    )

    console.log('VR Total verification:', {
      registrationFinalAmount: totalAmount,
      calculatedFromSelections: calculatedTotal,
      matches: totalAmount === calculatedTotal,
      difference: Math.abs(totalAmount - calculatedTotal)
    })

    // Create VR checkout session configuration
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
    }

    // Add VR booking discount if applicable
    if (registration.discountAmount && registration.discountAmount > 0 && registration.appliedCouponCode) {
      try {
        console.log('Creating Stripe coupon for VR discount:', registration.discountAmount)
        
        const coupon = await stripe.coupons.create({
          amount_off: registration.discountAmount,
          currency: 'eur',
          duration: 'once',
          name: `${registration.appliedCouponCode} - VR Discount`,
          metadata: {
            registrationId: registrationId,
            originalCouponCode: registration.appliedCouponCode,
            bookingType: 'VR_EXPERIENCE'
          }
        })

        sessionConfig.discounts = [{
          coupon: coupon.id
        }]

        console.log('Created VR Stripe coupon:', coupon.id)
      } catch (couponError: any) {
        console.error('Failed to create VR discount coupon:', couponError.message)
        // Continue without coupon discount
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('VR Stripe session created successfully:', {
      sessionId: session.id,
      url: session.url,
      amount_total: session.amount_total,
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
    
    // Enhanced error handling for VR bookings
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