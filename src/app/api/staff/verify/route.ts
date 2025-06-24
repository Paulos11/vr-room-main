import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple staff token verification
function verifyStaffToken(authHeader: string | null): { valid: boolean; staffId?: string } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false }
  }
  const token = authHeader.replace('Bearer ', '')
  const parts = token.split('_')
  if (parts.length >= 2 && parts[0] === 'staff') {
    return { valid: true, staffId: parts[1] }
  }
  return { valid: false }
}

export async function POST(request: NextRequest) {
  try {
    // Verify staff authentication
    const authHeader = request.headers.get('authorization')
    const authResult = verifyStaffToken(authHeader)
    
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, canEnter: false, message: 'Unauthorized - Staff login required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ticketNumber, checkedInBy, staffId, location } = body

    if (!ticketNumber) {
      return NextResponse.json(
        { success: false, canEnter: false, message: 'Ticket number is required' },
        { status: 400 }
      )
    }

    console.log(`🎫 Staff ${staffId} verifying ticket: ${ticketNumber}`)

    // Get ticket from database with all related data
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        registration: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            isEmsClient: true,
            status: true,
          },
        },
        ticketType: {
          select: { name: true },
        },
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({
        success: false,
        canEnter: false,
        message: 'Ticket not found in system',
      })
    }
    
    const responseTicket = {
        ticketNumber: ticket.ticketNumber,
        customerName: `${ticket.registration.firstName} ${ticket.registration.lastName}`,
        email: ticket.registration.email,
        isEmsClient: ticket.registration.isEmsClient,
        ticketType: ticket.ticketType?.name || 'Event Access',
        status: ticket.status,
    };

    if (ticket.registration.status !== 'COMPLETED') {
      return NextResponse.json({
        success: false,
        canEnter: false,
        message: `Registration status is ${ticket.registration.status}. Entry not allowed.`,
        ticket: responseTicket,
      })
    }

    if (ticket.status === 'CANCELLED' || ticket.status === 'EXPIRED') {
       return NextResponse.json({
        success: false,
        canEnter: false,
        message: `Ticket has been ${ticket.status.toLowerCase()}`,
        ticket: responseTicket,
      })
    }
    
    // Check if already used (you can adjust the time window)
    const lastCheckIn = ticket.checkIns[0];
    if (ticket.status === 'USED' && lastCheckIn) {
      return NextResponse.json({
        success: true, // It's a valid ticket
        canEnter: false, // But they can't enter again
        message: 'Ticket has already been used',
        ticket: responseTicket,
        checkIn: {
          timestamp: lastCheckIn.checkedInAt.toISOString(),
          location: lastCheckIn.location,
          checkedInBy: lastCheckIn.checkedInBy
        }
      })
    }

    // --- All checks passed, this is a valid entry ---
    
    // Create check-in record in a separate try/catch to ensure entry is not blocked by a logging error
    let checkInRecord;
    try {
       checkInRecord = await prisma.ticketCheckIn.create({
        data: {
          ticketId: ticket.id,
          checkedInBy: checkedInBy || `Staff ${staffId}`,
          location: location || 'EMS Booth - Main Entrance',
          notes: `Staff verification by ${staffId || 'Unknown'}`,
        },
      })

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'USED' },
      })
      console.log(`✅ Ticket ${ticketNumber} checked in by staff ${staffId}`)
    } catch (dbError) {
        console.error("DATABASE ERROR during check-in:", dbError);
        // Don't block entry if logging fails. The main checks passed.
    }


    return NextResponse.json({
      success: true,
      canEnter: true,
      message: 'Valid ticket - Entry allowed',
      ticket: responseTicket,
      checkIn: checkInRecord ? {
        timestamp: checkInRecord.checkedInAt.toISOString(),
        location: checkInRecord.location,
        checkedInBy: checkInRecord.checkedInBy,
      } : null,
    })

  } catch (error) {
    console.error('❌ Staff verification API error:', error)
    return NextResponse.json(
      { success: false, canEnter: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}