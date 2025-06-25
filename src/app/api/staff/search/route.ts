import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple staff token verification (should be consistent across APIs)
function verifyStaffToken(authHeader: string | null): { valid: boolean; staffId?: string } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false }
  }
  const token = authHeader.replace('Bearer ', '')
  const parts = token.split('_')
  if (parts.length >= 2 && parts[0] === 'staff') {
    return { valid: true, staffId: parts[1] }
  }
  return { valid: false }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the staff member
    const authHeader = request.headers.get('authorization')
    const authResult = verifyStaffToken(authHeader)
    if (!authResult.valid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get the search query from URL parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query || query.length < 4) {
      return NextResponse.json(
        { message: 'Search query must be at least 4 characters long.' },
        { status: 400 }
      )
    }

    // 3. Perform the database search with ticket type information
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          // Search by ticket number
          {
            ticketNumber: {
              endsWith: query.toUpperCase(),
            },
          },
          // Search by customer name
          {
            registration: {
              OR: [
                {
                  firstName: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
          // Search by ticket type name
          {
            ticketType: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      select: {
        ticketNumber: true,
        status: true,
        purchasePrice: true,
        registration: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            isEmsClient: true,
          },
        },
        ticketType: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Increased limit to 10 results
    })

    // 4. Format the response with ticket type information
    const formattedResults = tickets.map(ticket => ({
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      purchasePrice: ticket.purchasePrice,
      ticketTypeName: ticket.ticketType?.name || 'Unknown',
      ticketTypeCategory: ticket.ticketType?.category || null,
      registration: {
        firstName: ticket.registration.firstName,
        lastName: ticket.registration.lastName,
        email: ticket.registration.email,
        isEmsClient: ticket.registration.isEmsClient,
        fullName: `${ticket.registration.firstName} ${ticket.registration.lastName}`,
      },
    }))

    console.log(`Staff ${authResult.staffId} searched for "${query}", found ${formattedResults.length} results.`)

    return NextResponse.json(formattedResults)

  } catch (error) {
    console.error('❌ Ticket search API error:', error)
    return NextResponse.json(
      { message: 'Internal server error during search.' },
      { status: 500 }
    )
  }
}