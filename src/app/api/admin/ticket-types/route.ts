// src/app/api/admin/ticket-types/route.ts - Simplified
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServerAuthService } from '@/lib/server-auth'
import { z } from 'zod'

const CreateTicketTypeSchema = z.object({
  name: z.string().min(2).max(100),
  priceInCents: z.number().min(0),
  totalStock: z.number().min(0)
})

// GET - List all ticket types
export async function GET(request: NextRequest) {
  try {
    const currentUser = ServerAuthService.getCurrentUser(request)
    if (!currentUser || !ServerAuthService.hasRole(currentUser, 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const ticketTypes = await prisma.ticketType.findMany({
      select: {
        id: true,
        name: true,
        priceInCents: true,
        totalStock: true,
        reservedStock: true,
        soldStock: true,
        availableStock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
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

// POST - Create new ticket type
export async function POST(request: NextRequest) {
  try {
    const currentUser = ServerAuthService.getCurrentUser(request)
    if (!currentUser || !ServerAuthService.hasRole(currentUser, 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CreateTicketTypeSchema.parse(body)

    // Check for existing ticket type with same name
    const existingTicketType = await prisma.ticketType.findFirst({
      where: { name: validatedData.name }
    })

    if (existingTicketType) {
      return NextResponse.json(
        { success: false, message: 'A ticket type with this name already exists' },
        { status: 400 }
      )
    }

    // Create ticket type
    const ticketType = await prisma.ticketType.create({
      data: {
        name: validatedData.name,
        priceInCents: validatedData.priceInCents,
        currency: 'EUR',
        totalStock: validatedData.totalStock,
        availableStock: validatedData.totalStock,
        createdBy: currentUser.email,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Ticket type created successfully',
      data: ticketType
    })
  } catch (error: any) {
    console.error('Error creating ticket type:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Error creating ticket type' },
      { status: 500 }
    )
  }
}
