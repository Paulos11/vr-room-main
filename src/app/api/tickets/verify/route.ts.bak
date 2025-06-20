// src/app/api/tickets/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/lib/ticketService'
import { z } from 'zod'

const VerifyTicketSchema = z.object({
  ticketNumber: z.string().min(1, 'Ticket number is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketNumber } = VerifyTicketSchema.parse(body)

    const verification = await TicketService.verifyTicket(ticketNumber)

    return NextResponse.json({
      success: true,
      data: verification
    })
  } catch (error: any) {
    console.error('Error verifying ticket:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to verify ticket'
      },
      { status: 400 }
    )
  }
}
