// CORRECTED: src/app/api/admin/users/create/route.ts - Fixed for multiple registrations support
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
  applicationNumber: z.string().optional(),
  hasPanelInterest: z.boolean().default(false),
  autoApprove: z.boolean().default(true),
  generateTickets: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateUserSchema.parse(body)

    console.log('Admin creating user:', {
      email: validatedData.email,
      isEmsClient: validatedData.isEmsClient,
      autoApprove: validatedData.autoApprove
    })

    // ✅ FIXED: Check for existing registrations using findFirst since email is no longer unique
    if (validatedData.isEmsClient) {
      // For EMS customers: Check if they have any pending registrations
      const existingPendingEmsRegistration = await prisma.registration.findFirst({
        where: {
          email: validatedData.email.toLowerCase().trim(),
          isEmsClient: true,
          status: {
            in: ['PENDING', 'PAYMENT_PENDING']
          }
        }
      })

      if (existingPendingEmsRegistration) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'EMS customer already has a pending registration. Please approve or reject the existing registration first.',
            existingRegistrationId: existingPendingEmsRegistration.id,
            existingStatus: existingPendingEmsRegistration.status
          },
          { status: 400 }
        )
      }
    }
    // For public customers: No restrictions - they can have multiple registrations

    // Get default ticket types
    const ticketTypes = await prisma.ticketType.findMany({
      where: { 
        isActive: true,
        // Filter by customer type if specified
        ...(validatedData.isEmsClient ? { emsClientsOnly: true } : { publicOnly: false })
      },
      orderBy: { sortOrder: 'asc' }
    })

    if (ticketTypes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No active ticket types available for this customer type' },
        { status: 400 }
      )
    }

    // Create registration in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create registration with correct field names
      const registration = await tx.registration.create({
        data: {
          firstName: validatedData.firstName.trim(),
          lastName: validatedData.lastName.trim(),
          email: validatedData.email.toLowerCase().trim(),
          phone: validatedData.phone.trim(),
          idCardNumber: validatedData.idCardNumber?.trim() || null, // ✅ FIXED: Allow null
          isEmsClient: validatedData.isEmsClient,
          // EMS customer fields
          customerName: validatedData.customerName?.trim() || null,
          orderNumber: validatedData.orderNumber?.trim() || null,
          applicationNumber: validatedData.applicationNumber?.trim() || null,
          originalAmount: 0,
          discountAmount: 0,
          finalAmount: 0,
          status: validatedData.autoApprove ? 'COMPLETED' : 'PENDING',
          adminNotes: `Created by admin on ${new Date().toISOString()}`,
          verifiedAt: validatedData.autoApprove ? new Date() : null,
          verifiedBy: validatedData.autoApprove ? 'System Admin' : null
        }
      })

      let tickets = []

      // Generate tickets if requested
      if (validatedData.generateTickets && validatedData.autoApprove) {
        // Create tickets based on customer type
        const defaultTicketType = ticketTypes[0]
        
        // Check stock availability
        if (defaultTicketType.availableStock <= 0) {
          throw new Error(`No stock available for ticket type: ${defaultTicketType.name}`)
        }
        
        const ticketNumber = `EMS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        const qrCode = `${process.env.NEXT_PUBLIC_SITE_URL}/staff/verify/${ticketNumber}`

        const ticket = await tx.ticket.create({
          data: {
            registrationId: registration.id,
            ticketTypeId: defaultTicketType.id,
            ticketNumber,
            ticketSequence: 1,
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

    console.log('Admin user creation successful:', {
      registrationId: result.registration.id,
      email: result.registration.email,
      status: result.registration.status,
      ticketsGenerated: result.tickets.length
    })

    return NextResponse.json({
      success: true,
      message: `${validatedData.isEmsClient ? 'EMS customer' : 'Public customer'} created successfully`,
      data: {
        id: result.registration.id,
        email: result.registration.email,
        isEmsClient: result.registration.isEmsClient,
        status: result.registration.status,
        ticketNumbers: result.tickets.map(t => t.ticketNumber),
        ticketsGenerated: result.tickets.length > 0,
        customerType: validatedData.isEmsClient ? 'EMS Customer' : 'Public Customer',
        requiresApproval: !validatedData.autoApprove
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

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'A record with this information already exists' },
        { status: 409 }
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