// src/app/api/admin/tickets/download/[id]/route.ts - Download ALL tickets for the user
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { PDFTicketGenerator } from "@/lib/pdfTicketGenerator"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    
    console.log('🎫 Downloading tickets for ticket ID:', ticketId)
    
    // First, get the specific ticket to find the registration
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        registration: true
      }
    })
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Found ticket:', ticket.ticketNumber)
    console.log('🔍 Getting ALL tickets for registration:', ticket.registrationId)
    
    // ✅ NEW: Get ALL active tickets for this user's registration (exclude USED tickets)
    const registration = await prisma.registration.findUnique({
      where: { id: ticket.registrationId },
      include: {
        tickets: {
          where: {
            status: {
              not: 'USED' // ✅ EXCLUDE: Don't include used tickets in download
            }
          },
          include: {
            ticketType: true
          },
          orderBy: { ticketSequence: 'asc' }
        }
      }
    })
    
    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }
    
    if (registration.tickets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No available tickets to download (all tickets may be used)' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Found ${registration.tickets.length} active tickets for ${registration.firstName} ${registration.lastName}`)
    
    // Log all tickets being included (excluding used ones)
    registration.tickets.forEach((t, index) => {
      console.log(`📄 Active Ticket ${index + 1}: ${t.ticketNumber} (${t.ticketType?.name || 'Unknown'}) - Status: ${t.status}`)
    })
    
    // ✅ FIXED: Generate PDF with ALL tickets for this user
    const pdfBuffer = await PDFTicketGenerator.generateTicketsFromRegistration(registration)
    
    console.log('✅ PDF generated successfully with all tickets, size:', pdfBuffer.length, 'bytes')
    
    // Create filename based on number of tickets
    const customerName = `${registration.firstName}-${registration.lastName}`.replace(/\s+/g, '-')
    const filename = registration.tickets.length === 1 
      ? `ticket-${registration.tickets[0].ticketNumber}.pdf`
      : `tickets-${customerName}-${registration.tickets.length}tickets.pdf`
    
    console.log('📁 Download filename:', filename)
    
    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
    
  } catch (error: any) {
    console.error('❌ Error downloading tickets:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to download tickets', error: error.message },
      { status: 500 }
    )
  }
}