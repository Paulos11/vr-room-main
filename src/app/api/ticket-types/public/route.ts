// FIXED: src/app/api/ticket-types/public/route.ts - Enhanced with proper tiered pricing
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isEmsClient = searchParams.get('isEmsClient') === 'true'
    const flow = searchParams.get('flow') // 'vr' or 'ems'

    console.log(`🎫 Fetching ticket types for ${flow || 'default'} flow, EMS: ${isEmsClient}`)

    // Get ALL active ticket types with available stock
    const ticketTypes = await prisma.ticketType.findMany({
      where: {
        isActive: true,
        availableStock: { gt: 0 },
        // Filter by flow if specified
        ...(flow === 'vr' && {
          OR: [
            { category: 'VR_EXPERIENCE' },
            { tags: { contains: 'VR' } },
            { name: { contains: 'VR' } }
          ]
        })
      },
      include: {
        pricingTiers: {
          where: { isActive: true },
          orderBy: { ticketCount: 'asc' } // ✅ FIXED: Order by quantity ascending
        }
      },
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    console.log(`🎫 Found ${ticketTypes.length} ticket types`)

    // ✅ FIXED: Enhanced tiered pricing processing
    const formattedTicketTypes = ticketTypes.map(ticket => {
      console.log(`Processing ticket: ${ticket.name}`, {
        hasTieredPricing: ticket.hasTieredPricing,
        tiersCount: ticket.pricingTiers?.length || 0,
        tiers: ticket.pricingTiers?.map(t => `${t.ticketCount} tickets for €${(t.priceInCents / 100).toFixed(2)}`)
      })

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
          tags: ticket.tags ? ticket.tags.split(',').map(tag => tag.trim()) : [],
          isAvailable: ticket.availableStock > 0,
          isFree: true,
          hasTieredPricing: false,
          tieredPricingNote: null,
          pricingTiers: []
        }
      }

      // For public customers: Show with full tiered pricing
      let tieredPricingNote = null
      let basePrice = ticket.priceInCents

      // ✅ FIXED: Enhanced tiered pricing processing
      if (ticket.hasTieredPricing && ticket.pricingTiers && ticket.pricingTiers.length > 0) {
        const tiers = ticket.pricingTiers.sort((a, b) => a.ticketCount - b.ticketCount)
        
        // Find base price (smallest tier or fallback to ticket price)
        const smallestTier = tiers[0]
        basePrice = smallestTier ? smallestTier.pricePerTicket : ticket.priceInCents

        // Find best savings tier
        const bestTier = tiers.reduce((best, current) => 
          current.savingsPercent > best.savingsPercent ? current : best
        )

        // Create tier description
        const tierDescriptions = tiers.map(tier => {
          const priceEach = tier.pricePerTicket || Math.round(tier.priceInCents / tier.ticketCount)
          const totalPrice = tier.priceInCents
          
          if (tier.savingsPercent > 0) {
            return `${tier.ticketCount} sessions = €${(totalPrice / 100).toFixed(2)} (€${(priceEach / 100).toFixed(2)} each - Save ${tier.savingsPercent.toFixed(0)}%)`
          } else {
            return `${tier.ticketCount} sessions = €${(totalPrice / 100).toFixed(2)} (€${(priceEach / 100).toFixed(2)} each)`
          }
        })

        tieredPricingNote = {
          message: `Volume discounts available!`,
          bestOffer: `Best Deal: ${bestTier.ticketCount} sessions for €${(bestTier.priceInCents / 100).toFixed(2)} (Save ${bestTier.savingsPercent.toFixed(0)}%)`,
          allOffers: tierDescriptions,
          tiers: tiers.map(tier => ({
            quantity: tier.ticketCount,
            totalPrice: tier.priceInCents,
            pricePerTicket: tier.pricePerTicket || Math.round(tier.priceInCents / tier.ticketCount),
            savings: tier.savingsAmount,
            savingsPercent: tier.savingsPercent
          }))
        }

        console.log(`✅ Created tiered pricing note for ${ticket.name}:`, tieredPricingNote)
      }

      return {
        id: ticket.id,
        name: ticket.name,
        description: ticket.description,
        category: ticket.category,
        pricingType: ticket.pricingType,
        priceInCents: basePrice, // Base price per ticket
        availableStock: ticket.availableStock,
        maxPerOrder: ticket.maxPerOrder,
        minPerOrder: ticket.minPerOrder,
        featured: ticket.featured,
        imageUrl: ticket.imageUrl,
        tags: ticket.tags ? ticket.tags.split(',').map(tag => tag.trim()) : [],
        // VR-specific fields (you might want to add these to your database)
        duration: 30, // Default duration
        maxPlayers: 1, // Default single player
        difficulty: 'Medium', // Default difficulty
        ageRating: '8+', // Default age rating
        
        // Computed fields
        isAvailable: ticket.availableStock > 0,
        isFree: basePrice === 0,
        hasTieredPricing: ticket.hasTieredPricing && ticket.pricingTiers && ticket.pricingTiers.length > 0,
        tieredPricingNote,
        
        // ✅ FIXED: Properly formatted pricing tiers
        pricingTiers: ticket.pricingTiers?.map(tier => ({
          id: tier.id,
          name: tier.name,
          description: tier.description,
          ticketCount: tier.ticketCount,
          priceInCents: tier.priceInCents, // Total price for this tier
          pricePerTicket: tier.pricePerTicket || Math.round(tier.priceInCents / tier.ticketCount),
          savingsAmount: tier.savingsAmount,
          savingsPercent: tier.savingsPercent,
          isPopular: tier.isPopular,
          sortOrder: tier.sortOrder
        })) || []
      }
    })

    console.log(`✅ Returning ${formattedTicketTypes.length} formatted tickets for ${flow || 'default'} flow`)

    return NextResponse.json({
      success: true,
      data: {
        ticketTypes: formattedTicketTypes,
        isEmsClient,
        flow: flow || 'default',
        totalCount: formattedTicketTypes.length
      }
    })
  } catch (error: any) {
    console.error('Error fetching public ticket types:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching ticket types', error: error.message },
      { status: 500 }
    )
  }
}