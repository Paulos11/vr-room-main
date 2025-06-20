
// src/app/api/admin/approve-registration/route.ts - Enhanced admin approval with ticket generation
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'
import { z } from 'zod'

const ApprovalSchema = z.object({
  registrationId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
  adminId: z.string().optional().default('admin'),
  ticketQuantity: z.number().min(1).max(10).optional().default(1) // Allow admin to specify quantity
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== ADMIN APPROVAL REQUEST ===')
    const body = await request.json()
    const { registrationId, action, notes, adminId, ticketQuantity } = ApprovalSchema.parse(body)
    
    console.log(`Processing ${action} for registration ${registrationId}`)

    // Find the registration with related data
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tickets: true,
        panelInterests: true
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    if (registration.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: `Registration is not pending approval (current status: ${registration.status})` },
        { status: 400 }
      )
    }

    if (action === 'APPROVE') {
      console.log('Approving EMS customer registration...')
      
      // Use transaction for consistency
      const result = await prisma.$transaction(async (tx) => {
        // Update registration to COMPLETED
        const updatedRegistration = await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: 'COMPLETED',
            adminNotes: notes,
            verifiedAt: new Date(),
            verifiedBy: adminId
          }
        })

        // Generate tickets for approved EMS customer
        const tickets = []
        try {
          console.log(`Generating ${ticketQuantity} ticket(s) for approved EMS customer...`)
          
          // Create tickets using the service
          for (let i = 1; i <= ticketQuantity; i++) {
            const ticket = await TicketService.createTicket(registrationId, i)
            
            // Update ticket to SENT status immediately
            const sentTicket = await tx.ticket.update({
              where: { id: ticket.id },
              data: {
                status: 'SENT',
                sentAt: new Date()
              }
            })
            
            tickets.push(sentTicket)
            console.log(`Ticket ${i} generated and sent:`, ticket.ticketNumber)
          }
          
        } catch (ticketError) {
          console.error('Error generating tickets:', ticketError)
          throw new Error(`Failed to generate tickets: ${ticketError}`)
        }

        // Log approval email
        await tx.emailLog.create({
          data: {
            registrationId,
            emailType: 'REGISTRATION_APPROVED',
            subject: `Registration Approved - Your ${ticketQuantity > 1 ? ticketQuantity + ' VIP Tickets' : 'VIP Ticket'} Ready!`,
            recipient: registration.email,
            status: 'SENT'
          }
        })

        return { updatedRegistration, tickets }
      })

      console.log(`EMS registration approved - ${result.tickets.length} tickets generated`)

      return NextResponse.json({
        success: true,
        message: `Registration approved and ${result.tickets.length} ticket(s) generated`,
        data: {
          registration: result.updatedRegistration,
          tickets: result.tickets,
          status: 'COMPLETED',
          ticketNumbers: result.tickets.map(t => t.ticketNumber)
        }
      })

    } else if (action === 'REJECT') {
      console.log('Rejecting EMS customer registration...')
      
      // Update registration to REJECTED
      const updatedRegistration = await prisma.registration.update({
        where: { id: registrationId },
        data: {
          status: 'REJECTED',
          adminNotes: notes,
          rejectedReason: notes || 'EMS customer status could not be verified',
          verifiedAt: new Date(),
          verifiedBy: adminId
        }
      })

      // Log rejection email
      await prisma.emailLog.create({
        data: {
          registrationId,
          emailType: 'REGISTRATION_REJECTED',
          subject: 'Registration Update - Unable to Verify EMS Customer Status',
          recipient: registration.email,
          status: 'SENT'
        }
      })

      console.log('EMS registration rejected')

      return NextResponse.json({
        success: true,
        message: 'Registration rejected',
        data: {
          registration: updatedRegistration,
          status: 'REJECTED'
        }
      })
    }

  } catch (error: any) {
    console.error('=== ADMIN APPROVAL ERROR ===')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process approval',
        error: error.message
      },
      { status: 500 }
    )
  }
}