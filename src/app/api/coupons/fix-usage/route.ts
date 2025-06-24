// src/app/api/admin/coupons/fix-usage/route.ts - Utility to fix coupon usage counts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting coupon usage fix...')

    // Get all coupons with their actual usage counts
    const couponsWithUsage = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.code,
        c.current_uses as "currentUses",
        COUNT(r.id)::int as "actualUses"
      FROM coupons c
      LEFT JOIN registrations r ON c.id = r.applied_coupon_id AND r.status = 'COMPLETED'
      GROUP BY c.id, c.code, c.current_uses
    ` as Array<{ 
      id: string; 
      code: string; 
      currentUses: number; 
      actualUses: number 
    }>

    const fixedCoupons = []

    // Update each coupon where usage doesn't match
    for (const coupon of couponsWithUsage) {
      if (coupon.currentUses !== coupon.actualUses) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { currentUses: coupon.actualUses }
        })

        fixedCoupons.push({
          code: coupon.code,
          previousUsage: coupon.currentUses,
          actualUsage: coupon.actualUses,
          fixed: true
        })

        console.log(`Fixed coupon ${coupon.code}: ${coupon.currentUses} → ${coupon.actualUses}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCoupons.length} coupons`,
      data: {
        totalCoupons: couponsWithUsage.length,
        fixedCoupons: fixedCoupons
      }
    })

  } catch (error: any) {
    console.error('Error fixing coupon usage:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fix coupon usage', error: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to check current status
export async function GET() {
  try {
    const couponsWithUsage = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.code,
        c.name,
        c.current_uses as "currentUses",
        COUNT(r.id)::int as "actualUses",
        CASE WHEN c.current_uses = COUNT(r.id) THEN true ELSE false END as "isCorrect"
      FROM coupons c
      LEFT JOIN registrations r ON c.id = r.applied_coupon_id AND r.status = 'COMPLETED'
      GROUP BY c.id, c.code, c.name, c.current_uses
      ORDER BY c.code
    ` as Array<{ 
      id: string; 
      code: string;
      name: string;
      currentUses: number; 
      actualUses: number;
      isCorrect: boolean;
    }>

    const incorrectCoupons = couponsWithUsage.filter(c => !c.isCorrect)

    return NextResponse.json({
      success: true,
      data: {
        totalCoupons: couponsWithUsage.length,
        correctCoupons: couponsWithUsage.length - incorrectCoupons.length,
        incorrectCoupons: incorrectCoupons.length,
        coupons: couponsWithUsage,
        needsFixing: incorrectCoupons
      }
    })

  } catch (error: any) {
    console.error('Error checking coupon usage:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to check coupon usage' },
      { status: 500 }
    )
  }
}