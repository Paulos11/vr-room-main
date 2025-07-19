// src/app/api/webhooks/stripe/route.ts - Updated with plain text emails & ticket delivery
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
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

    console.log('🔔 Processing Stripe webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handlePaymentSuccess(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handlePaymentExpired(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    const registrationId = session.metadata?.registrationId

    if (!registrationId) {
      console.error('❌ No registration ID in payment session metadata')
      return
    }

    console.log(`💳 Processing successful payment for registration: ${registrationId}`)

    // Check if this is a VR booking from metadata
    const isVRBooking = session.metadata?.bookingType === 'VR_EXPERIENCE' || 
                       session.metadata?.vrExperiences ||
                       session.metadata?.eventName === 'VR Room Malta'
    
    if (isVRBooking) {
      console.log('🎮 Detected VR booking - processing VR payment success')
      await handleVRPaymentSuccess(registrationId, session)
    } else {
      console.log('🎫 Processing regular EMS ticket payment success')
      await handleRegularPaymentSuccess(registrationId, session)
    }

  } catch (error: any) {
    console.error('❌ Error handling payment success:', error.message)
    
    // Log the error for admin review
    try {
      await prisma.emailLog.create({
        data: {
          emailType: 'PAYMENT_CONFIRMATION',
          subject: 'Failed to process payment webhook',
          recipient: 'admin@vrroommalta.com',
          status: 'FAILED',
          errorMessage: `Webhook processing failed: ${error.message}`
        }
      })
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }
  }
}

