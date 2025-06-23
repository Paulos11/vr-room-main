
// src/app/api/ticket-types/public/route.ts - Public endpoint for customers
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isEmsClient = searchParams.get('isEmsClient') === 'true'

    // Get active ticket types with available stock
    const ticketTypes = await prisma.ticketType.findMany({
      where: {
        isActive: true,
        availableStock: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        priceInCents: true,
        availableStock: true,
        maxPerOrder: true,
        minPerOrder: true
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    // Format response for frontend
    const formattedTicketTypes = ticketTypes.map(ticket => ({
      ...ticket,
      formattedPrice: `€${(ticket.priceInCents / 100).toFixed(2)}`,
      isAvailable: ticket.availableStock > 0,
      isFree: ticket.priceInCents === 0
    }))

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