// src/app/api/pricing/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PricingService } from '@/lib/pricingService'
import { z } from 'zod'

const PricingCalculationSchema = z.object({
  quantity: z.number().min(1).max(10),
  isEmsClient: z.boolean(),
  couponCode: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = PricingCalculationSchema.parse(body)

    const pricing = await PricingService.calculatePricing(
      validatedData.quantity,
      validatedData.isEmsClient,
      validatedData.couponCode
    )

    return NextResponse.json({
      success: true,
      data: {
        ...pricing,
        formattedOriginalAmount: PricingService.formatPrice(pricing.originalAmount),
        formattedDiscountAmount: PricingService.formatPrice(pricing.discountAmount),
        formattedFinalAmount: PricingService.formatPrice(pricing.finalAmount),
        hasDiscount: pricing.discountAmount > 0
      }
    })
  } catch (error: any) {
    console.error('Pricing calculation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Error calculating pricing' },
      { status: 500 }
    )
  }
}
