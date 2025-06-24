
// src/app/api/admin/ticket-types/[id]/route.ts - Update and Delete operations
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Update ticket type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      priceInCents, 
      totalStock,
      category,
      emsClientsOnly,
      publicOnly,
      maxPerOrder,
      minPerOrder,
      featured,
      tags,
      notes,
      isActive
    } = body

    // Check if ticket type exists
    const existingTicket = await prisma.ticketType.findUnique({
      where: { id: params.id }
    })

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, message: 'Ticket type not found' },
        { status: 404 }
      )
    }

    // Validation
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Ticket name is required' },
        { status: 400 }
      )
    }

    if (priceInCents !== undefined && priceInCents < 0) {
      return NextResponse.json(
        { success: false, message: 'Price cannot be negative' },
        { status: 400 }
      )
    }

    if (totalStock !== undefined && totalStock < 0) {
      return NextResponse.json(
        { success: false, message: 'Stock cannot be negative' },
        { status: 400 }
      )
    }

    // Calculate new available stock if total stock is being updated
    let newAvailableStock = existingTicket.availableStock
    if (totalStock !== undefined && totalStock !== existingTicket.totalStock) {
      const stockDifference = totalStock - existingTicket.totalStock
      newAvailableStock = Math.max(0, existingTicket.availableStock + stockDifference)
    }

    // Prepare update data
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (priceInCents !== undefined) updateData.priceInCents = parseInt(priceInCents)
    if (totalStock !== undefined) {
      updateData.totalStock = parseInt(totalStock)
      updateData.availableStock = newAvailableStock
    }
    if (category !== undefined) updateData.category = category?.trim() || null
    if (emsClientsOnly !== undefined) updateData.emsClientsOnly = Boolean(emsClientsOnly)
    if (publicOnly !== undefined) updateData.publicOnly = Boolean(publicOnly)
    if (maxPerOrder !== undefined) updateData.maxPerOrder = parseInt(maxPerOrder) || 10
    if (minPerOrder !== undefined) updateData.minPerOrder = parseInt(minPerOrder) || 1
    if (featured !== undefined) updateData.featured = Boolean(featured)
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    // Update ticket type
    const ticketType = await prisma.ticketType.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: { ticketType },
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

// DELETE - Delete ticket type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if ticket type exists
    const existingTicket = await prisma.ticketType.findUnique({
      where: { id: params.id },
      include: {
        tickets: true // Include related tickets
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

    // Delete the ticket type
    await prisma.ticketType.delete({
      where: { id: params.id }
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