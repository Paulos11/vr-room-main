// src/app/api/test-coupon/route.ts - Simple test for the TRY coupon
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.toUpperCase() || 'TRY'
    const email = searchParams.get('email')

    console.log('Testing coupon:', code, 'for email:', email)

    // Get the coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code }
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' })
    }

    // Get ALL registrations with this coupon
    const allRegistrations = await prisma.registration.findMany({
      where: {
        OR: [
          { appliedCouponCode: code },
          { appliedCouponId: coupon.id }
        ]
      },
      select: {
        id: true,
        email: true,
        status: true,
        appliedCouponCode: true,
        appliedCouponId: true,
        createdAt: true
      }
    })

    // Count completed registrations
    const completedRegistrations = allRegistrations.filter(r => r.status === 'COMPLETED')

    // Count for specific email if provided
    let userCompletedCount = 0
    if (email) {
      userCompletedCount = completedRegistrations.filter(r => r.email === email).length
    }

    // Raw SQL query to double-check
    const rawCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM registrations 
      WHERE applied_coupon_code = ${code} 
      AND status = 'COMPLETED'
    ` as [{ count: bigint }]

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        currentUses: coupon.currentUses,
        maxUses: coupon.maxUses,
        maxUsesPerUser: coupon.maxUsesPerUser
      },
      registrations: {
        total: allRegistrations.length,
        completed: completedRegistrations.length,
        byUser: email ? userCompletedCount : 'No email provided'
      },
      rawSQLCount: Number(rawCount[0].count),
      shouldBlock: {
        totalUsage: coupon.maxUses ? completedRegistrations.length >= coupon.maxUses : false,
        userUsage: email && coupon.maxUsesPerUser ? userCompletedCount >= coupon.maxUsesPerUser : false
      },
      allRegistrationsDetail: allRegistrations,
      completedRegistrationsDetail: completedRegistrations
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({ error: error.message })
  }
}