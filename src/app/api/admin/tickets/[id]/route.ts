// src/app/api/admin/tickets/[id]/route.ts - Fixed individual ticket management
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
    
    console.log(`=== TICKET ACTION: ${action} ===`)
    console.log(`Ticket ID: ${ticketId}`)
    
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
        // Use the regenerateTicket method instead of createTicket
        try {
          const regeneratedTicket = await TicketService.regenerateTicket(ticketId)
          
          result.message = 'Ticket regenerated with new number and QR code'
          result.newTicketNumber = regeneratedTicket.ticketNumber
          result.oldTicketNumber = ticket.ticketNumber
          
          // Log the regeneration
          await prisma.emailLog.create({
            data: {
              registrationId: ticket.registrationId,
              emailType: 'TICKET_DELIVERY',
              subject: `Ticket Regenerated - New: ${regeneratedTicket.ticketNumber} (Old: ${ticket.ticketNumber})`,
              recipient: ticket.registration.email,
              status: 'SENT'
            }
          })
          
          return NextResponse.json({
            success: true,
            ...result,
            data: {
              ticket: regeneratedTicket
            }
          })
          
        } catch (regenerateError: any) {
          console.error('Regeneration failed:', regenerateError)
          return NextResponse.json(
            { success: false, message: 'Failed to regenerate ticket', error: regenerateError.message },
            { status: 500 }
          )
        }
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }
    
    // Update ticket for non-regenerate actions
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
    
    console.log(`✅ Ticket ${action} completed successfully`)
    
    return NextResponse.json({
      success: true,
      ...result,
      data: {
        ticket: updatedTicket
      }
    })
    
  } catch (error: any) {
    console.error('=== TICKET ACTION ERROR ===')
    console.error('Error:', error.message)
    
    return NextResponse.json(
      { success: false, message: 'Failed to update ticket', error: error.message },
      { status: 500 }
    )
  }
}

// GET method to retrieve ticket details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        registration: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isEmsClient: true,
            status: true
          }
        },
        ticketType: {
          select: {
            name: true,
            description: true,
            priceInCents: true
          }
        },
        checkIns: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ticket: {
          ...ticket,
          customerName: `${ticket.registration.firstName} ${ticket.registration.lastName}`,
          totalCheckIns: ticket.checkIns.length,
          lastCheckIn: ticket.checkIns[0] || null
        }
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ticket', error: error.message },
      { status: 500 }
    )
  }
}