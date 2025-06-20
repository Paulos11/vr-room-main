// src/app/api/admin/stats/route.ts - Fast stats API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Use parallel queries for speed
    const [
      totalRegistrations,
      statusCounts,
      ticketCounts,
      recentRegistrations
    ] = await Promise.all([
      // Total count
      prisma.registration.count(),
      
      // Status breakdown
      prisma.registration.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Ticket status breakdown
      prisma.ticket.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Recent registrations (last 24 hours)
      prisma.registration.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Process status counts
    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Process ticket counts
    const ticketMap = ticketCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const stats = {
      registrations: {
        total: totalRegistrations,
        pending: statusMap.PENDING || 0,
        completed: statusMap.COMPLETED || 0,
        rejected: statusMap.REJECTED || 0,
        paymentPending: statusMap.PAYMENT_PENDING || 0,
        recent24h: recentRegistrations
      },
      tickets: {
        total: Object.values(ticketMap).reduce((sum, count) => sum + count, 0),
        generated: ticketMap.GENERATED || 0,
        sent: ticketMap.SENT || 0,
        collected: ticketMap.COLLECTED || 0,
        used: ticketMap.USED || 0
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
