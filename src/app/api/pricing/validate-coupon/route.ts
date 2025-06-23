
// src/app/api/pricing/validate-coupon/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PricingService } from '@/lib/pricingService'
import { z } from 'zod'

const CouponValidationSchema = z.object({
  couponCode: z.string().min(1),
  isEmsClient: z.boolean(),
  orderAmount: z.number().min(0) // in cents
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CouponValidationSchema.parse(body)

    const validation = await PricingService.validateCoupon(
      validatedData.couponCode,
      validatedData.isEmsClient,
      validatedData.orderAmount
    )

    if (validation.isValid && validation.coupon) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: true,
          coupon: {
            id: validation.coupon.id,
            code: validation.coupon.code,
            name: validation.coupon.name,
            description: validation.coupon.description,
            discountType: validation.coupon.discountType,
            discountValue: validation.coupon.discountValue,
            formattedDiscount: validation.coupon.discountType === 'PERCENTAGE' 
              ? `${validation.coupon.discountValue}%`
              : PricingService.formatPrice(validation.coupon.discountValue)
          }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        data: {
          isValid: false,
          error: validation.error
        }
      })
    }
  } catch (error: any) {
    console.error('Coupon validation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Error validating coupon' },
      { status: 500 }
    )
  }
}