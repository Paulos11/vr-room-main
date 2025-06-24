// src/app/api/register/route.ts - Fixed coupon usage tracking
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma, TicketType } from '@prisma/client'

// Schema for a single selected ticket in the request body
const SelectedTicketSchema = z.object({
  ticketTypeId: z.string(),
  name: z.string(),
  priceInCents: z.number(),
  quantity: z.number().min(1)
});

// Main registration schema for validating the request body
const RegisterSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(8),
  idCardNumber: z.string().min(3),
  isEmsClient: z.boolean(),
  selectedTickets: z.array(SelectedTicketSchema).min(1),
  customerName: z.string().optional(),
  orderNumber: z.string().optional(),
  applicationNumber: z.string().optional(),
  orderDate: z.string().optional(),
  panelInterest: z.boolean().default(false),
  couponCode: z.string().optional(),
  appliedDiscount: z.number().optional(), // Discount amount calculated on the client
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Terms and conditions must be accepted"
  }),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: "Privacy policy must be accepted"
  })
});

// Define an interface for the structure of validated ticket details
// This resolves the implicit 'any[]' type error.
interface TicketValidationDetail {
  ticketType: TicketType;
  selectedTicket: z.infer<typeof SelectedTicketSchema>;
  ticketPrice: number;
  ticketTotal: number;
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RegisterSchema.parse(body)

    // Check for existing registrations to prevent duplicates
    const [existingEmailRegistration, existingIdRegistration] = await Promise.all([
      prisma.registration.findUnique({ where: { email: validatedData.email } }),
      prisma.registration.findUnique({ where: { idCardNumber: validatedData.idCardNumber } })
    ]);

    if (existingEmailRegistration) {
      return NextResponse.json(
        { success: false, message: 'This email address is already registered for the event' },
        { status: 400 }
      );
    }

    if (existingIdRegistration) {
      return NextResponse.json(
        { success: false, message: 'This ID card number is already registered for the event' },
        { status: 400 }
      );
    }

    // Validate tickets, check stock, and calculate pricing
    let totalOriginalAmount = 0;
    // FIX: Explicitly type the array to avoid the 'any[]' error.
    const ticketValidations: TicketValidationDetail[] = [];

