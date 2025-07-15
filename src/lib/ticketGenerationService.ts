// src/lib/ticketGenerationService.ts - Payment-Gated Ticket Generation
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'

export class PaymentGatedTicketService {
  
  /**
   * Check if tickets should be auto-generated for a registration
   * Tickets are only generated when:
   * 1. Payment is completed (SUCCEEDED)
   * 2. Registration status is COMPLETED
   * 3. OR it's an EMS client (free tickets)
   * 4. OR admin manually approves
   */
  static async shouldGenerateTickets(registrationId: string): Promise<boolean> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        payment: true,
        tickets: true
      }
    })

    if (!registration) {
      throw new Error('Registration not found')
    }

    // Don't generate if tickets already exist
    if (registration.tickets.length > 0) {
      console.log(`❌ Tickets already exist for registration ${registrationId}`)
      return false
    }

    // ✅ CONDITION 1: EMS Clients get immediate tickets (free)
    if (registration.isEmsClient && registration.status === 'VERIFIED') {
      console.log(`✅ EMS Client - can generate tickets immediately`)
      return true
    }

    // ✅ CONDITION 2: Public customers need completed payment
    if (!registration.isEmsClient) {
      const hasCompletedPayment = registration.payment?.status === 'SUCCEEDED'
      const isCompleted = registration.status === 'COMPLETED'
      
      if (hasCompletedPayment && isCompleted) {
        console.log(`✅ Public customer - payment completed, can generate tickets`)
        return true
      } else {
        console.log(`❌ Public customer - payment not completed or registration not completed`)
        console.log(`   Payment status: ${registration.payment?.status || 'NO_PAYMENT'}`)
        console.log(`   Registration status: ${registration.status}`)
        return false
      }
    }

    // ✅ CONDITION 3: Admin override (manual generation)
    if (registration.status === 'COMPLETED' && registration.verifiedBy) {
      console.log(`✅ Admin verified - can generate tickets`)
      return true
    }

    console.log(`❌ Conditions not met for ticket generation`)
    return false
  }

  /**
   * Auto-generate tickets when payment is completed
   * This should be called from payment webhook or admin approval
   */
  static async autoGenerateTicketsOnPayment(registrationId: string, triggeredBy: string = 'SYSTEM'): Promise<any> {
    console.log(`🎫 Auto-generating tickets for registration ${registrationId}`)
    
    const canGenerate = await this.shouldGenerateTickets(registrationId)
    if (!canGenerate) {
      throw new Error('Conditions not met for automatic ticket generation')
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tickets: true
      }
    })

    if (!registration) {
      throw new Error('Registration not found')
    }

    // Prevent duplicate generation
    if (registration.tickets.length > 0) {
      console.log(`⚠️ Tickets already exist, skipping generation`)
      return { success: true, message: 'Tickets already exist', tickets: registration.tickets }
    }

    // For now, create 1 general admission ticket
    // In production, this should be based on what was ordered
    const defaultTicketType = await prisma.ticketType.findFirst({
      where: { 
        isActive: true,
        availableStock: { gt: 0 }
      }
    })

    if (!defaultTicketType) {
      throw new Error('No available ticket types found')
    }

    // Calculate quantity based on registration amount or default to 1
    let ticketQuantity = 1
    if (!registration.isEmsClient && registration.finalAmount > 0) {
      // Estimate quantity based on price (rough calculation)
      ticketQuantity = Math.max(1, Math.floor(registration.finalAmount / defaultTicketType.priceInCents))
    }

    const generatedTickets = []
    
    for (let i = 0; i < ticketQuantity; i++) {
      const ticket = await TicketService.createTicket({
        registrationId: registration.id,
        ticketTypeId: defaultTicketType.id,
        purchasePrice: registration.isEmsClient ? 0 : defaultTicketType.priceInCents,
        eventDate: new Date('2025-06-26'), // Your event date
        adminUser: triggeredBy
      })
      
      generatedTickets.push(ticket)
    }

    // Update stock
    await prisma.ticketType.update({
      where: { id: defaultTicketType.id },
      data: {
        availableStock: { decrement: ticketQuantity },
        soldStock: { increment: ticketQuantity }
      }
    })

    // Log the generation
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType: 'TICKET_DELIVERY',
        subject: `Tickets Auto-Generated - ${registration.firstName} ${registration.lastName}`,
        recipient: registration.email,
        status: 'SENT',
        templateUsed: 'auto-generation'
      }
    })

    console.log(`✅ Auto-generated ${generatedTickets.length} tickets for ${registration.firstName} ${registration.lastName}`)

    return {
      success: true,
      message: `Auto-generated ${generatedTickets.length} tickets`,
      tickets: generatedTickets,
      registration: registration
    }
  }

  /**
   * Manual ticket generation by admin (bypasses payment check)
   */
  static async adminGenerateTickets(
    registrationId: string, 
    ticketRequests: Array<{ticketTypeId: string, quantity: number}>,
    adminUser: string
  ): Promise<any> {
    console.log(`🎫 Admin generating tickets for registration ${registrationId}`)
    
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId }
    })

    if (!registration) {
      throw new Error('Registration not found')
    }

    const generatedTickets = []
    
    for (const request of ticketRequests) {
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: request.ticketTypeId }
      })

      if (!ticketType) {
        throw new Error(`Ticket type ${request.ticketTypeId} not found`)
      }

      if (ticketType.availableStock < request.quantity) {
        throw new Error(`Insufficient stock for ${ticketType.name}. Available: ${ticketType.availableStock}`)
      }

      for (let i = 0; i < request.quantity; i++) {
        const ticket = await TicketService.createTicket({
          registrationId: registration.id,
          ticketTypeId: request.ticketTypeId,
          purchasePrice: registration.isEmsClient ? 0 : ticketType.priceInCents,
          eventDate: new Date('2025-06-26'),
          adminUser: adminUser
        })
        
        generatedTickets.push(ticket)
      }

      // Update stock
      await prisma.ticketType.update({
        where: { id: request.ticketTypeId },
        data: {
          availableStock: { decrement: request.quantity },
          soldStock: { increment: request.quantity }
        }
      })
    }

    // Log admin generation
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType: 'TICKET_DELIVERY',
        subject: `Tickets Manually Generated by ${adminUser} - ${registration.firstName} ${registration.lastName}`,
        recipient: registration.email,
        status: 'SENT',
        templateUsed: 'admin-generation'
      }
    })

    console.log(`✅ Admin generated ${generatedTickets.length} tickets`)

    return {
      success: true,
      message: `Admin generated ${generatedTickets.length} tickets`,
      tickets: generatedTickets,
      registration: registration
    }
  }

  /**
   * Check registration status and determine next steps
   */
  static async getRegistrationTicketStatus(registrationId: string): Promise<{
    canGenerateTickets: boolean
    hasTickets: boolean
    reason: string
    nextSteps: string[]
    paymentStatus?: string
    registrationStatus: string
  }> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        payment: true,
        tickets: true
      }
    })

    if (!registration) {
      throw new Error('Registration not found')
    }

    const hasTickets = registration.tickets.length > 0
    const canGenerate = await this.shouldGenerateTickets(registrationId)
    
    let reason = ''
    let nextSteps: string[] = []

    if (hasTickets) {
      reason = 'Tickets already generated'
      nextSteps = ['View existing tickets', 'Resend tickets to customer']
    } else if (registration.isEmsClient) {
      if (registration.status === 'VERIFIED') {
        reason = 'EMS customer ready for tickets'
        nextSteps = ['Generate free tickets']
      } else {
        reason = 'EMS customer pending verification'
        nextSteps = ['Verify EMS customer', 'Generate tickets after verification']
      }
    } else {
      // Public customer
      const paymentStatus = registration.payment?.status || 'NO_PAYMENT'
      
      if (paymentStatus === 'SUCCEEDED' && registration.status === 'COMPLETED') {
        reason = 'Payment completed, ready for tickets'
        nextSteps = ['Generate tickets automatically']
      } else if (paymentStatus === 'PENDING' || paymentStatus === 'NO_PAYMENT') {
        reason = 'Waiting for payment completion'
        nextSteps = ['Complete payment process', 'Tickets will generate automatically after payment']
      } else if (registration.status !== 'COMPLETED') {
        reason = 'Registration not completed'
        nextSteps = ['Complete registration process', 'Process payment', 'Generate tickets']
      } else {
        reason = 'Payment failed or cancelled'
        nextSteps = ['Retry payment', 'Contact customer', 'Admin can manually generate if needed']
      }
    }

    return {
      canGenerateTickets: canGenerate,
      hasTickets,
      reason,
      nextSteps,
      paymentStatus: registration.payment?.status,
      registrationStatus: registration.status
    }
  }
}

