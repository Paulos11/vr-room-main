
// src/app/api/tickets/generate-pdf/route.ts - Alternative endpoint for admin use
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'

export async function POST(request: NextRequest) {
  try {
    const { registrationId } = await request.json()

    if (!registrationId) {
      return NextResponse.json(
        { success: false, message: 'Registration ID required' },
        { status: 400 }
      )
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { tickets: { orderBy: { ticketSequence: 'asc' } } }
    })

    if (!registration || !registration.tickets.length) {
      return NextResponse.json(
        { success: false, message: 'Registration or tickets not found' },
        { status: 404 }
      )
    }

    // Generate PDF and save to storage (implement your storage solution)
    const ticketDataArray = registration.tickets.map((ticket, index) => ({
      ticketNumber: ticket.ticketNumber,
      customerName: `${registration.firstName} ${registration.lastName}`,
      email: registration.email,
      phone: registration.phone,
      qrCode: ticket.qrCode,
      sequence: ticket.ticketSequence || (index + 1),
      totalTickets: registration.tickets.length,
      isEmsClient: registration.isEmsClient
    }))

    const pdfBuffer = await PDFTicketGenerator.generateAllTicketsPDF(ticketDataArray)

    // In a real implementation, save to cloud storage and return URL
    // For now, we'll return base64 encoded PDF
    const base64Pdf = pdfBuffer.toString('base64')

    return NextResponse.json({
      success: true,
      data: {
        pdfBase64: base64Pdf,
        filename: `EMS_VIP_Tickets_${registration.firstName}_${registration.lastName}.pdf`,
        ticketCount: registration.tickets.length
      }
    })

  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate PDF', error: error.message },
      { status: 500 }
    )
  }
}