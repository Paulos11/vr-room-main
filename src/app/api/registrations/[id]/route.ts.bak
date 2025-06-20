
// src/app/api/registrations/[id]/route.ts - Updated for new schema
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        panelInterests: true,
        payment: true,
        tickets: {                    // Changed from 'ticket' to 'tickets'
          orderBy: { ticketSequence: 'asc' }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    // Format response for backward compatibility
    const responseData = {
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      idCardNumber: registration.idCardNumber,
      isEmsClient: registration.isEmsClient,
      status: registration.status,
      companyName: registration.companyName,
      emsCustomerId: registration.emsCustomerId,
      accountManager: registration.accountManager,
      createdAt: registration.createdAt,
      panelInterests: registration.panelInterests,
      payment: registration.payment,
      tickets: registration.tickets,
      ticket: registration.tickets?.[0] || null // For backward compatibility
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error: any) {
    console.error('Error fetching registration:', error.message)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch registration' },
      { status: 500 }
    )
  }
}