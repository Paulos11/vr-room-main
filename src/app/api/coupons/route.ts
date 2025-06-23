// src/app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const CreateCouponSchema = z.object({
  code: z.string().min(2).max(20).transform(str => str.toUpperCase().trim()),
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().min(1),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().min(1).optional(),
  maxUsesPerUser: z.number().min(1).default(1),
  validFrom: z.string().transform(str => new Date(str)),
  validTo: z.string().transform(str => new Date(str)).optional(),
  emsClientsOnly: z.boolean().default(false),
  publicOnly: z.boolean().default(false),
  notes: z.string().max(500).optional()
})

// GET - List all coupons
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const currentUser = AuthService.getInstance().getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status') // 'active', 'inactive', 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [coupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: { registrations: true }
          }
        }
      }),
      prisma.coupon.count({ where })
    ])

    // Calculate additional stats for each coupon
    const couponsWithStats = coupons.map(coupon => ({
      ...coupon,
      actualUses: coupon._count.registrations,
      isExpired: coupon.validTo ? new Date(coupon.validTo) < new Date() : false,
      isNotYetValid: new Date(coupon.validFrom) > new Date(),
      usagePercentage: coupon.maxUses ? (coupon.currentUses / coupon.maxUses) * 100 : 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        coupons: couponsWithStats,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { success: false, message: 'Error fetching coupons' },
      { status: 500 }
    )
  }
}

// POST - Create new coupon
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const currentUser = AuthService.getInstance().getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CreateCouponSchema.parse(body)

    // Check for existing coupon code
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: validatedData.code }
    })

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, message: 'A coupon with this code already exists' },
        { status: 400 }
      )
    }

    // Validate discount value based on type
    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue > 100) {
      return NextResponse.json(
        { success: false, message: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    // Validate date range
    if (validatedData.validTo && validatedData.validTo <= validatedData.validFrom) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        ...validatedData,
        createdBy: currentUser.email,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    })
  } catch (error: any) {
    console.error('Error creating coupon:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Error creating coupon' },
      { status: 500 }
    )
  }
}
