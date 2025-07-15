// src/app/api/admin/dashboard/route.ts - VR Room Malta Dashboard API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('=== VR DASHBOARD API DEBUG ===')
    
    // Calculate date ranges
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    console.log('Date ranges:', { todayStart, monthStart })

    // Get booking statistics
    const [
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      todayBookings,
      upcomingBookings
    ] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { status: 'COMPLETED' } }),
      prisma.registration.count({ where: { status: 'PAYMENT_PENDING' } }),
      prisma.registration.count({ where: { status: 'CANCELLED' } }),
      prisma.registration.count({
        where: {
          createdAt: { gte: todayStart },
          status: { in: ['COMPLETED', 'PAYMENT_PENDING'] }
        }
      }),
      prisma.registration.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: now } // Future bookings
        }
      })
    ])

    console.log('Booking stats:', {
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      todayBookings,
      upcomingBookings
    })

    // Get VR session statistics
    const [
      totalSessions,
      scheduledSessions,
      completedSessions,
      cancelledSessions
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: { in: ['GENERATED', 'SENT'] } } }),
      prisma.ticket.count({ where: { status: 'USED' } }),
      prisma.ticket.count({ where: { status: 'CANCELLED' } })
    ])

    console.log('Session stats:', {
      totalSessions,
      scheduledSessions,
      completedSessions,
      cancelledSessions
    })

    // Get revenue statistics
    const [totalRevenue, monthlyRevenue] = await Promise.all([
      prisma.registration.aggregate({
        _sum: { finalAmount: true },
        where: { status: 'COMPLETED' }
      }),
      prisma.registration.aggregate({
        _sum: { finalAmount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: monthStart }
        }
      })
    ])

    console.log('Revenue stats:', { totalRevenue, monthlyRevenue })

    // Get VR experience statistics
    const [
      totalExperiences,
      activeExperiences,
      popularExperience,
      totalExperienceSessions
    ] = await Promise.all([
      prisma.ticketType.count({ where: { category: 'VR_EXPERIENCE' } }),
      prisma.ticketType.count({ 
        where: { 
          category: 'VR_EXPERIENCE',
          isActive: true 
        } 
      }),
      prisma.ticketType.findFirst({
        where: { category: 'VR_EXPERIENCE' },
        orderBy: { soldStock: 'desc' }
      }),
      prisma.ticket.count({
        where: {
          ticketType: {
            category: 'VR_EXPERIENCE'
          }
        }
      })
    ])

    console.log('Experience stats:', {
      totalExperiences,
      activeExperiences,
      popularExperience: popularExperience?.name,
      totalExperienceSessions
    })

    // Get recent activity
    const recentActivity = await prisma.$queryRaw`
      SELECT 
        'booking' as type,
        CONCAT('New VR booking: ', "firstName", ' ', "lastName") as description,
        "createdAt" as timestamp,
        "status" as status,
        "id"
      FROM registrations 
      WHERE "createdAt" >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
      
      UNION ALL
      
      SELECT 
        'session' as type,
        CONCAT('VR session completed: ', "ticketNumber") as description,
        COALESCE("sentAt", "issuedAt") as timestamp,
        CASE 
          WHEN "status" = 'USED' THEN 'completed'
          WHEN "status" = 'SENT' THEN 'active'
          ELSE 'pending'
        END as status,
        "id"
      FROM tickets 
      WHERE COALESCE("sentAt", "issuedAt") >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
      
      UNION ALL
      
      SELECT 
        'payment' as type,
        CONCAT('Payment processed: €', ROUND("amount"::numeric / 100, 2)) as description,
        "paidAt" as timestamp,
        'completed' as status,
        "id"
      FROM payments 
      WHERE "paidAt" >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
      AND "status" = 'SUCCEEDED'
      
      ORDER BY timestamp DESC 
      LIMIT 10
    ` as Array<{
      type: string
      description: string
      timestamp: Date
      status: string
      id: string
    }>

    console.log('Recent activity count:', recentActivity.length)

    // Format response data
    const dashboardData = {
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
        todayBookings: todayBookings,
        upcomingBookings: upcomingBookings
      },
      sessions: {
        total: totalSessions,
        scheduled: scheduledSessions,
        inProgress: 0, // Could track active sessions in real-time
        completed: completedSessions,
        cancelled: cancelledSessions
      },
      revenue: {
        total: totalRevenue._sum.finalAmount || 0,
        thisMonth: monthlyRevenue._sum.finalAmount || 0,
        currency: 'EUR'
      },
      experiences: {
        totalExperiences: totalExperiences,
        activeExperiences: activeExperiences,
        popularExperience: popularExperience?.name || 'Fantasy Quest VR',
        totalSessions: totalExperienceSessions
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        timestamp: activity.timestamp.toISOString(),
        status: activity.status
      }))
    }

    console.log('Dashboard data summary:', {
      totalBookings: dashboardData.bookings.total,
      totalSessions: dashboardData.sessions.total,
      totalRevenue: dashboardData.revenue.total,
      recentActivityCount: dashboardData.recentActivity.length
    })

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      message: 'VR Room Malta dashboard data retrieved successfully'
    })

  } catch (error: any) {
    console.error('=== VR DASHBOARD ERROR ===')
    console.error('Error details:', error)
    console.error('Stack trace:', error.stack)

    // Return fallback data for development
    const fallbackData = {
      bookings: {
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        todayBookings: 0,
        upcomingBookings: 0
      },
      sessions: {
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
      },
      revenue: {
        total: 0,
        thisMonth: 0,
        currency: 'EUR'
      },
      experiences: {
        totalExperiences: 6,
        activeExperiences: 6,
        popularExperience: 'Fantasy Quest VR',
        totalSessions: 0
      },
      recentActivity: [
        {
          id: 'demo-1',
          type: 'booking',
          description: 'VR Room Malta dashboard initialized',
          timestamp: new Date().toISOString(),
          status: 'completed'
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: fallbackData,
      timestamp: new Date().toISOString(),
      message: 'VR Room Malta dashboard (fallback data)',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check - just count total registrations
    const count = await prisma.registration.count()
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-VR-Dashboard-Status': 'healthy',
        'X-Total-Bookings': count.toString(),
        'X-Timestamp': new Date().toISOString()
      }
    })
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-VR-Dashboard-Status': 'unhealthy',
        'X-Error': 'Database connection failed'
      }
    })
  }
}