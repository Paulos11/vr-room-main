
// src/app/api/admin/approve-registration/route.ts - Optimized with proper ticket generation
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'
import { z } from 'zod'

const ApprovalSchema = z.object({
  registrationId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
  adminId: z.string().optional().default('admin')
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== ADMIN APPROVAL REQUEST ===')
    const body = await request.json()
    const { registrationId, action, notes, adminId } = ApprovalSchema.parse(body)
    
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
      console.log('Approving registration...')
      
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

        // Generate ticket using the service (handles random numbers)
        let tickets = []
        try {
          if (registration.tickets.length === 0) {
            // Create new ticket if none exists
            const ticket = await TicketService.createTicket(registrationId, 1)
            tickets = [ticket]
            console.log('New ticket generated:', ticket.ticketNumber)
          } else {
            // Update existing tickets to SENT
            await tx.ticket.updateMany({
              where: { registrationId },
              data: {
                status: 'SENT',
                sentAt: new Date()
              }
            })
            tickets = registration.tickets
            console.log('Existing tickets updated to SENT')
          }
        } catch (ticketError) {
          console.error('Error generating ticket:', ticketError)
          throw new Error('Failed to generate ticket')
        }

        // Log approval email
        await tx.emailLog.create({
          data: {
            registrationId,
            emailType: 'REGISTRATION_APPROVED',
            subject: 'Registration Approved - Your VIP Ticket is Ready!',
            recipient: registration.email,
            status: 'SENT'
          }
        })

        return { updatedRegistration, tickets }
      })

      console.log('Registration approved successfully')

      return NextResponse.json({
        success: true,
        message: 'Registration approved and ticket generated',
        data: {
          registration: result.updatedRegistration,
          tickets: result.tickets,
          status: 'COMPLETED'
        }
      })

    } else if (action === 'REJECT') {
      console.log('Rejecting registration...')
      
      // Update registration to REJECTED
      const updatedRegistration = await prisma.registration.update({
        where: { id: registrationId },
        data: {
          status: 'REJECTED',
          adminNotes: notes,
          rejectedReason: notes || 'Registration rejected by admin',
          verifiedAt: new Date(),
          verifiedBy: adminId
        }
      })

      // Log rejection email
      await prisma.emailLog.create({
        data: {
          registrationId,
          emailType: 'REGISTRATION_REJECTED',
          subject: 'Registration Update - Unable to Approve',
          recipient: registration.email,
          status: 'SENT'
        }
      })

      console.log('Registration rejected successfully')

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
