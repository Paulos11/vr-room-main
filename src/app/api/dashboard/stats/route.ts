// src/app/api/dashboard/stats/route.ts - Always return fresh real data
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🔄 Dashboard stats API called - fetching fresh data from database...')
  
  try {
    const startTime = Date.now()
    
    // ✅ FORCE FRESH DATA: Disable all caching
    const response = NextResponse.json(await getDashboardData(), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    const endTime = Date.now()
    console.log(`✅ Dashboard data fetched successfully in ${endTime - startTime}ms`)
    
    return response

  } catch (error: any) {
    console.error('❌ Dashboard stats API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}

async function getDashboardData() {
  console.log('📊 Executing database queries...')
  
  // ✅ PARALLEL QUERIES: Fetch all data simultaneously for better performance
  const [
    registrationsData,
    ticketsData,
    panelInterestsData,
    recentRegistrations
  ] = await Promise.all([
    // Registration statistics by status
    prisma.registration.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    }),
    
    // Ticket statistics by status
    prisma.ticket.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    }),
    
    // Total panel interests count
    prisma.panelInterest.count(),
    
    // Recent registrations with related data
    prisma.registration.findMany({
      take: 15, // Get more recent records
      orderBy: { createdAt: 'desc' },
      include: {
        panelInterests: {
          select: { 
            id: true, 
            panelType: true, 
            interestLevel: true 
          }
        },
        tickets: {
          select: { 
            id: true, 
            status: true 
          }
        }
      }
    })
  ])

  console.log('📈 Processing query results...')

  // ✅ PROCESS REGISTRATION STATS: Convert to lookup object
  const registrationStats = registrationsData.reduce((acc, item) => {
    acc[item.status.toLowerCase()] = item._count.id
    return acc
  }, {} as Record<string, number>)

  // ✅ PROCESS TICKET STATS: Convert to lookup object
  const ticketStats = ticketsData.reduce((acc, item) => {
    acc[item.status.toLowerCase()] = item._count.id
    return acc
  }, {} as Record<string, number>)

  // ✅ CALCULATE TOTALS: Derive key metrics
  const totalRegistrations = Object.values(registrationStats).reduce((sum, count) => sum + count, 0)
  const pendingVerifications = registrationStats.pending || 0
  const verifiedClients = (registrationStats.verified || 0) + (registrationStats.completed || 0)
  const ticketsGenerated = Object.values(ticketStats).reduce((sum, count) => sum + count, 0)

  // ✅ FORMAT RECENT REGISTRATIONS: Prepare for frontend
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

  // ✅ PREPARE RESPONSE: Complete dashboard data
  const dashboardData = {
    totalRegistrations,
    pendingVerifications,
    verifiedClients,
    ticketsGenerated,
    panelInterests: panelInterestsData,
    recentRegistrations: formattedRecentRegistrations,
    
    // ✅ DETAILED BREAKDOWN: For advanced analytics
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

  console.log('✅ Dashboard data prepared:', {
    totalRegistrations: dashboardData.totalRegistrations,
    pendingVerifications: dashboardData.pendingVerifications,
    verifiedClients: dashboardData.verifiedClients,
    ticketsGenerated: dashboardData.ticketsGenerated,
    panelInterests: dashboardData.panelInterests,
    recentCount: dashboardData.recentRegistrations.length
  })

  return {
    success: true,
    data: dashboardData,
    timestamp: new Date().toISOString(),
    source: 'database'
  }
}