/**
 * Webhook handler for payment completion
 * This should be called when Stripe/payment provider confirms payment
 */
export async function handlePaymentCompleted(
  paymentId: string, 
  paymentStatus: 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
): Promise<void> {
  console.log(`💳 Payment ${paymentId} status: ${paymentStatus}`)
  
  try {
    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentId },
      include: { registration: true }
    })

    if (!payment) {
      console.error(`❌ Payment ${paymentId} not found in database`)
      return
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        paidAt: paymentStatus === 'SUCCEEDED' ? new Date() : null
      }
    })

    // Update registration status
    if (paymentStatus === 'SUCCEEDED') {
      await prisma.registration.update({
        where: { id: payment.registrationId },
        data: {
          status: 'COMPLETED'
        }
      })

      // 🎫 AUTO-GENERATE TICKETS ON SUCCESSFUL PAYMENT
      try {
        await PaymentGatedTicketService.autoGenerateTicketsOnPayment(
          payment.registrationId, 
          'PAYMENT_WEBHOOK'
        )
        console.log(`✅ Tickets auto-generated for payment ${paymentId}`)
      } catch (ticketError) {
        console.error(`❌ Failed to auto-generate tickets for payment ${paymentId}:`, ticketError)
        // Don't throw here - payment was successful, ticket generation can be retried
      }
    }

    console.log(`✅ Payment ${paymentId} processed successfully`)
    
  } catch (error) {
    console.error(`❌ Error processing payment ${paymentId}:`, error)
    throw error
  }
}