    for (const selectedTicket of validatedData.selectedTickets) {
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: selectedTicket.ticketTypeId }
      });

      if (!ticketType || !ticketType.isActive) {
        return NextResponse.json(
          { success: false, message: `Ticket type ${selectedTicket.name} is not available` },
          { status: 400 }
        );
      }

      if (ticketType.availableStock < selectedTicket.quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient stock for ${selectedTicket.name}` },
          { status: 400 }
        );
      }

      const ticketPrice = validatedData.isEmsClient ? 0 : ticketType.priceInCents;
      const ticketTotal = ticketPrice * selectedTicket.quantity;
      totalOriginalAmount += ticketTotal;

      ticketValidations.push({
        ticketType,
        selectedTicket,
        ticketPrice,
        ticketTotal
      });
    }

    // Handle coupon validation and discount calculation
    let appliedCoupon = null;
    let discountAmount = validatedData.appliedDiscount || 0;
    let totalFinalAmount = totalOriginalAmount;

    if (!validatedData.isEmsClient && validatedData.couponCode && discountAmount > 0) {
      const coupon = await prisma.coupon.findUnique({
        where: { 
          code: validatedData.couponCode.toUpperCase(),
          isActive: true
        }
      });

      if (coupon) {
        // Validate various coupon constraints (time, usage, min amount)
        const now = new Date();
        const isValidTime = coupon.validFrom <= now && (!coupon.validTo || coupon.validTo >= now);
        const hasUsageLeft = !coupon.maxUses || coupon.currentUses < coupon.maxUses;
        const meetsMinAmount = !coupon.minOrderAmount || totalOriginalAmount >= coupon.minOrderAmount;

        if (isValidTime && hasUsageLeft && meetsMinAmount) {
          // Recalculate discount on the backend to ensure data integrity
          let calculatedDiscount = 0;
          if (coupon.discountType === 'PERCENTAGE') {
            calculatedDiscount = Math.round((totalOriginalAmount * coupon.discountValue) / 100);
          } else if (coupon.discountType === 'FIXED_AMOUNT') {
            calculatedDiscount = Math.min(coupon.discountValue, totalOriginalAmount);
          }

          // The client-side appliedDiscount should ideally match this calculated one.
          discountAmount = calculatedDiscount;
          totalFinalAmount = Math.max(0, totalOriginalAmount - discountAmount);
          appliedCoupon = coupon;

          console.log('Coupon validation successful:', {
            code: coupon.code,
            currentUses: coupon.currentUses,
            maxUses: coupon.maxUses,
            discountAmount
          });
        } else {
          console.log('Coupon validation failed:', {
            isValidTime,
            hasUsageLeft,
            meetsMinAmount,
            currentUses: coupon.currentUses,
            maxUses: coupon.maxUses
          });
          
          return NextResponse.json(
            { success: false, message: 'Coupon is no longer valid or has reached its usage limit' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid coupon code' },
          { status: 400 }
        );
      }
    }

    // Create all database records within a single transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the main registration record
      const registration = await tx.registration.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          idCardNumber: validatedData.idCardNumber,
          isEmsClient: validatedData.isEmsClient,
          customerName: validatedData.customerName || null,
          orderNumber: validatedData.orderNumber || null,
          applicationNumber: validatedData.applicationNumber || null,
          orderDate: validatedData.orderDate ? new Date(validatedData.orderDate) : null,
          originalAmount: totalOriginalAmount,
          discountAmount: discountAmount,
          finalAmount: totalFinalAmount,
          appliedCouponCode: appliedCoupon?.code || null,
          appliedCouponId: appliedCoupon?.id || null,
          status: validatedData.isEmsClient ? 'PENDING' : 'PAYMENT_PENDING'
        }
      });

      // 2. Create individual tickets for the registration
      const tickets = [];
      for (const validation of ticketValidations) {
        for (let i = 0; i < validation.selectedTicket.quantity; i++) {
          // Note: A more robust ticket number generation might be needed for high concurrency
          const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const qrCode = `EMS-${registration.id}-${ticketNumber}`;

          const ticket = await tx.ticket.create({
            data: {
              registrationId: registration.id,
              ticketTypeId: validation.selectedTicket.ticketTypeId,
              ticketNumber,
              qrCode, // This will be migrated to a URL format later
              purchasePrice: validation.ticketPrice,
              eventDate: new Date('2025-07-26'), // Consider making this dynamic from EventSettings
              venue: 'Malta Fairs and Conventions Centre',
              boothLocation: 'EMS Booth - MFCC'
            }
          });
          tickets.push(ticket);
        }

        // 3. Update ticket stock atomically
        await tx.ticketType.update({
          where: { id: validation.selectedTicket.ticketTypeId },
          data: {
            availableStock: { decrement: validation.selectedTicket.quantity },
            soldStock: { increment: validation.selectedTicket.quantity }
          }
        });
      }

      // 4. Create a panel interest record if checked
      if (validatedData.panelInterest) {
        await tx.panelInterest.create({
          data: {
            registrationId: registration.id,
            panelType: 'SOLAR_PANELS', // Default value
            interestLevel: 'MEDIUM',   // Default value
            status: 'NEW'
          }
        });
      }

      // 5. Increment coupon usage
      // This logic correctly defers incrementing for public users until payment is confirmed (via webhook)
      if (appliedCoupon) {
        if (validatedData.isEmsClient) {
          // EMS customers don't pay, so increment usage immediately.
          await tx.coupon.update({
            where: { id: appliedCoupon.id },
            data: { currentUses: { increment: 1 } }
          });
          console.log(`Coupon ${appliedCoupon.code} usage incremented immediately for EMS customer.`);
        } else {
          // For public customers, coupon usage will be handled by the payment confirmation webhook.
          console.log(`Coupon ${appliedCoupon.code} usage for public user will be incremented after payment.`);
        }
      }

      return { registration, tickets };
    });

    // Return a success response with relevant data
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        id: result.registration.id,
        email: result.registration.email,
        isEmsClient: result.registration.isEmsClient,
        status: result.registration.status,
        finalAmount: totalFinalAmount,
        appliedCouponCode: appliedCoupon?.code,
      }
    });

  } catch (error: any) {
    console.error('Registration Error:', error);
    
    // Gracefully handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint violation
        const target = error.meta?.target as string[] || [];
        if (target.includes('email')) {
          return NextResponse.json(
            { success: false, message: 'This email address is already registered.' },
            { status: 409 } // 409 Conflict is more appropriate here
          );
        }
        if (target.includes('id_card_number')) {
          return NextResponse.json(
            { success: false, message: 'This ID card number is already registered.' },
            { status: 409 }
          );
        }
      }
    }
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided.', errors: error.errors },
        { status: 400 }
      );
    }

    // Generic fallback error
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
