// src/app/api/admin/users/create/route.ts - Create user API with correct field names
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateUserSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(8),
  idCardNumber: z.string().optional(),
  isEmsClient: z.boolean(),
  customerName: z.string().optional(),
  orderNumber: z.string().optional(),
  hasPanelInterest: z.boolean().default(false),
  autoApprove: z.boolean().default(true),
  generateTickets: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateUserSchema.parse(body)

    // Check for existing registration with same email
    const existingRegistration = await prisma.registration.findUnique({
      where: { email: validatedData.email }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Get default ticket types
    const ticketTypes = await prisma.ticketType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    if (ticketTypes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No active ticket types available' },
        { status: 400 }
      )
    }

    // Create registration in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create registration with correct field names
      const registration = await tx.registration.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          idCardNumber: validatedData.idCardNumber || '',
          isEmsClient: validatedData.isEmsClient,
          // Updated field names
          customerName: validatedData.customerName || null,
          orderNumber: validatedData.orderNumber || null,
          originalAmount: 0,
          discountAmount: 0,
          finalAmount: 0,
          status: validatedData.autoApprove ? 'COMPLETED' : 'PENDING',
          adminNotes: 'Created by admin',
          verifiedAt: validatedData.autoApprove ? new Date() : null,
          verifiedBy: validatedData.autoApprove ? 'System Admin' : null
        }
      })

      let tickets = []

      // Generate tickets if requested
      if (validatedData.generateTickets && validatedData.autoApprove) {
        // For EMS customers, create 1 ticket of first available type
        // For public customers, create 1 ticket of first available type
        const defaultTicketType = ticketTypes[0]
        
        const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        const qrCode = `EMS-${registration.id}-${ticketNumber}`

        const ticket = await tx.ticket.create({
          data: {
            registrationId: registration.id,
            ticketTypeId: defaultTicketType.id,
            ticketNumber,
            qrCode,
            purchasePrice: validatedData.isEmsClient ? 0 : defaultTicketType.priceInCents,
            eventDate: new Date('2025-06-26'), // Event dates: 26 June - 06 July
            venue: 'Malta Fairs and Conventions Centre',
            boothLocation: 'EMS Booth - MFCC',
            status: 'GENERATED'
          }
        })

        tickets.push(ticket)

        // Update ticket type stock
        await tx.ticketType.update({
          where: { id: defaultTicketType.id },
          data: {
            availableStock: { decrement: 1 },
            soldStock: { increment: 1 }
          }
        })
      }

      // Create panel interest if applicable
      if (validatedData.hasPanelInterest) {
        await tx.panelInterest.create({
          data: {
            registrationId: registration.id,
            panelType: 'SOLAR_PANELS',
            interestLevel: 'MEDIUM',
            status: 'NEW'
          }
        })
      }

      return { registration, tickets }
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.registration.id,
        email: result.registration.email,
        isEmsClient: result.registration.isEmsClient,
        status: result.registration.status,
        ticketNumbers: result.tickets.map(t => t.ticketNumber),
        ticketsGenerated: result.tickets.length > 0
      }
    })

  } catch (error: any) {
    console.error('Create user error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      },
      { status: 500 }
    )
  }
}