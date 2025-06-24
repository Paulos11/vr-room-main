// STEP 4: Enhanced API Routes - src/app/api/admin/ticket-types/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all ticket types for admin (with pricing tiers)
export async function GET() {
  try {
    const ticketTypes = await prisma.ticketType.findMany({
      include: {
        pricingTiers: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: {
        ticketTypes
      }
    })
  } catch (error) {
    console.error('Error fetching ticket types:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching ticket types' },
      { status: 500 }
    )
  }
}

// POST - Create new ticket type (with optional pricing tiers)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      category,
      pricingType,
      priceInCents, 
      basePrice,
      totalStock,
      maxPerOrder,
      minPerOrder,
      emsClientsOnly,
      publicOnly,
      featured,
      tags,
      notes,
      pricingTiers
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Ticket name is required' },
        { status: 400 }
      )
    }

    if (pricingType === 'TIERED') {
      if (!basePrice || basePrice <= 0) {
        return NextResponse.json(
          { success: false, message: 'Base price is required for tiered pricing' },
          { status: 400 }
        )
      }

      if (!pricingTiers || pricingTiers.length === 0) {
        return NextResponse.json(
          { success: false, message: 'At least one pricing tier is required' },
          { status: 400 }
        )
      }

      // Validate each tier
      for (let i = 0; i < pricingTiers.length; i++) {
        const tier = pricingTiers[i]
        if (!tier.name?.trim()) {
          return NextResponse.json(
            { success: false, message: `Tier ${i + 1} name is required` },
            { status: 400 }
          )
        }
        if (!tier.priceInCents || tier.priceInCents <= 0) {
          return NextResponse.json(
            { success: false, message: `Tier ${i + 1} price must be greater than 0` },
            { status: 400 }
          )
        }
        if (!tier.ticketCount || tier.ticketCount <= 0) {
          return NextResponse.json(
            { success: false, message: `Tier ${i + 1} ticket count must be greater than 0` },
            { status: 400 }
          )
        }
      }
    } else {
      if (priceInCents < 0) {
        return NextResponse.json(
          { success: false, message: 'Price cannot be negative' },
          { status: 400 }
        )
      }
    }

    if (totalStock < 0) {
      return NextResponse.json(
        { success: false, message: 'Stock cannot be negative' },
        { status: 400 }
      )
    }

    // Create ticket type with transaction for tiered pricing
    const result = await prisma.$transaction(async (tx) => {
      // Create the main ticket type
      const ticketType = await tx.ticketType.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          category: category?.trim() || null,
          pricingType: pricingType || 'FIXED',
          priceInCents: parseInt(priceInCents) || 0,
          basePrice: pricingType === 'TIERED' ? parseInt(basePrice) : null,
          hasTieredPricing: pricingType === 'TIERED',
          totalStock: parseInt(totalStock),
          availableStock: parseInt(totalStock),
          maxPerOrder: parseInt(maxPerOrder) || 10,
          minPerOrder: parseInt(minPerOrder) || 1,
          emsClientsOnly: Boolean(emsClientsOnly),
          publicOnly: Boolean(publicOnly),
          featured: Boolean(featured),
          tags: tags ? JSON.stringify(tags) : null,
          notes: notes?.trim() || null,
          createdBy: 'admin', // TODO: Get from session
          isActive: true
        }
      })

      // Create pricing tiers if tiered pricing
      if (pricingType === 'TIERED' && pricingTiers && pricingTiers.length > 0) {
        const tiersData = pricingTiers.map((tier: any, index: number) => {
          // Calculate savings
          const regularPrice = parseInt(basePrice) * tier.ticketCount
          const savingsAmount = Math.max(0, regularPrice - tier.priceInCents)
          const savingsPercent = regularPrice > 0 ? (savingsAmount / regularPrice) * 100 : 0
          const pricePerTicket = tier.priceInCents / tier.ticketCount

          return {
            ticketTypeId: ticketType.id,
            name: tier.name.trim(),
            description: tier.description?.trim() || null,
            priceInCents: parseInt(tier.priceInCents),
            ticketCount: parseInt(tier.ticketCount),
            pricePerTicket: Math.round(pricePerTicket),
            savingsAmount: Math.round(savingsAmount),
            savingsPercent: Math.round(savingsPercent * 100) / 100, // Round to 2 decimal places
            sortOrder: tier.sortOrder || index,
            isPopular: Boolean(tier.isPopular),
            isActive: true
          }
        })

        await tx.pricingTier.createMany({
          data: tiersData
        })
      }

      // Return the complete ticket type with tiers
      return await tx.ticketType.findUnique({
        where: { id: ticketType.id },
        include: {
          pricingTiers: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: { ticketType: result },
      message: 'Ticket type created successfully'
    })
  } catch (error) {
    console.error('Error creating ticket type:', error)
    return NextResponse.json(
      { success: false, message: 'Error creating ticket type' },
      { status: 500 }
    )
  }
}
