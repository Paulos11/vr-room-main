
// src/app/api/admin/ticket-types/[id]/route.ts - Simplified
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServerAuthService } from '@/lib/server-auth'
import { z } from 'zod'

const UpdateTicketTypeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  priceInCents: z.number().min(0).optional(),
  totalStock: z.number().min(0).optional(),
  isActive: z.boolean().optional()
})

// PUT - Update ticket type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = ServerAuthService.getCurrentUser(request)
    if (!currentUser || !ServerAuthService.hasRole(currentUser, 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateTicketTypeSchema.parse(body)

    // Check if ticket type exists
    const existingTicketType = await prisma.ticketType.findUnique({
      where: { id: params.id }
    })

    if (!existingTicketType) {
      return NextResponse.json(
        { success: false, message: 'Ticket type not found' },
        { status: 404 }
      )
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name && validatedData.name !== existingTicketType.name) {
      const nameConflict = await prisma.ticketType.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: params.id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { success: false, message: 'A ticket type with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Handle stock updates
    let updateData: any = { ...validatedData }
    
    if (validatedData.totalStock !== undefined) {
      const stockDifference = validatedData.totalStock - existingTicketType.totalStock
      updateData.availableStock = Math.max(0, existingTicketType.availableStock + stockDifference)
    }

    // Update ticket type
    const updatedTicketType = await prisma.ticketType.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Ticket type updated successfully',
      data: updatedTicketType
    })
  } catch (error: any) {
    console.error('Error updating ticket type:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Error updating ticket type' },
      { status: 500 }
    )
  }
}
