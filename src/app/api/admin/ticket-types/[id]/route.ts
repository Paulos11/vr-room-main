
// STEP 4B: Enhanced API Routes - src/app/api/admin/ticket-types/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Update ticket type (with pricing tiers)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      isActive,
      pricingTiers
    } = body

    // Check if ticket type exists
    const existingTicket = await prisma.ticketType.findUnique({
      where: { id: params.id },
      include: {
        pricingTiers: true
      }
    })

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, message: 'Ticket type not found' },
        { status: 404 }
      )
    }

    // Validation (same as POST)
    if (name !== undefined && !name?.trim()) {
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
    }

    // Calculate new available stock if total stock is being updated
    let newAvailableStock = existingTicket.availableStock
    if (totalStock !== undefined && totalStock !== existingTicket.totalStock) {
      const stockDifference = totalStock - existingTicket.totalStock
      newAvailableStock = Math.max(0, existingTicket.availableStock + stockDifference)
    }

    // Update with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Prepare update data for main ticket type
      const updateData: any = {}
      
      if (name !== undefined) updateData.name = name.trim()
      if (description !== undefined) updateData.description = description?.trim() || null
      if (category !== undefined) updateData.category = category?.trim() || null
      if (pricingType !== undefined) {
        updateData.pricingType = pricingType
        updateData.hasTieredPricing = pricingType === 'TIERED'
      }
      if (priceInCents !== undefined) updateData.priceInCents = parseInt(priceInCents)
      if (basePrice !== undefined) updateData.basePrice = pricingType === 'TIERED' ? parseInt(basePrice) : null
      if (totalStock !== undefined) {
        updateData.totalStock = parseInt(totalStock)
        updateData.availableStock = newAvailableStock
      }
      if (maxPerOrder !== undefined) updateData.maxPerOrder = parseInt(maxPerOrder) || 10
      if (minPerOrder !== undefined) updateData.minPerOrder = parseInt(minPerOrder) || 1
      if (emsClientsOnly !== undefined) updateData.emsClientsOnly = Boolean(emsClientsOnly)
      if (publicOnly !== undefined) updateData.publicOnly = Boolean(publicOnly)
      if (featured !== undefined) updateData.featured = Boolean(featured)
      if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null
      if (notes !== undefined) updateData.notes = notes?.trim() || null
      if (isActive !== undefined) updateData.isActive = Boolean(isActive)

      // Update the main ticket type
      const ticketType = await tx.ticketType.update({
        where: { id: params.id },
        data: updateData
      })

      // Handle pricing tiers if this is tiered pricing
      if (pricingType === 'TIERED' && pricingTiers) {
        // Delete existing tiers
        await tx.pricingTier.deleteMany({
          where: { ticketTypeId: params.id }
        })

        // Create new tiers
        if (pricingTiers.length > 0) {
          const tiersData = pricingTiers.map((tier: any, index: number) => {
            // Calculate savings
            const regularPrice = parseInt(basePrice) * tier.ticketCount
            const savingsAmount = Math.max(0, regularPrice - tier.priceInCents)
            const savingsPercent = regularPrice > 0 ? (savingsAmount / regularPrice) * 100 : 0
            const pricePerTicket = tier.priceInCents / tier.ticketCount

            return {
              ticketTypeId: params.id,
              name: tier.name.trim(),
              description: tier.description?.trim() || null,
              priceInCents: parseInt(tier.priceInCents),
              ticketCount: parseInt(tier.ticketCount),
              pricePerTicket: Math.round(pricePerTicket),
              savingsAmount: Math.round(savingsAmount),
              savingsPercent: Math.round(savingsPercent * 100) / 100,
              sortOrder: tier.sortOrder || index,
              isPopular: Boolean(tier.isPopular),
              isActive: true
            }
          })

          await tx.pricingTier.createMany({
            data: tiersData
          })
        }
      } else if (pricingType === 'FIXED') {
        // Remove all tiers if switching to fixed pricing
        await tx.pricingTier.deleteMany({
          where: { ticketTypeId: params.id }
        })
      }

      // Return the complete updated ticket type
      return await tx.ticketType.findUnique({
        where: { id: params.id },
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
      message: 'Ticket type updated successfully'
    })
  } catch (error) {
    console.error('Error updating ticket type:', error)
    return NextResponse.json(
      { success: false, message: 'Error updating ticket type' },
      { status: 500 }
    )
  }
}

// DELETE - Delete ticket type (enhanced to handle tiers)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if ticket type exists
    const existingTicket = await prisma.ticketType.findUnique({
      where: { id: params.id },
      include: {
        tickets: true,
        pricingTiers: true
      }
    })

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, message: 'Ticket type not found' },
        { status: 404 }
      )
    }

    // Check if there are any sold tickets
    if (existingTicket.soldStock > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete ticket type with sold tickets. Disable it instead.' 
        },
        { status: 400 }
      )
    }

    // Check if there are any active tickets
    if (existingTicket.tickets.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete ticket type with existing tickets. Disable it instead.' 
        },
        { status: 400 }
      )
    }

    // Delete with transaction (will cascade delete pricing tiers)
    await prisma.$transaction(async (tx) => {
      // Delete pricing tiers first (though cascade should handle this)
      await tx.pricingTier.deleteMany({
        where: { ticketTypeId: params.id }
      })

      // Delete the ticket type
      await tx.ticketType.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Ticket type deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting ticket type:', error)
    return NextResponse.json(
      { success: false, message: 'Error deleting ticket type' },
      { status: 500 }
    )
  }
}