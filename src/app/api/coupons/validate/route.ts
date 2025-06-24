// src/app/api/coupons/validate/route.ts - IMMEDIATE FIX VERSION
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  orderAmount: z.number().min(0),
  isEmsClient: z.boolean().default(false),
  customerEmail: z.string().email().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderAmount, isEmsClient, customerEmail } = ValidateCouponSchema.parse(body)

    console.log('=== COUPON VALIDATION START ===')
    console.log('Input:', { code, customerEmail, orderAmount, isEmsClient })

    // EMS clients don't use coupons
    if (isEmsClient) {
      return NextResponse.json({
        success: false,
        message: 'Coupons are not available for EMS customers. EMS customers receive complimentary tickets.'
      })
    }

    // Find the coupon - FORCE FRESH DATA
    const coupon = await prisma.coupon.findUnique({
      where: { 
        code: code.toUpperCase(),
        isActive: true 
      }
    })

    if (!coupon) {
      console.log('Coupon not found:', code)
      return NextResponse.json({
        success: false,
        message: 'Invalid coupon code'
      })
    }

    console.log('Found coupon:', {
      id: coupon.id,
      code: coupon.code,
      storedCurrentUses: coupon.currentUses,
      maxUses: coupon.maxUses,
      maxUsesPerUser: coupon.maxUsesPerUser
    })

    const now = new Date()
    
    // Check if coupon is valid time-wise
    if (coupon.validFrom > now) {
      return NextResponse.json({
        success: false,
        message: 'This coupon is not yet available'
      })
    }

    if (coupon.validTo && coupon.validTo < now) {
      return NextResponse.json({
        success: false,
        message: 'This coupon has expired'
      })
    }

    // FORCE REAL-TIME USAGE CALCULATION - IGNORE DATABASE FIELD
    console.log('Calculating real-time usage...')
    
    // Count ACTUAL completed registrations
    const actualTotalUsage = await prisma.registration.count({
      where: {
        appliedCouponCode: coupon.code,
        status: 'COMPLETED'
      }
    })

    console.log('Real-time total usage:', actualTotalUsage)

    // Count per-user usage if email provided
    let actualUserUsage = 0
    if (customerEmail) {
      actualUserUsage = await prisma.registration.count({
        where: {
          email: customerEmail,
          appliedCouponCode: coupon.code,
          status: 'COMPLETED'
        }
      })
      console.log('Real-time user usage for', customerEmail, ':', actualUserUsage)
    }

    // CRITICAL: Check limits using REAL DATA, not stored field
    console.log('Checking limits...')
    
    // Total usage limit check
    if (coupon.maxUses && actualTotalUsage >= coupon.maxUses) {
      console.log('BLOCKED: Total usage limit reached', actualTotalUsage, '>=', coupon.maxUses)
      return NextResponse.json({
        success: false,
        message: 'This coupon has reached its usage limit and is no longer available'
      })
    }

    // Per-user limit check
    if (customerEmail && coupon.maxUsesPerUser && actualUserUsage >= coupon.maxUsesPerUser) {
      const timesText = coupon.maxUsesPerUser === 1 ? 'time' : 'times'
      console.log('BLOCKED: User usage limit reached', actualUserUsage, '>=', coupon.maxUsesPerUser)
      return NextResponse.json({
        success: false,
        message: `You have already used this coupon. Each customer can only use this coupon ${coupon.maxUsesPerUser} ${timesText}.`
      })
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return NextResponse.json({
        success: false,
        message: `This coupon requires a minimum order of €${(coupon.minOrderAmount / 100).toFixed(2)}`
      })
    }

    // Check audience restrictions
    if (coupon.emsClientsOnly && !isEmsClient) {
      return NextResponse.json({
        success: false,
        message: 'This coupon is only available for EMS customers'
      })
    }

    if (coupon.publicOnly && isEmsClient) {
      return NextResponse.json({
        success: false,
        message: 'This coupon is only available for public customers'
      })
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((orderAmount * coupon.discountValue) / 100)
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discountAmount = Math.min(coupon.discountValue, orderAmount)
    }

    // Make sure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount)

    // Fix the stored usage count if it's wrong
    if (coupon.currentUses !== actualTotalUsage) {
      console.log('FIXING: Updating stored usage count', coupon.currentUses, '->', actualTotalUsage)
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { currentUses: actualTotalUsage }
      })
    }

    console.log('VALIDATION PASSED - Coupon is valid')
    console.log('=== COUPON VALIDATION END ===')

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxUsesPerUser: coupon.maxUsesPerUser,
          currentUses: actualTotalUsage, // Return REAL usage
          maxUses: coupon.maxUses
        },
        discountAmount,
        message: `${coupon.name} applied successfully!`
      }
    })

  } catch (error: any) {
    console.error('Coupon validation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Unable to validate coupon. Please try again.' },
      { status: 500 }
    )
  }
}