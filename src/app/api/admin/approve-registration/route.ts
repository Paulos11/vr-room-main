// src/app/api/admin/approve-registration/route.ts - Fixed to use selected tickets
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    // Find the registration with related data INCLUDING existing tickets
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tickets: {
          include: {
            ticketType: true
          }
        },
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
      console.log(`Found ${registration.tickets.length} existing tickets`)
      
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

        // Update existing tickets to SENT status instead of creating new ones
        const updatedTickets = await Promise.all(
          registration.tickets.map(ticket => 
            tx.ticket.update({
              where: { id: ticket.id },
              data: {
                status: 'SENT',
                sentAt: new Date()
              }
            })
          )
        )

        console.log(`Updated ${updatedTickets.length} tickets to SENT status`)

        // Log approval email
        await tx.emailLog.create({
          data: {
            registrationId,
            emailType: 'REGISTRATION_APPROVED',
            subject: `Registration Approved - Your ${registration.tickets.length > 1 ? registration.tickets.length + ' VIP Tickets' : 'VIP Ticket'} Ready!`,
            recipient: registration.email,
            status: 'SENT'
          }
        })

        return { updatedRegistration, tickets: updatedTickets }
      })

      console.log(`EMS registration approved - ${result.tickets.length} tickets activated`)

      return NextResponse.json({
        success: true,
        message: `Registration approved and ${result.tickets.length} ticket(s) activated`,
        data: {
          registration: result.updatedRegistration,
          tickets: result.tickets,
          status: 'COMPLETED',
          ticketNumbers: result.tickets.map(t => t.ticketNumber)
        }
      })

    } else if (action === 'REJECT') {
      console.log('Rejecting EMS customer registration...')
      
      // Use transaction to update registration and handle tickets
      const result = await prisma.$transaction(async (tx) => {
        // Update registration to REJECTED
        const updatedRegistration = await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: 'REJECTED',
            adminNotes: notes,
            rejectedReason: notes || 'EMS customer status could not be verified',
            verifiedAt: new Date(),
            verifiedBy: adminId
          }
        })

        // Cancel existing tickets
        const cancelledTickets = await Promise.all(
          registration.tickets.map(ticket =>
            tx.ticket.update({
              where: { id: ticket.id },
              data: {
                status: 'CANCELLED'
              }
            })
          )
        )

        // Restore ticket type stock for cancelled tickets
        for (const ticket of registration.tickets) {
          await tx.ticketType.update({
            where: { id: ticket.ticketTypeId },
            data: {
              availableStock: {
                increment: 1
              },
              soldStock: {
                decrement: 1
              }
            }
          })
        }

        return { updatedRegistration, cancelledTickets }
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

      console.log('EMS registration rejected and tickets cancelled')

      return NextResponse.json({
        success: true,
        message: 'Registration rejected and tickets cancelled',
        data: {
          registration: result.updatedRegistration,
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