// src/app/api/admin/ticket-types/route.ts - Updated to handle description
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all ticket types for admin
export async function GET() {
  try {
    const ticketTypes = await prisma.ticketType.findMany({
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

// POST - Create new ticket type
export async function POST(request: NextRequest) {
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
      notes
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Ticket name is required' },
        { status: 400 }
      )
    }

    if (priceInCents < 0) {
      return NextResponse.json(
        { success: false, message: 'Price cannot be negative' },
        { status: 400 }
      )
    }

    if (totalStock < 0) {
      return NextResponse.json(
        { success: false, message: 'Stock cannot be negative' },
        { status: 400 }
      )
    }

    // Create ticket type
    const ticketType = await prisma.ticketType.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        priceInCents: parseInt(priceInCents),
        totalStock: parseInt(totalStock),
        availableStock: parseInt(totalStock), // Initially all stock is available
        category: category?.trim() || null,
        emsClientsOnly: Boolean(emsClientsOnly),
        publicOnly: Boolean(publicOnly),
        maxPerOrder: parseInt(maxPerOrder) || 10,
        minPerOrder: parseInt(minPerOrder) || 1,
        featured: Boolean(featured),
        tags: tags ? JSON.stringify(tags) : null,
        notes: notes?.trim() || null,
        createdBy: 'admin', // TODO: Get from session
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { ticketType },
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
