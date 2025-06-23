
// src/app/api/admin/coupons/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = AuthService.getInstance().getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUses,
      recentActivity
    ] = await Promise.all([
      // Total coupons
      prisma.coupon.count(),
      
      // Active coupons
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
          validTo: { lt: now }
        }
      }),
      
      // Total coupon uses
      prisma.coupon.aggregate({
        _sum: { currentUses: true }
      }),
      
      // Recent coupon activity (last 30 days)
      prisma.registration.findMany({
        where: {
          appliedCouponId: { not: null },
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
    ])

    // Calculate savings from coupons
    const totalSavings = await prisma.registration.aggregate({
      _sum: { discountAmount: true },
      where: {
        appliedCouponId: { not: null }
      }
    })

    // Top performing coupons
    const topCoupons = await prisma.coupon.findMany({
      orderBy: { currentUses: 'desc' },
      take: 5,
      select: {
        id: true,
        code: true,
        name: true,
        currentUses: true,
        discountType: true,
        discountValue: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCoupons,
          activeCoupons,
          expiredCoupons,
          totalUses: totalUses._sum.currentUses || 0,
          totalSavings: totalSavings._sum.discountAmount || 0
        },
        topCoupons,
        recentActivity: recentActivity.map(reg => ({
          id: reg.id,
          customerName: `${reg.firstName} ${reg.lastName}`,
          couponCode: reg.appliedCoupon?.code,
          couponName: reg.appliedCoupon?.name,
          discountAmount: reg.discountAmount,
          createdAt: reg.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching coupon stats:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching statistics' },
      { status: 500 }
    )
  }
}