
// src/app/api/admin/ticket-types/stock/route.ts - Stock management endpoint
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const StockUpdateSchema = z.object({
  ticketTypeId: z.string(),
  action: z.enum(['reserve', 'release', 'sell', 'restock']),
  quantity: z.number().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const currentUser = AuthService.getInstance().getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ticketTypeId, action, quantity } = StockUpdateSchema.parse(body)

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId }
    })

    if (!ticketType) {
      return NextResponse.json(
        { success: false, message: 'Ticket type not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'reserve':
        if (ticketType.availableStock < quantity) {
          return NextResponse.json(
            { success: false, message: 'Insufficient available stock' },
            { status: 400 }
          )
        }
        updateData = {
          availableStock: ticketType.availableStock - quantity,
          reservedStock: ticketType.reservedStock + quantity
        }
        break

      case 'release':
        const maxRelease = Math.min(quantity, ticketType.reservedStock)
        updateData = {
          availableStock: ticketType.availableStock + maxRelease,
          reservedStock: ticketType.reservedStock - maxRelease
        }
        break

      case 'sell':
        const maxSell = Math.min(quantity, ticketType.reservedStock)
        updateData = {
          reservedStock: ticketType.reservedStock - maxSell,
          soldStock: ticketType.soldStock + maxSell
        }
        break

      case 'restock':
        updateData = {
          totalStock: ticketType.totalStock + quantity,
          availableStock: ticketType.availableStock + quantity
        }
        break
    }

    const updatedTicketType = await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: `Stock ${action} completed successfully`,
      data: updatedTicketType
    })
  } catch (error: any) {
    console.error('Error updating stock:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Error updating stock' },
      { status: 500 }
    )
  }
}