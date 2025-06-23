// src/app/api/admin/registrations/search/route.ts - Search registrations for ticket generation
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'; // Added this line

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const searchTerm = query.trim()
    
    // Search in registrations
    const registrations = await prisma.registration.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm } },
          { customerName: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isEmsClient: true,
        status: true,
        customerName: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    const formattedResults = registrations.map(reg => ({
      id: reg.id,
      name: `${reg.firstName} ${reg.lastName}`,
      email: reg.email,
      phone: reg.phone,
      isEmsClient: reg.isEmsClient,
      status: reg.status,
      customerName: reg.customerName
    }))

    return NextResponse.json({
      success: true,
      data: formattedResults
    })

  } catch (error: any) {
    console.error('Registration search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to search registrations',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      },
      { status: 500 }
    )
  }
}