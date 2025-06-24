// src/app/api/admin/coupons/debug/[code]/route.ts - Diagnostic route
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase()
    
    // Get coupon details
    const coupon = await prisma.coupon.findUnique({
      where: { code }
    })

    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: 'Coupon not found'
      })
    }

    // Get all registrations that used this coupon
    const allRegistrations = await prisma.registration.findMany({
      where: {
        appliedCouponCode: code
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        appliedCouponId: true,
        appliedCouponCode: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get only completed registrations
    const completedRegistrations = allRegistrations.filter(r => r.status === 'COMPLETED')

    // Get unique users who used this coupon
    const uniqueUsers = Array.from(
      new Set(completedRegistrations.map(r => r.email))
    ).map(email => {
      const userRegistrations = completedRegistrations.filter(r => r.email === email)
      return {
        email,
        usageCount: userRegistrations.length,
        registrations: userRegistrations
      }
    })

    // Calculate actual usage counts
    const actualTotalUsage = completedRegistrations.length
    const actualUniqueUserCount = uniqueUsers.length

    return NextResponse.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          currentUses: coupon.currentUses,
          maxUses: coupon.maxUses,
          maxUsesPerUser: coupon.maxUsesPerUser,
          isActive: coupon.isActive
        },
        actualUsage: {
          totalRegistrations: allRegistrations.length,
          completedRegistrations: completedRegistrations.length,
          uniqueUsers: actualUniqueUserCount,
          shouldCurrentUsesBecome: actualTotalUsage
        },
        discrepancy: {
          storedVsActual: coupon.currentUses !== actualTotalUsage,
          storedUses: coupon.currentUses,
          actualUses: actualTotalUsage,
          difference: actualTotalUsage - coupon.currentUses
        },
        registrations: allRegistrations,
        userBreakdown: uniqueUsers,
        validation: {
          totalUsageLimitReached: coupon.maxUses ? actualTotalUsage >= coupon.maxUses : false,
          anyUserExceededLimit: uniqueUsers.some(user => 
            coupon.maxUsesPerUser ? user.usageCount >= coupon.maxUsesPerUser : false
          )
        }
      }
    })

  } catch (error: any) {
    console.error('Error in diagnostic check:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to check coupon', error: error.message },
      { status: 500 }
    )
  }
}