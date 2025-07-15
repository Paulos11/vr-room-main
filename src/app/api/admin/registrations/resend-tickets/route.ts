// src/app/api/admin/registrations/[id]/resend-tickets/route.ts - Resend VR Tickets API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Registration ID is required' },
        { status: 400 }
      )
    }

    // Fetch registration with tickets
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tickets: {
          include: {
            ticketType: {
              select: {
                name: true,
                description: true
              }
            }
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'VR booking not found' },
        { status: 404 }
      )
    }

    // Check if registration has tickets to resend
    if (registration.tickets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No VR tickets found for this booking' },
        { status: 400 }
      )
    }

    // Check if registration is in a valid state for ticket resending
    const validStatuses = ['COMPLETED', 'VERIFIED']
    if (!validStatuses.includes(registration.status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot resend tickets for bookings with status: ${registration.status}. Status must be COMPLETED or VERIFIED.` 
        },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Generate fresh ticket PDFs
    // 2. Send email with tickets
    // 3. Log the email activity
    // 4. Update ticket status
    
    // For now, we'll simulate the process
    const ticketDetails = registration.tickets.map(ticket => ({
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.qrCode,
      experienceName: ticket.ticketType.name,
      eventDate: ticket.eventDate,
      venue: ticket.venue,
      boothLocation: ticket.boothLocation
    }))

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Log the email activity
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType: 'TICKET_DELIVERY',
        subject: `Your VR Room Malta Tickets - ${registration.firstName} ${registration.lastName}`,
        recipient: registration.email,
        status: 'SENT',
        templateUsed: 'vr-ticket-resend'
      }
    })

    // Update ticket sent status
    await prisma.ticket.updateMany({
      where: { registrationId: registration.id },
      data: { 
        sentAt: new Date(),
        status: 'SENT'
      }
    })

    // Create success response
    const response = {
      success: true,
      message: 'VR tickets resent successfully',
      data: {
        registrationId: registration.id,
        customerName: `${registration.firstName} ${registration.lastName}`,
        email: registration.email,
        ticketCount: registration.tickets.length,
        ticketDetails,
        sentAt: new Date().toISOString(),
        emailSubject: `Your VR Room Malta Tickets - ${registration.firstName} ${registration.lastName}`
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Resend tickets API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to resend VR tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check ticket status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            sentAt: true,
            qrCode: true,
            ticketType: {
              select: { name: true }
            }
          }
        },
        emailLogs: {
          where: { emailType: 'TICKET_DELIVERY' },
          orderBy: { sentAt: 'desc' },
          take: 5,
          select: {
            sentAt: true,
            status: true,
            subject: true
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'VR booking not found' },
        { status: 404 }
      )
    }

    const ticketStatus = {
      totalTickets: registration.tickets.length,
      sentTickets: registration.tickets.filter(t => t.sentAt).length,
      canResend: ['COMPLETED', 'VERIFIED'].includes(registration.status),
      lastSent: registration.tickets.find(t => t.sentAt)?.sentAt,
      emailHistory: registration.emailLogs,
      tickets: registration.tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        experienceName: ticket.ticketType.name,
        sentAt: ticket.sentAt,
        hasQR: !!ticket.qrCode
      }))
    }

    return NextResponse.json({
      success: true,
      data: ticketStatus
    })

  } catch (error: any) {
    console.error('Ticket status API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch ticket status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}