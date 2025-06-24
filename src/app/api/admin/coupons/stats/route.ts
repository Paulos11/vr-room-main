// src/app/api/admin/coupons/stats/route.ts - Fixed stats route
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching coupon statistics...')

    const now = new Date()

    // Get basic counts
    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons
    ] = await Promise.all([
      // Total coupons
      prisma.coupon.count(),
      
      // Active coupons (properly filtered)
      prisma.coupon.count({
        where: {
          isActive: true,
          validFrom: { lte: now },
          OR: [
            { validTo: null },
            { validTo: { gte: now } }
          ]
        }
      }),
      
      // Expired coupons
      prisma.coupon.count({
        where: {
          OR: [
            { isActive: false },
            { validTo: { lt: now } }
          ]
        }
      })
    ])

    // Get total uses and savings from actual completed registrations
    const usageStats = await prisma.registration.aggregate({
      where: {
        appliedCouponId: { not: null },
        status: 'COMPLETED'
      },
      _count: { id: true },
      _sum: { discountAmount: true }
    })

    const totalUses = usageStats._count.id || 0
    const totalSavings = usageStats._sum.discountAmount || 0

    // Get top performing coupons
    const topCouponsRaw = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.code,
        c.name,
        c.discount_type as "discountType",
        c.discount_value as "discountValue",
        COUNT(r.id)::int as "currentUses"
      FROM coupons c
      LEFT JOIN registrations r ON c.id = r.applied_coupon_id AND r.status = 'COMPLETED'
      GROUP BY c.id, c.code, c.name, c.discount_type, c.discount_value
      ORDER BY COUNT(r.id) DESC
      LIMIT 5
    ` as Array<{
      id: string;
      code: string;
      name: string;
      discountType: string;
      discountValue: number;
      currentUses: number;
    }>

    // Get recent coupon activity (last 30 days)
    const recentActivity = await prisma.registration.findMany({
      where: {
        appliedCouponId: { not: null },
        status: 'COMPLETED',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      include: {
        appliedCoupon: {
          select: { code: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Sync coupon usage counts (fix any discrepancies)
    const couponsToSync = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.current_uses as "storedUses",
        COUNT(r.id)::int as "actualUses"
      FROM coupons c
      LEFT JOIN registrations r ON c.id = r.applied_coupon_id AND r.status = 'COMPLETED'
      GROUP BY c.id, c.current_uses
      HAVING c.current_uses != COUNT(r.id)
    ` as Array<{ id: string; storedUses: number; actualUses: number }>

    // Update mismatched usage counts
    for (const coupon of couponsToSync) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { currentUses: coupon.actualUses }
      })
      console.log(`Synced coupon ${coupon.id}: ${coupon.storedUses} → ${coupon.actualUses}`)
    }

    const result = {
      overview: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalUses,
        totalSavings
      },
      topCoupons: topCouponsRaw,
      recentActivity: recentActivity.map(reg => ({
        id: reg.id,
        customerName: `${reg.firstName} ${reg.lastName}`,
        couponCode: reg.appliedCoupon?.code || 'Unknown',
        couponName: reg.appliedCoupon?.name || 'Unknown',
        discountAmount: reg.discountAmount,
        createdAt: reg.createdAt
      })),
      syncedCoupons: couponsToSync.length
    }

    console.log('Coupon statistics calculated successfully:', {
      totalCoupons,
      activeCoupons,
      totalUses,
      totalSavings: totalSavings / 100,
      syncedCoupons: couponsToSync.length
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('Error fetching coupon stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error fetching statistics', 
        error: error.message,
        // Provide fallback data
        data: {
          overview: {
            totalCoupons: 0,
            activeCoupons: 0,
            expiredCoupons: 0,
            totalUses: 0,
            totalSavings: 0
          },
          topCoupons: [],
          recentActivity: []
        }
      },
      { status: 500 }
    )
  }
}