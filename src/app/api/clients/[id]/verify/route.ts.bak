
// src/app/api/clients/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ClientVerificationSchema } from '@/lib/validations'
import { generateTicketNumber } from '@/lib/utils'
import { generateTicketPDF } from '@/lib/pdf'
import { sendEmail, generateTicketEmail } from '@/lib/email'
import QRCode from 'qrcode'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = ClientVerificationSchema.parse(body)
    
    const client = await prisma.client.findUnique({
      where: { id: params.id }
    })
    
    if (!client) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      )
    }
    
    // Update client status
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes,
        verifiedAt: validatedData.status === 'VERIFIED' ? new Date() : null,
        verifiedBy: 'admin' // In a real app, this would be the admin user ID
      }
    })
    
    // If verified, generate ticket
    if (validatedData.status === 'VERIFIED') {
      const ticketNumber = generateTicketNumber()
      const qrCodeData = `EMS-TICKET-${ticketNumber}-${client.id}`
      const qrCodeUrl = await QRCode.toDataURL(qrCodeData)
      
      // Generate PDF ticket
      const ticketData = {
        ticketNumber,
        clientName: `${client.firstName} ${client.lastName}`,
        eventName: 'EMS Trade Fair VIP Experience',
        eventDates: 'July 26 - August 6, 2025',
        venue: 'Malta Fairs and Conventions Centre, Ta\' Qali',
        boothLocation: 'EMS Booth - MFCC',
        qrCode: qrCodeData,
        instructions: 'Please bring this ticket and valid ID to our booth for collection'
      }
      
      const pdfBuffer = await generateTicketPDF(ticketData)
      
      // Create ticket record
      const ticket = await prisma.ticket.create({
        data: {
          clientId: client.id,
          ticketNumber,
          qrCode: qrCodeData,
          status: 'GENERATED'
        }
      })
      
      // Send ticket email
      const emailHtml = generateTicketEmail(
        `${client.firstName} ${client.lastName}`,
        ticketData
      )
      
      const emailResult = await sendEmail({
        to: client.email,
        subject: 'Your VIP Ticket - EMS Trade Fair',
        html: emailHtml,
        attachments: [{
          filename: `EMS-Ticket-${ticketNumber}.pdf`,
          content: pdfBuffer,
          type: 'application/pdf'
        }]
      })
      
      // Update ticket status and log email
      await Promise.all([
        prisma.ticket.update({
          where: { id: ticket.id },
          data: { 
            status: emailResult.success ? 'SENT' : 'GENERATED',
            sentAt: emailResult.success ? new Date() : null
          }
        }),
        prisma.emailLog.create({
          data: {
            clientId: client.id,
            emailType: 'TICKET',
            subject: 'Your VIP Ticket - EMS Trade Fair',
            recipient: client.email,
            status: emailResult.success ? 'SENT' : 'FAILED',
            errorMessage: emailResult.success ? undefined : String(emailResult.error)
          }
        })
      ])
    }
    
    return NextResponse.json({
      success: true,
      message: `Client ${validatedData.status.toLowerCase()} successfully`,
      data: updatedClient
    })
    
  } catch (error) {
    console.error('Client verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// src/app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalRegistrations,
      pendingVerifications,
      verifiedClients,
      ticketsGenerated,
      panelInterests,
      recentRegistrations
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'PENDING' } }),
      prisma.client.count({ where: { status: 'VERIFIED' } }),
      prisma.ticket.count(),
      prisma.panelInterest.count(),
      prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          panelInterests: true
        }
      })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        totalRegistrations,
        pendingVerifications,
        verifiedClients,
        ticketsGenerated,
        panelInterests,
        recentRegistrations
      }
    })
    
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
