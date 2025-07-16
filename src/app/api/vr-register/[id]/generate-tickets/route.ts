// src/app/api/vr-register/[id]/generate-tickets/route.ts - Generate VR tickets after payment
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'

// Type definition for selected tickets
interface SelectedTicket {
  ticketTypeId: string;
  name: string;
  quantity: number;
  priceInCents: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id
    const body = await request.json()
    const { triggerType = 'MANUAL', adminUser = 'System' } = body

    console.log(`🎫 Generating VR tickets for registration ${registrationId}`)
    console.log(`   Triggered by: ${triggerType}`)

    // Get the registration with current status
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        payment: true,
        tickets: true
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'VR booking not found' },
        { status: 404 }
      )
    }

    // Check if tickets already exist
    if (registration.tickets.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'VR tickets already generated',
        data: {
          ticketCount: registration.tickets.length,
          tickets: registration.tickets.map(t => ({
            sessionNumber: t.ticketNumber,
            status: t.status
          }))
        }
      })
    }

    // ✅ VALIDATE CONDITIONS for ticket generation
    let canGenerate = false
    let reason = ''

    if (registration.finalAmount === 0) {
      // Free bookings - admin can generate anytime
      canGenerate = true
      reason = 'Free VR session - admin generation allowed'
    } else if (registration.payment?.status === 'SUCCEEDED' && registration.status === 'COMPLETED') {
      // Paid bookings - only after successful payment
      canGenerate = true
      reason = 'Payment completed - automatic ticket generation'
    } else if (triggerType === 'ADMIN_OVERRIDE') {
      // Admin override - always allowed but logged
      canGenerate = true
      reason = 'Admin override - manual ticket generation'
    } else {
      canGenerate = false
      reason = `Cannot generate tickets: Payment status is ${registration.payment?.status || 'NONE'}, Registration status is ${registration.status}`
    }

    if (!canGenerate) {
      return NextResponse.json(
        { success: false, message: reason },
        { status: 400 }
      )
    }

    console.log(`✅ Ticket generation approved: ${reason}`)

    // Parse the selected tickets from admin notes (in real app, use a proper table)
    let selectedTickets: SelectedTicket[] = []
    try {
      const notesMatch = registration.adminNotes?.match(/Selected experiences: (\[.*\])/)
      if (notesMatch) {
        selectedTickets = JSON.parse(notesMatch[1]) as SelectedTicket[]
      }
    } catch (error) {
      console.error('❌ Failed to parse selected tickets from admin notes:', error)
    }

    if (selectedTickets.length === 0) {
      // Fallback: create one general VR session
      const defaultTicketType = await prisma.ticketType.findFirst({
        where: { 
          isActive: true,
          availableStock: { gt: 0 }
        }
      })

      if (!defaultTicketType) {
        return NextResponse.json(
          { success: false, message: 'No VR experiences available' },
          { status: 400 }
        )
      }

      selectedTickets = [{
        ticketTypeId: defaultTicketType.id,
        name: defaultTicketType.name,
        quantity: 1,
        priceInCents: defaultTicketType.priceInCents
      }]
    }

    console.log(`🎮 Generating tickets for ${selectedTickets.length} VR experiences`)

    // ✅ GENERATE VR SESSION TICKETS
    const result = await prisma.$transaction(async (tx) => {
      const tickets = []
      let sessionSequence = 1

      for (const selectedTicket of selectedTickets) {
        // Validate ticket type still exists and has stock
        const ticketType = await tx.ticketType.findUnique({
          where: { id: selectedTicket.ticketTypeId }
        })

        if (!ticketType) {
          throw new Error(`VR experience ${selectedTicket.name} no longer available`)
        }

        if (ticketType.availableStock < selectedTicket.quantity) {
          throw new Error(`Insufficient sessions for ${selectedTicket.name}. Available: ${ticketType.availableStock}`)
        }

        const pricePerSession = Math.round(selectedTicket.priceInCents / selectedTicket.quantity)

        // Create individual VR session tickets
        for (let i = 0; i < selectedTicket.quantity; i++) {
          const sessionNumber = `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          const qrCode = `${process.env.NEXT_PUBLIC_SITE_URL}/vr/checkin/${sessionNumber}`

          const ticket = await tx.ticket.create({
            data: {
              registrationId: registration.id,
              ticketTypeId: selectedTicket.ticketTypeId,
              ticketNumber: sessionNumber,
              ticketSequence: sessionSequence++,
              qrCode,
              purchasePrice: pricePerSession,
              eventDate: new Date(), // VR sessions can be used immediately
              venue: 'VR Room Malta',
              boothLocation: 'Bugibba Square',
              status: 'GENERATED' // Generated, ready to be sent to customer
            }
          })

          tickets.push(ticket)
          console.log(`✅ Created VR session ticket ${i + 1}/${selectedTicket.quantity}: ${ticket.ticketNumber}`)
        }

        // ✅ NOW deduct the actual stock and convert reserved stock
        await tx.ticketType.update({
          where: { id: selectedTicket.ticketTypeId },
          data: {
            availableStock: { decrement: selectedTicket.quantity },
            reservedStock: { decrement: selectedTicket.quantity }, // Remove from reserved
            soldStock: { increment: selectedTicket.quantity }
          }
        })
      }

      // Update registration status if needed
      if (registration.status !== 'COMPLETED') {
        await tx.registration.update({
          where: { id: registration.id },
          data: { status: 'COMPLETED' }
        })
      }

      return { tickets }
    })

    console.log(`✅ Generated ${result.tickets.length} VR session tickets`)

    // ✅ SEND VR TICKETS via email
    let emailSent = false
    try {
      // Fix: Convert null to undefined for appliedCouponCode
      const ticketEmailData: RegistrationEmailData = {
        registrationId: registration.id,
        customerName: `${registration.firstName} ${registration.lastName}`,
        email: registration.email,
        phone: registration.phone,
        isEmsClient: false,
        ticketCount: result.tickets.length,
        finalAmount: registration.finalAmount,
        appliedCouponCode: registration.appliedCouponCode ?? undefined, // Convert null to undefined
        tickets: result.tickets.map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          customerName: `${registration.firstName} ${registration.lastName}`,
          email: registration.email,
          phone: registration.phone,
          qrCode: ticket.qrCode,
          sequence: ticket.ticketSequence || 1,
          totalTickets: result.tickets.length,
          isEmsClient: false
        }))
      }

      emailSent = await EmailService.sendTicketDelivery(ticketEmailData)
      
      // Log the ticket delivery
      await prisma.emailLog.create({
        data: {
          registrationId: registration.id,
          emailType: 'TICKET_DELIVERY',
          subject: `🎮 Your VR Room Malta Session Tickets (${result.tickets.length} sessions)`,
          recipient: registration.email,
          status: emailSent ? 'SENT' : 'FAILED',
          templateUsed: 'vr-ticket-delivery'
        }
      })

      if (emailSent) {
        // Mark tickets as sent
        await prisma.ticket.updateMany({
          where: { registrationId: registration.id },
          data: { 
            status: 'SENT',
            sentAt: new Date()
          }
        })
      }

    } catch (emailError) {
      console.error('❌ Failed to send VR ticket email:', emailError)
    }

    // ✅ LOG the generation event
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType: 'TICKET_DELIVERY',
        subject: `VR Tickets Generated by ${adminUser} (${triggerType})`,
        recipient: registration.email,
        status: 'SENT',
        templateUsed: 'admin-generation-log'
      }
    })

    console.log(`🎯 VR ticket generation completed:`, {
      registrationId: registration.id,
      ticketCount: result.tickets.length,
      emailSent,
      triggerType,
      reason
    })

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${result.tickets.length} VR session tickets`,
      data: {
        registrationId: registration.id,
        customerName: `${registration.firstName} ${registration.lastName}`,
        ticketCount: result.tickets.length,
        emailSent,
        triggerType,
        reason,
        sessions: result.tickets.map(ticket => ({
          sessionNumber: ticket.ticketNumber,
          experience: selectedTickets.find(st => st.ticketTypeId === ticket.ticketTypeId)?.name || 'VR Experience',
          qrCode: ticket.qrCode,
          status: ticket.status
        }))
      }
    })

  } catch (error: any) {
    console.error('❌ VR ticket generation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate VR tickets',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check ticket generation status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        payment: true,
        tickets: true
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'VR booking not found' },
        { status: 404 }
      )
    }

    // Determine ticket generation status
    let status = 'CANNOT_GENERATE'
    let reason = ''
    let canGenerate = false

    if (registration.tickets.length > 0) {
      status = 'TICKETS_EXIST'
      reason = 'VR session tickets already generated'
    } else if (registration.finalAmount === 0) {
      status = 'READY_FREE'
      reason = 'Free VR session - ready for admin generation'
      canGenerate = true
    } else if (registration.payment?.status === 'SUCCEEDED' && registration.status === 'COMPLETED') {
      status = 'READY_PAID'
      reason = 'Payment completed - ready for automatic generation'
      canGenerate = true
    } else if (registration.status === 'PAYMENT_PENDING') {
      status = 'AWAITING_PAYMENT'
      reason = 'Waiting for payment completion'
    } else {
      status = 'AWAITING_VERIFICATION'
      reason = 'Waiting for booking verification'
    }

    return NextResponse.json({
      success: true,
      data: {
        registrationId: registration.id,
        status,
        reason,
        canGenerate,
        hasTickets: registration.tickets.length > 0,
        ticketCount: registration.tickets.length,
        paymentStatus: registration.payment?.status,
        registrationStatus: registration.status,
        finalAmount: registration.finalAmount,
        isFree: registration.finalAmount === 0
      }
    })

  } catch (error: any) {
    console.error('❌ Error checking VR ticket status:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check ticket status',
        error: error.message 
      },
      { status: 500 }
    )
  }
}