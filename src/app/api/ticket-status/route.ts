
// src/app/api/ticket-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SearchSchema = z.object({
  searchType: z.enum(['email', 'ticket']),
  searchValue: z.string().min(1, 'Search value is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchType, searchValue } = SearchSchema.parse(body)

    let registration

    if (searchType === 'email') {
      registration = await prisma.registration.findUnique({
        where: { email: searchValue },
        include: {
          tickets: true,
          payment: true,
          panelInterests: true
        }
      })
    } else {
      // Search by ticket number
      const ticket = await prisma.ticket.findUnique({
        where: { ticketNumber: searchValue },
        include: {
          registration: {
            include: {
              payment: true,
              panelInterests: true
            }
          }
        }
      })
      registration = ticket?.registration
    }

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'No registration found with the provided details' },
        { status: 404 }
      )
    }

    // Format the response data
    const responseData = {
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      registrationStatus: registration.status,
      ticketStatus: registration.ticket?.status || null,
      isEmsClient: registration.isEmsClient,
      createdAt: registration.createdAt,
      ticketNumber: registration.ticket?.ticketNumber || null,
      qrCode: registration.ticket?.qrCode || null,
      pdfUrl: registration.ticket?.pdfUrl || null,
      eventDate: registration.ticket?.eventDate || '2025-07-26',
      venue: registration.ticket?.venue || 'Malta Fairs and Conventions Centre',
      panelInterest: registration.panelInterests.length > 0,
      customerName: registration.companyName,
      emsCustomerId: registration.emsCustomerId
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Error searching ticket status:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid search parameters', errors: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

