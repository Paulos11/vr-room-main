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

    // 3. Perform the database search using `endsWith`
    const tickets = await prisma.ticket.findMany({
      where: {
        ticketNumber: {
          endsWith: query.toUpperCase(),
        },
      },
      select: {
        ticketNumber: true,
        status: true,
        registration: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 5, // Limit results to 5
    })

    console.log(`Staff ${authResult.staffId} searched for "*${query}", found ${tickets.length} results.`)

    return NextResponse.json(tickets)

  } catch (error) {
    console.error('❌ Ticket search API error:', error)
    return NextResponse.json(
      { message: 'Internal server error during search.' },
      { status: 500 }
    )
  }
}