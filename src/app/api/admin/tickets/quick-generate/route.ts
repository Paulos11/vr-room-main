// src/app/api/admin/tickets/quick-generate/route.ts - Simplified version without complex transactions
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ✅ SIMPLIFIED: Basic validation
const CustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  isEmsClient: z.boolean().default(false),
  paymentMethod: z.string().optional().default('CASH')
})

const TicketSchema = z.object({
  ticketTypeId: z.string(),
  name: z.string(),
  quantity: z.number().min(1).max(50),
  priceInCents: z.number().min(0),
  maxStock: z.number()
})

const QuickGenerateSchema = z.object({
  customer: CustomerSchema,
  tickets: z.array(TicketSchema),
  adminUser: z.string().optional()
})

// Type for the generated ticket
type GeneratedTicket = {
  id: string
  ticketNumber: string
  qrCode: string
  purchasePrice: number
  status: string
  ticketSequence: number | null
  registrationId: string
  ticketTypeId: string
  [key: string]: any // For other Prisma fields
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🚀 Quick generate request body:', JSON.stringify(body, null, 2))
    
    const { customer, tickets, adminUser } = QuickGenerateSchema.parse(body)

    // ✅ SIMPLIFIED: Generate defaults immediately
    const processedCustomer = {
      firstName: customer.firstName?.trim() || 'Unknown',
      lastName: customer.lastName?.trim() || 'Customer',
      email: customer.email?.trim() || `quick-${Date.now()}@admin-generated.local`,
      phone: customer.phone?.trim() || '+35600000000', // ✅ FIXED: Use zeros instead of timestamp
      isEmsClient: customer.isEmsClient || false,
      paymentMethod: customer.paymentMethod || 'CASH'
    }

    console.log('✅ Processed customer:', processedCustomer)

    // Generate unique identifiers
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    const idCardNumber = `QK${timestamp}${random}`

    // ✅ STEP 1: Create registration first (no transaction)
    console.log('Creating registration...')
    const registration = await prisma.registration.create({
      data: {
        firstName: processedCustomer.firstName,
        lastName: processedCustomer.lastName,
        email: processedCustomer.email,
        phone: processedCustomer.phone,
        idCardNumber,
        isEmsClient: processedCustomer.isEmsClient,
        status: 'PENDING',
        originalAmount: 0,
        finalAmount: 0
      }
    })

    console.log('✅ Registration created:', registration.id)

    // ✅ STEP 2: Create tickets one by one
    const generatedTickets: GeneratedTicket[] = []
    let totalOrderAmount = 0

    for (const ticketRequest of tickets) {
      console.log(`Creating ${ticketRequest.quantity} tickets for ${ticketRequest.name}...`)
      
      // Get ticket type
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: ticketRequest.ticketTypeId }
      })

      if (!ticketType) {
        throw new Error(`Ticket type ${ticketRequest.ticketTypeId} not found`)
      }

      // Calculate price per ticket
      const pricePerTicket = processedCustomer.isEmsClient ? 0 : Math.round(ticketRequest.priceInCents / ticketRequest.quantity)

      // Create individual tickets
      for (let i = 0; i < ticketRequest.quantity; i++) {
        const ticketTimestamp = Date.now() + i + Math.random() * 1000
        const ticketRandom = Math.random().toString(36).substr(2, 6).toUpperCase()
        const ticketNumber = `T${Math.floor(ticketTimestamp)}${ticketRandom}`
        const qrCode = `QR${Math.floor(ticketTimestamp)}${ticketRandom}`

        const ticket: GeneratedTicket = await prisma.ticket.create({
          data: {
            registrationId: registration.id,
            ticketTypeId: ticketRequest.ticketTypeId,
            ticketNumber,
            qrCode,
            purchasePrice: pricePerTicket,
            eventDate: new Date('2025-06-26'),
            venue: 'Malta Fairs and Conventions Centre',
            boothLocation: 'EMS Booth - MFCC',
            status: 'GENERATED',
            ticketSequence: generatedTickets.length + 1
          }
        })

        generatedTickets.push(ticket)
        console.log(`✅ Created ticket ${i + 1}/${ticketRequest.quantity}: ${ticket.ticketNumber}`)
      }

      // Update stock
      await prisma.ticketType.update({
        where: { id: ticketRequest.ticketTypeId },
        data: {
          availableStock: { decrement: ticketRequest.quantity },
          soldStock: { increment: ticketRequest.quantity }
        }
      })

      totalOrderAmount += ticketRequest.priceInCents
    }

    // ✅ STEP 3: Update registration with totals
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        originalAmount: totalOrderAmount,
        finalAmount: totalOrderAmount,
        status: processedCustomer.isEmsClient || totalOrderAmount === 0 ? 'COMPLETED' : 'PAYMENT_PENDING'
      }
    })

    console.log(`✅ Successfully generated ${generatedTickets.length} tickets for ${processedCustomer.firstName} ${processedCustomer.lastName}`)

    return NextResponse.json({
      success: true,
      message: `Successfully created registration and generated ${generatedTickets.length} ticket(s)`,
      data: {
        registration: {
          id: registration.id,
          name: `${registration.firstName} ${registration.lastName}`,
          email: registration.email,
          phone: registration.phone,
          isEmsClient: registration.isEmsClient,
          status: registration.status
        },
        tickets: generatedTickets.map(t => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          status: t.status,
          purchasePrice: t.purchasePrice
        })),
        summary: {
          totalTickets: generatedTickets.length,
          totalAmount: totalOrderAmount,
          customerType: processedCustomer.isEmsClient ? 'EMS Customer' : 'Public Customer',
          paymentMethod: processedCustomer.paymentMethod
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error in quick ticket generation:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:', error.errors)
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create registration and generate tickets', error: error.message },
      { status: 500 }
    )
  }
}