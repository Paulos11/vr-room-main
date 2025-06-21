
// src/app/api/admin/tickets/[id]/route.ts - Individual ticket management
// src/app/api/admin/tickets/route.ts - Tickets management API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    const body = await request.json()
    const { action, notes, adminUser } = body
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { registration: true }
    })
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    let updateData: any = {}
    let result: any = {}
    
    switch (action) {
      case 'SEND':
        updateData = {
          status: 'SENT',
          sentAt: new Date()
        }
        result.message = 'Ticket marked as sent'
        break
        
      case 'COLLECT':
        updateData = {
          status: 'COLLECTED',
          collectedAt: new Date(),
          collectedBy: adminUser || 'Admin'
        }
        result.message = 'Ticket marked as collected'
        break
        
      case 'USE':
        updateData = {
          status: 'USED'
        }
        // Create check-in record
        await prisma.ticketCheckIn.create({
          data: {
            ticketId: ticket.id,
            checkedInBy: adminUser || 'Admin',
            notes: notes || 'Checked in by admin'
          }
        })
        result.message = 'Ticket checked in successfully'
        break
        
      case 'CANCEL':
        updateData = {
          status: 'CANCELLED'
        }
        result.message = 'Ticket cancelled'
        break
        
      case 'REGENERATE':
        // Generate new QR code and ticket number
        const newTicketData = await TicketService.createTicket(ticket.registrationId, ticket.ticketSequence || 1)
        updateData = {
          ticketNumber: newTicketData.ticketNumber,
          qrCode: newTicketData.qrCode,
          status: 'GENERATED',
          issuedAt: new Date(),
          sentAt: null,
          collectedAt: null
        }
        result.message = 'Ticket regenerated with new number'
        result.newTicketNumber = newTicketData.ticketNumber
        break
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }
    
    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData
    })
    
    // Log the action
    await prisma.emailLog.create({
      data: {
        registrationId: ticket.registrationId,
        emailType: 'TICKET_DELIVERY',
        subject: `Ticket ${action} - ${ticket.ticketNumber}`,
        recipient: ticket.registration.email,
        status: 'SENT'
      }
    })
    
    return NextResponse.json({
      success: true,
      ...result,
      data: {
        ticket: updatedTicket
      }
    })
    
  } catch (error: any) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update ticket', error: error.message },
      { status: 500 }
    )
  }
}
