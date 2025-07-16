// FIXED: src/app/api/tickets/download/route.ts - Handle VR bookings and generate tickets
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'
import Stripe from 'stripe'
import { z } from 'zod'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const DownloadSchema = z.object({
  registrationId: z.string().optional(),
  ticketNumber: z.string().optional(),
  sessionId: z.string().optional(),
}).refine(data => data.registrationId || data.ticketNumber || data.sessionId, {
  message: "Either registrationId, ticketNumber, or sessionId must be provided"
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('registrationId')
    const ticketNumber = searchParams.get('ticketNumber')
    const sessionId = searchParams.get('sessionId')

    console.log('🎫 Ticket download request:', { registrationId, ticketNumber, sessionId })

    // Validate input
    const validatedData = DownloadSchema.parse({
      registrationId: registrationId || undefined,
      ticketNumber: ticketNumber || undefined,
      sessionId: sessionId || undefined
    })

    let registration = null

    // Find registration by different methods
    if (registrationId) {
      console.log('🔍 Finding registration by ID:', registrationId)
      registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { 
          tickets: { 
            orderBy: { createdAt: 'asc' },
            include: { 
              ticketType: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  priceInCents: true,
                  category: true
                }
              }
            }
          },
          payment: true
        }
      })
    } else if (ticketNumber) {
      console.log('🔍 Finding registration by ticket number:', ticketNumber)
      const ticket = await prisma.ticket.findUnique({
        where: { ticketNumber },
        include: { 
          registration: { 
            include: { 
              tickets: { 
                orderBy: { createdAt: 'asc' },
                include: { 
                  ticketType: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      priceInCents: true,
                      category: true
                    }
                  }
                }
              },
              payment: true
            } 
          } 
        }
      })
      registration = ticket?.registration
    } else if (sessionId) {
      console.log('🔍 Finding registration by session ID:', sessionId)
      // If using sessionId, verify with Stripe first
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      if (session.payment_status === 'paid') {
        const payment = await prisma.payment.findUnique({
          where: { stripePaymentId: sessionId },
          include: { 
            registration: { 
              include: { 
                tickets: { 
                  orderBy: { createdAt: 'asc' },
                  include: { 
                    ticketType: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        priceInCents: true,
                        category: true
                      }
                    }
                  }
                },
                payment: true
              } 
            } 
          }
        })
        
        registration = payment?.registration
        
        // ✅ CRITICAL FIX: Generate tickets if they don't exist after payment
        if (registration && registration.tickets.length === 0) {
          console.log('🎫 No tickets found after payment - generating VR tickets now...')
          
          // Check if this is a VR booking from metadata
          const isVRBooking = session.metadata?.bookingType === 'VR_EXPERIENCE'
          
          if (isVRBooking) {
            console.log('🎮 Detected VR booking - generating VR session tickets')
            await generateVRTicketsAfterPayment(registration.id, session)
            
            // Refetch registration with newly generated tickets
            registration = await prisma.registration.findUnique({
              where: { id: registration.id },
              include: { 
                tickets: { 
                  orderBy: { createdAt: 'asc' },
                  include: { 
                    ticketType: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        priceInCents: true,
                        category: true
                      }
                    }
                  }
                },
                payment: true
              }
            })
          }
        }
        
        // Update registration status if needed
        if (registration && registration.status === 'PAYMENT_PENDING') {
          console.log('💳 Payment successful, updating registration status to COMPLETED')
          
          registration = await prisma.registration.update({
            where: { id: registration.id },
            data: { status: 'COMPLETED' },
            include: { 
              tickets: { 
                orderBy: { createdAt: 'asc' },
                include: { 
                  ticketType: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      priceInCents: true,
                      category: true
                    }
                  }
                }
              },
              payment: true
            }
          })
          
          // Also update tickets to SENT status
          await prisma.ticket.updateMany({
            where: { registrationId: registration.id },
            data: { 
              status: 'SENT',
              sentAt: new Date()
            }
          })
          
          // Update payment status
          await prisma.payment.update({
            where: { stripePaymentId: sessionId },
            data: {
              status: 'SUCCEEDED',
              paidAt: new Date()
            }
          })
          
          console.log('✅ Registration and tickets updated successfully')
        }
      }
    }

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    // ✅ FINAL CHECK: If still no tickets, return proper error
    if (!registration.tickets || registration.tickets.length === 0) {
      console.log('❌ No tickets found for registration:', registration.id)
      console.log('Registration details:', {
        status: registration.status,
        isEmsClient: registration.isEmsClient,
        adminNotes: registration.adminNotes
      })
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'No tickets have been generated for this booking yet. Please contact support if payment was successful.',
          debug: {
            registrationId: registration.id,
            status: registration.status,
            hasPayment: !!registration.payment,
            paymentStatus: registration.payment?.status
          }
        },
        { status: 404 }
      )
    }

    // Log ticket data for debugging
    console.log('📋 Found tickets with type data:')
    registration.tickets.forEach((ticket: any, index: number) => {
      console.log(`  🎫 Ticket ${index + 1}:`)
      console.log(`    - Number: ${ticket.ticketNumber}`)
      console.log(`    - Type ID: ${ticket.ticketType?.id}`)
      console.log(`    - Type Name: "${ticket.ticketType?.name}"`)
      console.log(`    - Purchase Price: ${ticket.purchasePrice}`)
      console.log(`    - Venue: ${ticket.venue}`)
    })

    // Check payment status
    const isPaymentSuccessful = registration.payment?.status === 'SUCCEEDED' || 
                               (sessionId && await isStripePaymentSuccessful(sessionId))
    
    if (registration.status !== 'COMPLETED' && !isPaymentSuccessful) {
      return NextResponse.json(
        { success: false, message: 'Registration not completed yet' },
        { status: 400 }
      )
    }

    // ✅ FIXED: Prepare ticket data with VR Room Malta branding
    const ticketDataArray = registration.tickets.map((ticket: any, index: number) => {
      // Determine if this is a VR booking based on venue or ticket type
      const isVRTicket = ticket.venue === 'VR Room Malta' || 
                        ticket.ticketType?.category === 'VR_EXPERIENCE' ||
                        ticket.ticketType?.name?.includes('VR')

      const ticketData = {
        ticketNumber: ticket.ticketNumber,
        customerName: `${registration.firstName} ${registration.lastName}`,
        email: registration.email,
        phone: registration.phone,
        qrCode: ticket.qrCode,
        sequence: index + 1,
        totalTickets: registration.tickets.length,
        isEmsClient: false, // ✅ VR bookings are never EMS client
        isVRTicket: isVRTicket, // ✅ NEW: Flag for VR tickets
        // Ticket type information
        ticketTypeName: ticket.ticketType?.name || (isVRTicket ? 'VR Experience' : 'General Admission'),
        ticketTypePrice: ticket.purchasePrice || ticket.ticketType?.priceInCents || 0,
        // VR-specific venue info
        venue: isVRTicket ? 'VR Room Malta' : (ticket.venue || 'Malta Fairs and Conventions Centre'),
        boothLocation: isVRTicket ? 'Bugibba Square, Malta' : (ticket.boothLocation || 'EMS Booth - MFCC')
      }

      console.log(`📝 Prepared ticket data ${index + 1}:`, {
        ticketNumber: ticketData.ticketNumber,
        ticketTypeName: ticketData.ticketTypeName,
        isVRTicket: ticketData.isVRTicket,
        venue: ticketData.venue,
        boothLocation: ticketData.boothLocation
      })

      return ticketData
    })

    console.log(`🎨 Generating PDF for ${ticketDataArray.length} ticket(s)`)

    // Generate PDF with VR support
    const pdfBuffer = await PDFTicketGenerator.generateAllTicketsPDF(ticketDataArray)

    // Determine filename based on ticket type
    const isVRBooking = ticketDataArray.some(t => t.isVRTicket)
    const customerName = `${registration.firstName}_${registration.lastName}`.replace(/[^a-zA-Z0-9]/g, '_')
    
    const filename = registration.tickets.length === 1 
      ? `${isVRBooking ? 'VR' : 'EMS'}_Ticket_${registration.tickets[0].ticketNumber}.pdf`
      : `${isVRBooking ? 'VR' : 'EMS'}_Tickets_${customerName}_${registration.tickets.length}tickets.pdf`

    console.log(`📁 Generated PDF: ${filename}`)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error: any) {
    console.error('❌ Error generating ticket PDF:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request parameters', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to generate ticket PDF', error: error.message },
      { status: 500 }
    )
  }
}

