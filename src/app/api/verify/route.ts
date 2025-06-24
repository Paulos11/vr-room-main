// src/app/api/verify/route.ts - Super fast ticket verification API
import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/lib/ticketService'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const VerifySchema = z.object({
  ticketNumber: z.string().min(1, 'Ticket number is required'),
  token: z.string().optional(), // Optional security token
  checkedInBy: z.string().optional(), // Staff member performing the check-in
  location: z.string().optional().default('EMS Booth') // Location of check-in
});

// POST method for verification and check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketNumber, token, checkedInBy, location } = VerifySchema.parse(body)

    console.log(`=== TICKET VERIFICATION & CHECK-IN ===`)
    console.log(`Ticket: ${ticketNumber}`)
    console.log(`Check-in by: ${checkedInBy || 'N/A'}`)

    // Step 1: Verify ticket existence and status.
    // FIX: The 'verifyTicket' method expects only one argument.
    const verification = await TicketService.verifyTicket(ticketNumber);

    if (!verification.success) {
      return NextResponse.json({
        success: false,
        canEnter: false,
        message: verification.message,
        ticket: verification.ticket || null
      }, { status: 400 });
    }

    // Step 2: If verification is successful and a staff member is checking them in, log the check-in.
    let checkInResult = null;
    if (checkedInBy && verification.canEnter) {
      checkInResult = await TicketService.checkInTicket(
        ticketNumber, 
        checkedInBy, 
        location
      );

      if (!checkInResult.success) {
        // Log the error but don't block entry if the primary verification was successful.
        console.error('Check-in logging failed:', checkInResult.message);
      }
    }

    // Step 3: Return a detailed success response.
    return NextResponse.json({
      success: true,
      canEnter: verification.canEnter,
      message: verification.message,
      ticket: {
        ticketNumber: verification.ticket.ticketNumber,
        customerName: `${verification.ticket.registration.firstName} ${verification.ticket.registration.lastName}`,
        email: verification.ticket.registration.email,
        isEmsClient: verification.ticket.registration.isEmsClient,
        ticketType: verification.ticket.ticketType?.name || 'Standard Access',
        status: verification.ticket.status,
        eventDate: verification.ticket.eventDate,
        venue: verification.ticket.venue
      },
      checkIn: checkInResult?.success ? {
        timestamp: new Date().toISOString(),
        location: location,
        checkedInBy: checkedInBy
      } : null
    });

  } catch (error: any) {
    console.error('=== VERIFICATION API ERROR ===', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        canEnter: false,
        message: 'Invalid data provided for verification',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      canEnter: false,
      message: 'An internal error occurred in the verification system.'
    }, { status: 500 });
  }
}

// GET method for a quick, read-only verification (e.g., from a QR code scan)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketNumber = searchParams.get('ticket');
    const token = searchParams.get('token');

    if (!ticketNumber) {
      return NextResponse.json({
        success: false,
        canEnter: false,
        message: 'Ticket number is required for verification.'
      }, { status: 400 });
    }

    console.log(`=== QUICK TICKET VERIFICATION ===`);
    console.log(`Ticket: ${ticketNumber}`);

    // Perform a read-only verification without logging a check-in.
    // FIX: The 'verifyTicket' method expects only one argument.
    const verification = await TicketService.verifyTicket(ticketNumber);

    return NextResponse.json({
      success: verification.success,
      canEnter: verification.canEnter,
      message: verification.message,
      ticket: verification.ticket ? {
        ticketNumber: verification.ticket.ticketNumber,
        customerName: `${verification.ticket.registration.firstName} ${verification.ticket.registration.lastName}`,
        email: verification.ticket.registration.email,
        isEmsClient: verification.ticket.registration.isEmsClient,
        ticketType: verification.ticket.ticketType?.name || 'Standard Access',
        status: verification.ticket.status
      } : null
    });

  } catch (error: any) {
    console.error('Quick verification error:', error);
    return NextResponse.json({
      success: false,
      canEnter: false,
      message: 'An error occurred during ticket verification.'
    }, { status: 500 });
  }
}
