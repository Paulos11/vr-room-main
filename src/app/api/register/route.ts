// src/app/api/register/route.ts - Updated registration API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { TicketType } from '@prisma/client' // Import TicketType from Prisma client

const SelectedTicketSchema = z.object({
  ticketTypeId: z.string(),
  name: z.string(),
  priceInCents: z.number(),
  quantity: z.number().min(1)
})

const RegisterSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(8),
  idCardNumber: z.string().min(3),
  isEmsClient: z.boolean(),
  selectedTickets: z.array(SelectedTicketSchema).min(1),
  // Updated EMS customer fields
  customerName: z.string().optional(),
  orderNumber: z.string().optional(),
  applicationNumber: z.string().optional(),
  orderDate: z.string().optional(), // Will be converted to Date
  panelInterest: z.boolean().default(false),
  couponCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Terms and conditions must be accepted"
  }),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: "Privacy policy must be accepted"
  })
})

// Define a type for the entries in ticketValidations
type TicketValidationEntry = {
  ticketType: TicketType; // This type comes from Prisma client
  selectedTicket: z.infer<typeof SelectedTicketSchema>; // Infer type from Zod schema
  ticketPrice: number;
  ticketTotal: number;
};


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RegisterSchema.parse(body)

    // Check for existing registration with same email
    const existingRegistration = await prisma.registration.findUnique({
      where: { email: validatedData.email }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Validate ticket availability and calculate pricing
    let totalOriginalAmount = 0
    let totalFinalAmount = 0
    // Explicitly type the array
    const ticketValidations: TicketValidationEntry[] = []

    for (const selectedTicket of validatedData.selectedTickets) {
      // Get current ticket type info
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: selectedTicket.ticketTypeId }
      })

      if (!ticketType) {
        return NextResponse.json(
          { success: false, message: `Ticket type ${selectedTicket.name} not found` },
          { status: 400 }
        )
      }

      if (!ticketType.isActive) {
        return NextResponse.json(
          { success: false, message: `Ticket type ${selectedTicket.name} is not available` },
          { status: 400 }
        )
      }

      if (ticketType.availableStock < selectedTicket.quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient stock for ${selectedTicket.name}` },
          { status: 400 }
        )
      }

      // Validate quantity limits
      const maxQuantity = validatedData.isEmsClient ? 1 : ticketType.maxPerOrder
      if (selectedTicket.quantity > maxQuantity) {
        return NextResponse.json(
          { success: false, message: `Maximum ${maxQuantity} tickets allowed for ${selectedTicket.name}` },
          { status: 400 }
        )
      }

      // Calculate pricing
      const ticketPrice = validatedData.isEmsClient ? 0 : ticketType.priceInCents
      const ticketTotal = ticketPrice * selectedTicket.quantity
      
      totalOriginalAmount += ticketTotal
      totalFinalAmount += ticketTotal

      ticketValidations.push({
        ticketType,
        selectedTicket,
        ticketPrice,
        ticketTotal
      })
    }

    // Handle coupon if provided (for non-EMS customers)
    let appliedCoupon = null
    let discountAmount = 0

    if (!validatedData.isEmsClient && validatedData.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { 
          code: validatedData.couponCode.toUpperCase(),
          isActive: true
        }
      })

      if (coupon) {
        // Validate coupon (simplified version)
        const now = new Date()
        const isValidTime = coupon.validFrom <= now && (!coupon.validTo || coupon.validTo >= now)
        const hasUsageLeft = !coupon.maxUses || coupon.currentUses < coupon.maxUses
        const meetsMinAmount = !coupon.minOrderAmount || totalOriginalAmount >= coupon.minOrderAmount

        if (isValidTime && hasUsageLeft && meetsMinAmount) {
          // Calculate discount
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = Math.round((totalOriginalAmount * coupon.discountValue) / 100)
          } else if (coupon.discountType === 'FIXED_AMOUNT') {
            discountAmount = Math.min(coupon.discountValue, totalOriginalAmount)
          }

          totalFinalAmount = Math.max(0, totalOriginalAmount - discountAmount)
          appliedCoupon = coupon
        }
      }
    }

    // Convert orderDate string to Date if provided
    let orderDate = null
    if (validatedData.orderDate) {
      orderDate = new Date(validatedData.orderDate)
    }

    // Create registration in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create registration with updated field names
      const registration = await tx.registration.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          idCardNumber: validatedData.idCardNumber,
          isEmsClient: validatedData.isEmsClient,
          // Updated EMS customer fields
          customerName: validatedData.customerName || null,
          orderNumber: validatedData.orderNumber || null,
          applicationNumber: validatedData.applicationNumber || null,
          orderDate: orderDate,
          originalAmount: totalOriginalAmount,
          discountAmount: discountAmount,
          finalAmount: totalFinalAmount,
          appliedCouponCode: appliedCoupon?.code || null,
          appliedCouponId: appliedCoupon?.id || null,
          status: validatedData.isEmsClient ? 'PENDING' : 'PAYMENT_PENDING'
        }
      })

      // Create tickets
      const tickets = []
      for (const validation of ticketValidations) {
        for (let i = 0; i < validation.selectedTicket.quantity; i++) {
          const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          const qrCode = `EMS-${registration.id}-${ticketNumber}`

          const ticket = await tx.ticket.create({
            data: {
              registrationId: registration.id,
              ticketTypeId: validation.selectedTicket.ticketTypeId,
              ticketNumber,
              qrCode,
              purchasePrice: validation.ticketPrice,
              eventDate: new Date('2025-07-26'), // Use your event date
              venue: 'Malta Fairs and Conventions Centre',
              boothLocation: 'EMS Booth - MFCC'
            }
          })

          tickets.push(ticket)
        }

        // Update ticket type stock
        await tx.ticketType.update({
          where: { id: validation.selectedTicket.ticketTypeId },
          data: {
            availableStock: {
              decrement: validation.selectedTicket.quantity
            },
            soldStock: {
              increment: validation.selectedTicket.quantity
            }
          }
        })
      }

      // Create panel interest if applicable
      if (validatedData.panelInterest) {
        await tx.panelInterest.create({
          data: {
            registrationId: registration.id,
            panelType: 'SOLAR_PANELS',
            interestLevel: 'MEDIUM',
            status: 'NEW'
          }
        })
      }

      // Update coupon usage if applied
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: {
            currentUses: {
              increment: 1
            }
          }
        })
      }

      return { registration, tickets }
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        id: result.registration.id,
        email: result.registration.email,
        isEmsClient: result.registration.isEmsClient,
        status: result.registration.status,
        selectedTickets: validatedData.selectedTickets,
        ticketNumbers: result.tickets.map(t => t.ticketNumber),
        totalCostCents: totalFinalAmount,
        savingsAmount: discountAmount,
        pendingApproval: validatedData.isEmsClient
      }
    })

  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}