async function handleVRPaymentSuccess(registrationId: string, session: Stripe.Checkout.Session) {
  try {
    console.log('🎮 Processing VR payment success for:', registrationId)

    // Use transaction to ensure all VR updates happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // Get VR registration with current status
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: {
          appliedCoupon: true,
          tickets: {
            include: {
              ticketType: true
            }
          }
        }
      })

      if (!registration) {
        throw new Error(`VR registration ${registrationId} not found`)
      }

      console.log(`📋 VR Registration found:`, {
        id: registration.id,
        email: registration.email,
        status: registration.status,
        existingTickets: registration.tickets.length,
        finalAmount: registration.finalAmount
      })

      // Update payment status
      await tx.payment.update({
        where: { stripePaymentId: session.id },
        data: {
          status: 'SUCCEEDED',
          paidAt: new Date()
        }
      })

      // Update registration status
      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'COMPLETED' }
      })

      // ✅ CRITICAL: Generate VR session tickets after payment
      let tickets = registration.tickets
      if (tickets.length === 0) {
        console.log('🎫 No tickets found - generating VR session tickets now...')

        // Parse VR selections from adminNotes
        let selectedTickets: any[] = []
        if (registration.adminNotes) {
          try {
            const match = registration.adminNotes.match(/Selected experiences: (\[.*\])/)
            if (match) {
              selectedTickets = JSON.parse(match[1])
              console.log('✅ Parsed VR selections:', selectedTickets.length, 'experiences')
            }
          } catch (parseError) {
            console.warn('⚠️  Failed to parse VR selections:', parseError)
          }
        }

        // Fallback: create default VR ticket if no selections found
        if (selectedTickets.length === 0) {
          console.log('🔄 No selections found, creating default VR ticket...')
          
          const defaultVRType = await tx.ticketType.findFirst({
            where: { 
              isActive: true,
              OR: [
                { category: 'VR_EXPERIENCE' },
                { tags: { contains: 'VR' } },
                { name: { contains: 'VR' } }
              ]
            }
          })

          if (defaultVRType) {
            selectedTickets = [{
              ticketTypeId: defaultVRType.id,
              name: defaultVRType.name,
              quantity: 1,
              priceInCents: registration.originalAmount || defaultVRType.priceInCents
            }]
          } else {
            throw new Error('No VR ticket types found in database')
          }
        }

        // Generate VR session tickets
        const newTickets = []
        let sessionSequence = 1

        for (const selectedTicket of selectedTickets) {
          console.log(`🎯 Processing VR experience: ${selectedTicket.name} x${selectedTicket.quantity}`)
          
          // Validate VR experience still available
          const ticketType = await tx.ticketType.findUnique({
            where: { id: selectedTicket.ticketTypeId }
          })

          if (!ticketType || !ticketType.isActive) {
            console.warn(`⚠️  VR experience ${selectedTicket.name} no longer available`)
            continue
          }

          // ✅ FIXED: Calculate correct price per session based on final amount
          const totalSessions = selectedTickets.reduce((sum, t) => sum + t.quantity, 0)
          const pricePerSession = Math.round((registration.finalAmount || 0) / totalSessions)

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
                purchasePrice: pricePerSession, // ✅ FIXED: Use actual paid amount per session
                eventDate: new Date(),
                venue: 'VR Room Malta',
                boothLocation: 'Bugibba Square, Malta',
                status: 'SENT'
              },
              include: {
                ticketType: true // ✅ FIXED: Include ticketType relation
              }
            })

            newTickets.push(ticket)
            console.log(`✅ Created VR session ticket ${i + 1}/${selectedTicket.quantity}: ${ticket.ticketNumber}`)
          }

          // Update VR experience stock
          await tx.ticketType.update({
            where: { id: selectedTicket.ticketTypeId },
            data: {
              availableStock: { decrement: selectedTicket.quantity },
              reservedStock: { decrement: selectedTicket.quantity },
              soldStock: { increment: selectedTicket.quantity }
            }
          })
        }

        tickets = newTickets
        console.log(`🎉 Generated ${tickets.length} VR session tickets total`)
      } else {
        console.log(`✅ VR tickets already exist: ${tickets.length} tickets`)
      }

      // Increment coupon usage for VR bookings
      if (registration.appliedCouponId) {
        await tx.coupon.update({
          where: { id: registration.appliedCouponId },
          data: { currentUses: { increment: 1 } }
        })
        console.log(`🎫 VR coupon ${registration.appliedCouponCode} usage incremented`)
      }

      return { registration, tickets }
    })

    // ✅ FIXED: Send VR session tickets via email with PDF using plain text service
    try {
      const customerName = `${result.registration.firstName} ${result.registration.lastName}`
      console.log(`📧 Sending VR session tickets email to: ${result.registration.email}`)

      // Generate PDF for VR tickets
      let pdfBuffer: Buffer | undefined
      try {
        const ticketDataForPDF = result.tickets.map((ticket: any, index: number) => ({
          ticketNumber: ticket.ticketNumber,
          customerName,
          email: result.registration.email,
          phone: result.registration.phone,
          qrCode: ticket.qrCode,
          sequence: index + 1,
          totalTickets: result.tickets.length,
          isEmsClient: false,
          isVRTicket: true, // ✅ Mark as VR ticket
          venue: 'VR Room Malta',
          boothLocation: 'Bugibba Square, Malta',
          ticketTypeName: 'VR Experience',
          ticketTypePrice: ticket.purchasePrice || 0
        }))

        pdfBuffer = await PDFTicketGenerator.generateAllTicketsPDF(ticketDataForPDF)
        console.log(`📄 Generated VR PDF with ${result.tickets.length} tickets`)
      } catch (pdfError) {
        console.error('⚠️  PDF generation failed:', pdfError)
        // Continue without PDF - don't block email
      }

      const emailData: RegistrationEmailData = {
        registrationId: result.registration.id,
        customerName,
        email: result.registration.email,
        phone: result.registration.phone,
        isEmsClient: false, // VR bookings are never EMS
        ticketCount: result.tickets.length,
        finalAmount: result.registration.finalAmount || 0,
        appliedCouponCode: result.registration.appliedCouponCode ?? undefined,
        tickets: result.tickets.map((ticket: any) => ({
          ticketNumber: ticket.ticketNumber,
          customerName,
          email: result.registration.email,
          phone: result.registration.phone,
          qrCode: ticket.qrCode,
          sequence: ticket.ticketSequence || 1,
          totalTickets: result.tickets.length,
          isEmsClient: false
        }))
      }

      // ✅ FIXED: Use new plain text email service for ticket delivery
      const emailSent = await EmailService.sendTicketDelivery(emailData, pdfBuffer)

      // Log VR email activity
      await prisma.emailLog.create({
        data: {
          registrationId,
          emailType: 'TICKET_DELIVERY',
          subject: `Your VR Session Tickets - VR Room Malta (${result.tickets.length} sessions)`,
          recipient: result.registration.email,
          status: emailSent ? 'SENT' : 'FAILED',
          errorMessage: emailSent ? null : 'Failed to send VR session tickets email'
        }
      })

      console.log(`🎉 VR payment success processing completed:`, {
        registrationId,
        emailSent,
        sessionCount: result.tickets.length,
        ticketsGenerated: true,
        pdfAttached: !!pdfBuffer,
        emailService: 'plain_text'
      })

    } catch (emailError: any) {
      console.error('❌ Error sending VR session tickets email:', emailError)
      
      // Log VR email failure but don't fail the webhook
      await prisma.emailLog.create({
        data: {
          registrationId,
          emailType: 'TICKET_DELIVERY',
          subject: 'Failed to send VR session tickets',
          recipient: result.registration.email,
          status: 'FAILED',
          errorMessage: `VR tickets email failed: ${emailError?.message || 'Unknown error'}`
        }
      })
    }

  } catch (error: any) {
    console.error('❌ Error handling VR payment success:', error.message)
    throw error
  }
}

