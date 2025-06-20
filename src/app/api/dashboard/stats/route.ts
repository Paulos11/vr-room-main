// src/app/api/dashboard/stats/route.ts - Real data from database
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Parallel queries for better performance
    const [
      registrationsData,
      ticketsData,
      panelInterestsData,
      recentRegistrations
    ] = await Promise.all([
      // Registration statistics
      prisma.registration.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      
      // Ticket statistics
      prisma.ticket.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      
      // Panel interests count
      prisma.panelInterest.count(),
      
      // Recent registrations with related data
      prisma.registration.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          panelInterests: {
            select: { id: true, panelType: true, interestLevel: true }
          },
          tickets: {
            select: { id: true, status: true }
          }
        }
      })
    ])

    // Process registration stats
    const registrationStats = registrationsData.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Process ticket stats
    const ticketStats = ticketsData.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Calculate totals and derived metrics
    const totalRegistrations = Object.values(registrationStats).reduce((sum, count) => sum + count, 0)
    const pendingVerifications = registrationStats.pending || 0
    const verifiedClients = (registrationStats.verified || 0) + (registrationStats.completed || 0)
    const ticketsGenerated = Object.values(ticketStats).reduce((sum, count) => sum + count, 0)

    // Format recent registrations
    const formattedRecentRegistrations = recentRegistrations.map(reg => ({
      id: reg.id,
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email,
      status: reg.status,
      isEmsClient: reg.isEmsClient,
      panelInterests: reg.panelInterests,
      ticketCount: reg.tickets.length,
      createdAt: reg.createdAt.toISOString()
    }))

    // Prepare response data
    const dashboardData = {
      totalRegistrations,
      pendingVerifications,
      verifiedClients,
      ticketsGenerated,
      panelInterests: panelInterestsData,
      recentRegistrations: formattedRecentRegistrations,
      
      // Additional breakdown for detailed view
      breakdown: {
        registrations: {
          pending: registrationStats.pending || 0,
          verified: registrationStats.verified || 0,
          completed: registrationStats.completed || 0,
          rejected: registrationStats.rejected || 0,
          paymentPending: registrationStats.payment_pending || 0
        },
        tickets: {
          generated: ticketStats.generated || 0,
          sent: ticketStats.sent || 0,
          collected: ticketStats.collected || 0,
          used: ticketStats.used || 0,
          expired: ticketStats.expired || 0,
          cancelled: ticketStats.cancelled || 0
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
