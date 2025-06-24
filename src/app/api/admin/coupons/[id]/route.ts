// src/app/api/admin/coupons/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const UpdateCouponSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(255).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.number().min(1).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().min(1).optional(),
  maxUsesPerUser: z.number().min(1).optional(),
  validFrom: z.string().transform(str => new Date(str)).optional(),
  validTo: z.string().transform(str => new Date(str)).optional(),
  emsClientsOnly: z.boolean().optional(),
  publicOnly: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).optional()
})

// GET - Get single coupon
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching coupon:', params.id)

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        registrations: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            finalAmount: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: coupon
    })
  } catch (error: any) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching coupon', error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Updating coupon:', params.id)

    const body = await request.json()
    const validatedData = UpdateCouponSchema.parse(body)

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: params.id }
    })

    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Validate discount value if provided
    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue && validatedData.discountValue > 100) {
      return NextResponse.json(
        { success: false, message: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    // Validate date range if both dates provided
    if (validatedData.validFrom && validatedData.validTo && validatedData.validTo <= validatedData.validFrom) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Update coupon
    const updatedCoupon = await prisma.coupon.update({
      where: { id: params.id },
      data: validatedData
    })

    console.log('Coupon updated successfully:', params.id)

    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully',
      data: updatedCoupon
    })
  } catch (error: any) {
    console.error('Error updating coupon:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Error updating coupon', error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting coupon:', params.id)

    // Check if coupon exists and has been used
    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if coupon has been used
    if (coupon._count.registrations > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete coupon that has been used. Disable it instead.' },
        { status: 400 }
      )
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id: params.id }
    })

    console.log('Coupon deleted successfully:', params.id)

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { success: false, message: 'Error deleting coupon', error: error.message },
      { status: 500 }
    )
  }
}