async function handleRegularPaymentSuccess(registrationId: string, session: Stripe.Checkout.Session) {
  try {
    console.log('🎫 Processing regular EMS payment success for:', registrationId)

    // Use transaction for regular event ticket processing
    const result = await prisma.$transaction(async (tx) => {
      // Get registration with all related data
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: {
          appliedCoupon: true,
          tickets: {
            include: {
              ticketType: true
            },
            orderBy: { ticketSequence: 'asc' }
          }
        }
      })

      if (!registration) {
        throw new Error(`Registration ${registrationId} not found`)
      }

      // Update payment status
      await tx.payment.update({
        where: { stripePaymentId: session.id },
        data: {
          status: 'SUCCEEDED',
          paidAt: new Date()
        }
      })

      // Update registration status
      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'COMPLETED' }
      })

      // Update all tickets status to SENT
      await tx.ticket.updateMany({
        where: { registrationId: registrationId },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      })

      // Increment coupon usage for regular customers after payment
      if (registration.appliedCouponId && !registration.isEmsClient) {
        await tx.coupon.update({
          where: { id: registration.appliedCouponId },
          data: { currentUses: { increment: 1 } }
        })
        console.log(`Regular coupon ${registration.appliedCouponCode} usage incremented`)
      }

      return { registration, tickets: registration.tickets }
    })

    // ✅ FIXED: Send regular event confirmation email with tickets using plain text service
    try {
      const customerName = `${result.registration.firstName} ${result.registration.lastName}`
      console.log(`Sending regular EMS tickets to: ${result.registration.email}`)

      // Generate PDF for regular tickets
      let pdfBuffer: Buffer | undefined
      try {
        const ticketDataForPDF = result.tickets.map((ticket: any, index: number) => ({
          ticketNumber: ticket.ticketNumber,
          customerName,
          email: result.registration.email,
          phone: result.registration.phone,
          qrCode: ticket.qrCode,
          sequence: index + 1,
          totalTickets: result.tickets.length,
          isEmsClient: result.registration.isEmsClient,
          isVRTicket: false, // ✅ Regular tickets
          venue: 'Malta Fairs and Conventions Centre',
          boothLocation: 'EMS Booth - MFCC',
          ticketTypeName: ticket.ticketType?.name || 'General Admission',
          ticketTypePrice: ticket.purchasePrice || 0
        }))

        pdfBuffer = await PDFTicketGenerator.generateAllTicketsPDF(ticketDataForPDF)
        console.log(`📄 Generated EMS PDF with ${result.tickets.length} tickets`)
      } catch (pdfError) {
        console.error('⚠️  PDF generation failed:', pdfError)
      }

      const emailData: RegistrationEmailData = {
        registrationId: result.registration.id,
        customerName,
        email: result.registration.email,
        phone: result.registration.phone,
        isEmsClient: result.registration.isEmsClient,
        ticketCount: result.tickets.length,
        finalAmount: result.registration.finalAmount || 0,
        appliedCouponCode: result.registration.appliedCouponCode ?? undefined,
        tickets: result.tickets.map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          customerName,
          email: result.registration.email,
          phone: result.registration.phone,
          qrCode: ticket.qrCode,
          sequence: ticket.ticketSequence || 1,
          totalTickets: result.tickets.length,
          isEmsClient: result.registration.isEmsClient,
          ticketTypeName: ticket.ticketType?.name || 'General Admission',
          ticketTypePrice: ticket.purchasePrice || 0
        }))
      }

      // ✅ FIXED: Use new plain text email service
      const emailSent = await EmailService.sendTicketDelivery(emailData, pdfBuffer)

      await prisma.emailLog.create({
        data: {
          registrationId,
          emailType: 'TICKET_DELIVERY',
          subject: 'Your EMS Event Tickets',
          recipient: result.registration.email,
          status: emailSent ? 'SENT' : 'FAILED',
          errorMessage: emailSent ? null : 'Failed to send EMS tickets email'
        }
      })

    } catch (emailError: any) {
      console.error('Error sending regular event confirmation email:', emailError)
    }

  } catch (error: any) {
    console.error('Error handling regular payment success:', error.message)
    throw error
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

    await prisma.payment.update({
      where: { stripePaymentId: session.id },
      data: { status: 'CANCELLED' }
    })

  } catch (error: any) {
    console.error('Error handling payment expiration:', error.message)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`Payment failed for intent: ${paymentIntent.id}`)

    const payment = await prisma.payment.findFirst({
      where: { 
        stripePaymentId: {
          contains: paymentIntent.id
        }
      },
      include: { registration: true }
    })

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      })
    }

  } catch (error: any) {
    console.error('Error handling payment failure:', error.message)
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'VR Room Malta webhook endpoint is active',
    timestamp: new Date().toISOString(),
    emailServiceEnabled: !!process.env.RESEND_API_KEY,
    emailService: 'plain_text_design',
    ticketGeneration: 'enabled',
    pdfAttachment: 'enabled'
  })
}