// src/app/api/registrations/[id]/route.ts - Add this endpoint to fetch registration details
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          include: {
            ticketType: {
              select: {
                name: true,
                priceInCents: true
              }
            }
          }
        },
        panelInterests: true,
        payment: true
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: registration
    })

  } catch (error: any) {
    console.error('Error fetching registration:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch registration' },
      { status: 500 }
    )
  }
}
