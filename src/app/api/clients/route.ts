

// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { idNumber: { contains: search } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    // Get clients with pagination
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          tickets: true,
          panelInterests: true,
          emailLogs: {
            orderBy: { sentAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.client.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: clients,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Clients fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
