// FIXED: src/app/api/ticket-types/public/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isEmsClient = searchParams.get('isEmsClient') === 'true'

    // Get ALL active ticket types with available stock
    const ticketTypes = await prisma.ticketType.findMany({
      where: {
        isActive: true,
        availableStock: { gt: 0 }
      },
      include: {
        pricingTiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    console.log(`🎫 Found ${ticketTypes.length} ticket types for ${isEmsClient ? 'EMS' : 'Public'} customer`)

    // ✅ FIXED: Show single ticket with tiered pricing hints
    const formattedTicketTypes = ticketTypes.map(ticket => {
      // For EMS customers: Always show as single ticket, free
      if (isEmsClient) {
        return {
          id: ticket.id,
          name: ticket.name,
          description: ticket.description,
          category: ticket.category,
          pricingType: 'FIXED',
          priceInCents: 0, // Free for EMS
          availableStock: ticket.availableStock,
          maxPerOrder: 1, // EMS limited to 1
          minPerOrder: 1,
          featured: ticket.featured,
          imageUrl: ticket.imageUrl,
          tags: ticket.tags,
          parsedTags: ticket.tags ? JSON.parse(ticket.tags) : [],
          isAvailable: ticket.availableStock > 0,
          isFree: true,
          hasTieredPricing: false,
          tieredPricingNote: null
        }
      }

      // For public customers: Show single ticket with pricing hints
      let tieredPricingNote = null
      let basePrice = ticket.priceInCents

      if (ticket.pricingType === 'TIERED' && ticket.pricingTiers && ticket.pricingTiers.length > 0) {
        // Create pricing hint from tiers
        const firstTier = ticket.pricingTiers[0]
        const bestTier = ticket.pricingTiers.reduce((best, current) => 
          current.savingsPercent > best.savingsPercent ? current : best
        )

        basePrice = firstTier.pricePerTicket || ticket.priceInCents

        // Create compact note about quantity discounts
        const tierNotes = ticket.pricingTiers.map(tier => {
          if (tier.savingsPercent > 0) {
            return `${tier.ticketCount} tickets = €${(tier.priceInCents / 100).toFixed(2)} (Save ${tier.savingsPercent.toFixed(1)}%)`
          } else {
            return `${tier.ticketCount} tickets = €${(tier.priceInCents / 100).toFixed(2)}`
          }
        })

        tieredPricingNote = {
          message: `Volume discounts available!`,
          bestOffer: `Best: ${bestTier.ticketCount} tickets for €${(bestTier.priceInCents / 100).toFixed(2)} (${bestTier.savingsPercent.toFixed(1)}% off)`,
          allOffers: tierNotes,
          tiers: ticket.pricingTiers.map(tier => ({
            quantity: tier.ticketCount,
            totalPrice: tier.priceInCents,
            savings: tier.savingsPercent,
            pricePerTicket: tier.pricePerTicket
          }))
        }
      }

      return {
        id: ticket.id,
        name: ticket.name,
        description: ticket.description,
        category: ticket.category,
        pricingType: ticket.pricingType,
        priceInCents: basePrice, // Per ticket price
        availableStock: ticket.availableStock,
        maxPerOrder: ticket.maxPerOrder,
        minPerOrder: ticket.minPerOrder,
        featured: ticket.featured,
        imageUrl: ticket.imageUrl,
        tags: ticket.tags,
        parsedTags: ticket.tags ? JSON.parse(ticket.tags) : [],
        isAvailable: ticket.availableStock > 0,
        isFree: basePrice === 0,
        hasTieredPricing: ticket.pricingType === 'TIERED',
        tieredPricingNote, // ✅ NEW: Compact pricing info
        // ✅ FIXED: Include raw tiers with proper structure for frontend calculation
        pricingTiers: ticket.pricingTiers?.map(tier => ({
          id: tier.id,
          name: tier.name,
          ticketCount: tier.ticketCount,
          priceInCents: tier.priceInCents,
          savingsAmount: tier.savingsAmount,
          savingsPercent: tier.savingsPercent,
          pricePerTicket: tier.pricePerTicket || Math.round(tier.priceInCents / tier.ticketCount),
          isPopular: tier.isPopular
        })) || []
      }
    })

    console.log(`✅ Returning ${formattedTicketTypes.length} formatted tickets`)

    return NextResponse.json({
      success: true,
      data: {
        ticketTypes: formattedTicketTypes,
        isEmsClient
      }
    })
  } catch (error) {
    console.error('Error fetching public ticket types:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching ticket types' },
      { status: 500 }
    )
  }
}