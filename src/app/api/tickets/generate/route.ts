
// src/app/api/tickets/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/lib/ticketService'
import { z } from 'zod'

const GenerateTicketSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId } = GenerateTicketSchema.parse(body)

    const ticket = await TicketService.generateTicketForApprovedRegistration(registrationId)

    return NextResponse.json({
      success: true,
      message: 'Ticket generated successfully',
      data: ticket
    })
  } catch (error: any) {
    console.error('Error generating ticket:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to generate ticket'
      },
      { status: 400 }
    )
  }
}
