
// src/app/api/admin/generate-ticket/route.ts - Manual ticket generation
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'
import { z } from 'zod'

const GenerateTicketSchema = z.object({
  registrationId: z.string(),
  quantity: z.number().min(1).max(10).default(1),
  adminId: z.string().optional().default('admin')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, quantity, adminId } = GenerateTicketSchema.parse(body)

    // Find registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { tickets: true }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    if (registration.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: 'Can only generate tickets for approved registrations' },
        { status: 400 }
      )
    }

    // Generate new tickets
    const newTickets = await TicketService.createMultipleTickets(registrationId, quantity)

    // Log admin action
    await prisma.emailLog.create({
      data: {
        registrationId,
        emailType: 'TICKET_DELIVERY',
        subject: `Admin Generated ${quantity} Additional Ticket(s)`,
        recipient: registration.email,
        status: 'SENT'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Generated ${quantity} new ticket(s)`,
      data: {
        tickets: newTickets,
        totalTickets: registration.tickets.length + quantity
      }
    })

  } catch (error: any) {
    console.error('Error generating tickets:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to generate tickets' },
      { status: 500 }
    )
  }
}