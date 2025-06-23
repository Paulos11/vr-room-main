// src/app/api/admin/registrations/compact/route.ts - Updated with correct field names
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'; // Added this line

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const loadAll = searchParams.get('all') === 'true'
    
    // For optimized filtering, load all data without server-side filtering
    const where: any = {}
    
    // Only apply server-side filters if not loading all data
    if (!loadAll) {
      const status = searchParams.get('status')
      const search = searchParams.get('search')
      
      if (status && status !== 'all') {
        where.status = status
      }
      
      if (search) {
        const searchTerm = search.trim()
        where.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { customerName: { contains: searchTerm, mode: 'insensitive' } },
          { id: { contains: searchTerm, mode: 'insensitive' } }
        ]
      }
    }
    
    // Super optimized parallel queries with minimal selects but including modal data
    const [registrations, stats] = await Promise.all([
      // Updated field names to match new schema
      prisma.registration.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          idCardNumber: true,
          status: true,
          isEmsClient: true,
          // Updated EMS customer fields
          customerName: true,
          orderNumber: true,
          applicationNumber: true,
          orderDate: true,
          adminNotes: true,
          verifiedAt: true,
          verifiedBy: true,
          rejectedReason: true,
          createdAt: true,
          // Only count tickets, don't fetch full data
          _count: {
            select: {
              tickets: true,
              panelInterests: true
            }
          },
          // Get tickets for modal
          tickets: {
            select: { 
              id: true,
              ticketNumber: true, 
              status: true
            },
            orderBy: { createdAt: 'desc' }
          },
          // Get panel interests for modal
          panelInterests: {
            select: {
              id: true,
              panelType: true,
              interestLevel: true,
              status: true,
              notes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: loadAll ? 500 : 100 // Load more data when filtering client-side
      }),
      
      // Fast stats query - always get full stats regardless of filters
      prisma.registration.groupBy({
        by: ['status'],
        _count: { id: true }
        // No where clause to get total stats
      })
    ])
    
    // Process stats quickly
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id
      return acc
    }, {} as Record<string, number>)
    
    // Format data efficiently - minimal transformations
    const compactData = registrations.map(reg => ({
      id: reg.id,
      firstName: reg.firstName,
      lastName: reg.lastName,
      name: `${reg.firstName} ${reg.lastName}`,
      email: reg.email,
      phone: reg.phone,
      idCardNumber: reg.idCardNumber,
      status: reg.status,
      isEmsClient: reg.isEmsClient,
      // Updated field mappings
      company: reg.customerName, //
      customerName: reg.customerName, //
      orderNumber: reg.orderNumber,
      applicationNumber: reg.applicationNumber,
      orderDate: reg.orderDate?.toISOString(),
      adminNotes: reg.adminNotes,
      verifiedAt: reg.verifiedAt?.toISOString(),
      verifiedBy: reg.verifiedBy,
      rejectedReason: reg.rejectedReason,
      ticketCount: reg._count.tickets,
      hasSolar: reg._count.panelInterests > 0,
      createdAt: reg.createdAt.toISOString(),
      lastTicket: reg.tickets[0]?.ticketNumber,
      // Full data for modal
      tickets: reg.tickets,
      panelInterests: reg.panelInterests
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        registrations: compactData,
        stats: {
          total: compactData.length,
          pending: statusStats.pending || 0,
          completed: statusStats.completed || 0,
          paymentPending: statusStats.payment_pending || 0,
          rejected: statusStats.rejected || 0
        }
      }
    })
    
  } catch (error: any) {
    console.error('Compact registrations API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch registrations',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      },
      { status: 500 }
    )
  }
}