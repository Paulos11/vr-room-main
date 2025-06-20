// src/app/api/tickets/check-in/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/lib/ticketService'
import { z } from 'zod'

const CheckInSchema = z.object({
  ticketNumber: z.string().min(1, 'Ticket number is required'),
  checkedInBy: z.string().min(1, 'Admin name is required'),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketNumber, checkedInBy, notes } = CheckInSchema.parse(body)

    const checkIn = await TicketService.checkInTicket(ticketNumber, checkedInBy, notes)

    return NextResponse.json({
      success: true,
      message: 'Ticket checked in successfully',
      data: checkIn
    })
  } catch (error: any) {
    console.error('Error checking in ticket:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to check in ticket'
      },
      { status: 400 }
    )
  }
}
