// src/app/api/admin/tickets/generate/route.ts - Enhanced with tiered pricing support
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TicketSchema = z.object({
  ticketTypeId: z.string(),
  name: z.string(),
  quantity: z.number().min(1).max(50),
  priceInCents: z.number().min(0), // Total price for this selection (with tier discounts)
  maxStock: z.number()
})

const GenerateTicketsSchema = z.object({
  registrationId: z.string(),
  tickets: z.array(TicketSchema),
  adminUser: z.string().optional()
})

// Define the type for ticket validation
interface TicketValidation {
  ticketType: {
    id: string
    name: string
    priceInCents: number
    availableStock: number
    pricingType: string
    pricingTiers?: Array<{
      id: string
      name: string
      priceInCents: number
      ticketCount: number
    }>
  }
  ticketRequest: {
    ticketTypeId: string
    name: string
    quantity: number
    priceInCents: number
    maxStock: number
  }
  finalPricePerTicket: number
  appliedTier: {
    id: string
    name: string
    priceInCents: number
    ticketCount: number
  } | null
  tierInfo: {
    tierId: string
    tierName: string
    originalQuantity: number
    tierTotalPrice: number
    tierTicketCount: number
    regularPrice: number
    tierPrice: number
    savings: number
    savingsPercent: number
  } | null
  totalPrice: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, tickets, adminUser } = GenerateTicketsSchema.parse(body)

    console.log('🎫 Admin ticket generation request:', { registrationId, tickets: tickets.length })

    // Verify registration exists
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tickets: true
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    // Get ticket types with pricing tiers
    const ticketTypeIds = tickets.map(t => t.ticketTypeId)
    const ticketTypes = await prisma.ticketType.findMany({
      where: { 
        id: { in: ticketTypeIds },
        isActive: true
      },
      include: {
        pricingTiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (ticketTypes.length !== ticketTypeIds.length) {
      return NextResponse.json(
        { success: false, message: 'One or more ticket types not found or inactive' },
        { status: 400 }
      )
    }

    // Validate stock availability and recalculate tier pricing
    const ticketValidations: TicketValidation[] = []
    
    for (const ticketRequest of tickets) {
      const ticketType = ticketTypes.find(tt => tt.id === ticketRequest.ticketTypeId)
      if (!ticketType) {
        throw new Error(`Ticket type ${ticketRequest.ticketTypeId} not found`)
      }
      
      if (ticketType.availableStock < ticketRequest.quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient stock for ${ticketType.name}. Available: ${ticketType.availableStock}, Requested: ${ticketRequest.quantity}` },
          { status: 400 }
        )
      }

      // ✅ NEW: Recalculate tier pricing on server side for security
      let finalPricePerTicket = ticketType.priceInCents
      let appliedTier = null
      let tierInfo = null

      // For EMS clients, tickets are always free
      if (registration.isEmsClient) {
        finalPricePerTicket = 0
      } else if (ticketType.pricingType === 'TIERED' && ticketType.pricingTiers && ticketType.pricingTiers.length > 0) {
        // Find the best tier for the requested quantity
        const sortedTiers = [...ticketType.pricingTiers].sort((a, b) => b.ticketCount - a.ticketCount)
        
        for (const tier of sortedTiers) {
          if (ticketRequest.quantity === tier.ticketCount) {
            // Exact match - use tier price per ticket
            finalPricePerTicket = Math.round(tier.priceInCents / tier.ticketCount)
            appliedTier = tier
            break
          } else if (ticketRequest.quantity > tier.ticketCount) {
            // For quantities larger than tier, calculate mixed pricing
            const completeTiers = Math.floor(ticketRequest.quantity / tier.ticketCount)
            const remainingTickets = ticketRequest.quantity % tier.ticketCount
            const mixedTotalPrice = (completeTiers * tier.priceInCents) + (remainingTickets * ticketType.priceInCents)
            const mixedPricePerTicket = Math.round(mixedTotalPrice / ticketRequest.quantity)
            
            if (mixedPricePerTicket < finalPricePerTicket) {
              finalPricePerTicket = mixedPricePerTicket
              appliedTier = tier
            }
          }
        }

        // Calculate tier info for storage
        if (appliedTier) {
          const regularPrice = ticketType.priceInCents * ticketRequest.quantity
          const tierPrice = finalPricePerTicket * ticketRequest.quantity
          tierInfo = {
            tierId: appliedTier.id,
            tierName: appliedTier.name,
            originalQuantity: ticketRequest.quantity,
            tierTotalPrice: appliedTier.priceInCents,
            tierTicketCount: appliedTier.ticketCount,
            regularPrice: regularPrice,
            tierPrice: tierPrice,
            savings: regularPrice - tierPrice,
            savingsPercent: regularPrice > 0 ? ((regularPrice - tierPrice) / regularPrice) * 100 : 0
          }
        }
      }

      ticketValidations.push({
        ticketType,
        ticketRequest,
        finalPricePerTicket,
        appliedTier,
        tierInfo,
        totalPrice: finalPricePerTicket * ticketRequest.quantity
      })
    }

    // Generate tickets in transaction
    const result = await prisma.$transaction(async (tx) => {
      const generatedTickets: any[] = []
      let totalOrderAmount = 0
      
      for (const validation of ticketValidations) {
        const { ticketType, ticketRequest, finalPricePerTicket, appliedTier, tierInfo } = validation
        
        for (let i = 0; i < ticketRequest.quantity; i++) {
          // Generate unique identifiers
          const timestamp = Date.now()
          const random = Math.random().toString(36).substr(2, 6).toUpperCase()
          const ticketNumber = `T${timestamp}${random}`
          const qrCode = `QR${timestamp}${random}`

          const ticket = await tx.ticket.create({
            data: {
              registrationId,
              ticketTypeId: ticketRequest.ticketTypeId,
              pricingTierId: appliedTier?.id || null, // ✅ NEW: Link to pricing tier
              ticketNumber,
              qrCode,
              purchasePrice: finalPricePerTicket, // Price per individual ticket
              tierInfo: tierInfo ? JSON.stringify(tierInfo) : undefined, // ✅ NEW: Store tier details (use undefined instead of null)
              eventDate: new Date('2025-06-26'), // Event dates: 26 June - 06 July
              venue: 'Malta Fairs and Conventions Centre',
              boothLocation: 'EMS Booth - MFCC',
              status: 'GENERATED',
              ticketSequence: generatedTickets.length + 1
            }
          })

          generatedTickets.push(ticket)
        }

        // Update ticket type stock
        await tx.ticketType.update({
          where: { id: ticketRequest.ticketTypeId },
          data: {
            availableStock: { decrement: ticketRequest.quantity },
            soldStock: { increment: ticketRequest.quantity }
          }
        })

        totalOrderAmount += validation.totalPrice
      }

      // Update registration with totals
      await tx.registration.update({
        where: { id: registrationId },
        data: {
          originalAmount: totalOrderAmount,
          finalAmount: totalOrderAmount,
          status: registration.isEmsClient || totalOrderAmount === 0 ? 'COMPLETED' : 'PAYMENT_PENDING'
        }
      })

      return {
        tickets: generatedTickets,
        totalGenerated: generatedTickets.length,
        totalAmount: totalOrderAmount
      }
    })

    // Log ticket generation
    await prisma.emailLog.create({
      data: {
        registrationId,
        emailType: 'TICKET_DELIVERY',
        subject: `${result.totalGenerated} Ticket(s) Generated by Admin`,
        recipient: registration.email,
        status: 'SENT'
      }
    })

    console.log(`✅ Admin generated ${result.totalGenerated} tickets for registration ${registrationId}`)

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${result.totalGenerated} ticket(s)`,
      data: {
        tickets: result.tickets.map(t => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          status: t.status,
          purchasePrice: t.purchasePrice,
          hasTierDiscount: t.pricingTierId !== null
        })),
        registration: {
          id: registration.id,
          name: `${registration.firstName} ${registration.lastName}`,
          email: registration.email,
          isEmsClient: registration.isEmsClient
        },
        summary: {
          totalTickets: result.totalGenerated,
          totalAmount: result.totalAmount,
          averagePricePerTicket: result.totalGenerated > 0 ? Math.round(result.totalAmount / result.totalGenerated) : 0
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error generating tickets:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to generate tickets', error: error.message },
      { status: 500 }
    )
  }
}