// ✅ NEW: Function to generate VR tickets after payment
async function generateVRTicketsAfterPayment(registrationId: string, stripeSession: any) {
  try {
    console.log('🎮 Generating VR tickets after payment for registration:', registrationId)
    
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId }
    })

    if (!registration) {
      throw new Error('Registration not found')
    }

    // Parse VR selections from adminNotes
    let selectedTickets = []
    if (registration.adminNotes) {
      try {
        const match = registration.adminNotes.match(/Selected experiences: (\[.*\])/)
        if (match) {
          selectedTickets = JSON.parse(match[1])
          console.log('✅ Parsed VR selections:', selectedTickets)
        }
      } catch (parseError) {
        console.warn('Failed to parse VR selections:', parseError)
      }
    }

    // Fallback: create default VR ticket if no selections found
    if (selectedTickets.length === 0) {
      const defaultVRType = await prisma.ticketType.findFirst({
        where: { 
          isActive: true,
          OR: [
            { category: 'VR_EXPERIENCE' },
            { tags: { contains: 'VR' } },
            { name: { contains: 'VR' } }
          ]
        }
      })

      if (defaultVRType) {
        selectedTickets = [{
          ticketTypeId: defaultVRType.id,
          name: defaultVRType.name,
          quantity: 1,
          priceInCents: registration.originalAmount || defaultVRType.priceInCents
        }]
      }
    }

    // Generate VR session tickets
    await prisma.$transaction(async (tx) => {
      let sessionSequence = 1

      for (const selectedTicket of selectedTickets) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: selectedTicket.ticketTypeId }
        })

        if (!ticketType) {
          console.warn(`VR experience ${selectedTicket.name} not found`)
          continue
        }

        const pricePerSession = Math.round(selectedTicket.priceInCents / selectedTicket.quantity)

        // Create individual VR session tickets
        for (let i = 0; i < selectedTicket.quantity; i++) {
          const sessionNumber = `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          const qrCode = `${process.env.NEXT_PUBLIC_SITE_URL}/vr/checkin/${sessionNumber}`

          await tx.ticket.create({
            data: {
              registrationId: registration.id,
              ticketTypeId: selectedTicket.ticketTypeId,
              ticketNumber: sessionNumber,
              ticketSequence: sessionSequence++,
              qrCode,
              purchasePrice: pricePerSession,
              eventDate: new Date(),
              venue: 'VR Room Malta',
              boothLocation: 'Bugibba Square, Malta',
              status: 'SENT'
            }
          })

          console.log(`✅ Generated VR ticket: ${sessionNumber}`)
        }

        // Update stock
        await tx.ticketType.update({
          where: { id: selectedTicket.ticketTypeId },
          data: {
            availableStock: { decrement: selectedTicket.quantity },
            reservedStock: { decrement: selectedTicket.quantity },
            soldStock: { increment: selectedTicket.quantity }
          }
        })
      }
    })

    console.log('✅ VR tickets generated successfully after payment')
  } catch (error) {
    console.error('❌ Error generating VR tickets after payment:', error)
    throw error
  }
}

async function isStripePaymentSuccessful(sessionId: string): Promise<boolean> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session.payment_status === 'paid'
  } catch (error) {
    console.error('Error checking Stripe payment status:', error)
    return false
  }
}