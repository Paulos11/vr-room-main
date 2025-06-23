// src/app/api/registrations/[id]/route.ts - Fixed database query
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching registration:', params.id)

    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: {
        panelInterests: true,
        payment: true,
        tickets: {
          orderBy: {
            createdAt: "asc"  // Fixed: Use 'createdAt' instead of 'ticketSequence'
          }
        }
      }
    })

    if (!registration) {
      console.log('Registration not found:', params.id)
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    console.log('Registration found:', {
      id: registration.id,
      email: registration.email,
      status: registration.status,
      ticketCount: registration.tickets.length
    })

    return NextResponse.json({
      success: true,
      data: registration
    })

  } catch (error: any) {
    console.error('Error fetching registration:', error.message)
    console.error('Error details:', error)
    
    return NextResponse.json(
      { success: false, message: 'Error fetching registration', error: error.message },
      { status: 500 }
    )
  }
}
