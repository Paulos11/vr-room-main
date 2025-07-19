// src/app/api/vr-register/route.ts - VR Room Malta registration (FIXED - 50 ticket limit)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma, TicketType } from '@prisma/client'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'

// Schema for VR ticket selection - ✅ FIXED: Changed to 50
const VRSelectedTicketSchema = z.object({
  ticketTypeId: z.string(),
  name: z.string(),
  priceInCents: z.number(),
  quantity: z.number().min(1).max(50) // ✅ CHANGED: From .max(10) to .max(50)
});

// VR Registration schema - simplified, no EMS fields
const VRRegisterSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(8),
  selectedTickets: z.array(VRSelectedTicketSchema).min(1),
  couponCode: z.string().optional(),
  appliedDiscount: z.number().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "VR experience terms must be accepted"
  }),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: "Privacy policy must be accepted"
  })
});

interface VRTicketValidationDetail {
  ticketType: TicketType;
  selectedTicket: z.infer<typeof VRSelectedTicketSchema>;
  effectivePrice: number;
  ticketTotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = VRRegisterSchema.parse(body)

    console.log('🎮 VR booking request:', {
      email: validatedData.email,
      selectedTickets: validatedData.selectedTickets.length,
      totalSessions: validatedData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
      appliedDiscount: validatedData.appliedDiscount
    })

    // Validate VR experiences and calculate pricing
    let totalOriginalAmount = 0;
    const ticketValidations: VRTicketValidationDetail[] = [];

    for (const selectedTicket of validatedData.selectedTickets) {
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: selectedTicket.ticketTypeId }
      });

      if (!ticketType || !ticketType.isActive) {
        return NextResponse.json(
          { success: false, message: `VR experience ${selectedTicket.name} is not available` },
          { status: 400 }
        );
      }

      if (ticketType.availableStock < selectedTicket.quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient sessions available for ${selectedTicket.name}` },
          { status: 400 }
        );
      }

      // ✅ ADDITIONAL CHECK: Verify maxPerOrder limit from database
      if (selectedTicket.quantity > ticketType.maxPerOrder) {
        return NextResponse.json(
          { success: false, message: `Maximum ${ticketType.maxPerOrder} sessions allowed for ${selectedTicket.name}` },
          { status: 400 }
        );
      }

      // For VR, use the exact price sent from frontend
      const effectivePrice = selectedTicket.priceInCents;
      const ticketTotal = effectivePrice;
      totalOriginalAmount += ticketTotal;

      console.log(`✅ VR experience validation for ${selectedTicket.name}:`, {
        pricePerSession: ticketType.priceInCents,
        quantity: selectedTicket.quantity,
        maxPerOrder: ticketType.maxPerOrder,
        totalPrice: ticketTotal
      })

      ticketValidations.push({
        ticketType,
        selectedTicket,
        effectivePrice,
        ticketTotal
      });
    }

    console.log('💰 Total VR booking amount:', totalOriginalAmount)

    // Handle coupon validation for VR bookings
    let appliedCoupon = null;
    let discountAmount = validatedData.appliedDiscount || 0;
    let totalFinalAmount = totalOriginalAmount;

    if (validatedData.couponCode && discountAmount > 0) {
      const coupon = await prisma.coupon.findUnique({
        where: {
          code: validatedData.couponCode.toUpperCase(),
          isActive: true
        }
      });

      if (coupon) {
        const now = new Date();
        const isValidTime = coupon.validFrom <= now && (!coupon.validTo || coupon.validTo >= now);
        
        // Calculate real-time usage
        const actualUsage = await prisma.registration.count({
          where: {
            appliedCouponCode: coupon.code,
            status: 'COMPLETED'
          }
        });

        const hasUsageLeft = !coupon.maxUses || actualUsage < coupon.maxUses;
        const meetsMinAmount = !coupon.minOrderAmount || totalOriginalAmount >= coupon.minOrderAmount;

        if (isValidTime && hasUsageLeft && meetsMinAmount) {
          totalFinalAmount = Math.max(0, totalOriginalAmount - discountAmount);
          appliedCoupon = coupon;

          console.log('🎫 VR coupon validation successful:', {
            code: coupon.code,
            discountAmount,
            finalAmount: totalFinalAmount
          });
        } else {
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

    console.log('💳 Final VR booking pricing:', {
      originalAmount: totalOriginalAmount,
      discountAmount,
      finalAmount: totalFinalAmount,
      requiresPayment: totalFinalAmount > 0
    })

    // ✅ FIXED: Create VR booking WITHOUT generating tickets (only registration)
    const result = await prisma.$transaction(async (tx) => {
      // Create the VR booking registration ONLY
      const registration = await tx.registration.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          idCardNumber: null, // VR bookings don't require ID
          isEmsClient: false, // VR is always public
          originalAmount: totalOriginalAmount,
          discountAmount: discountAmount,
          finalAmount: totalFinalAmount,
          appliedCouponCode: appliedCoupon?.code || null,
          appliedCouponId: appliedCoupon?.id || null,
          // ✅ CRITICAL FIX: Set proper status based on payment requirement
          status: totalFinalAmount === 0 ? 'COMPLETED' : 'PAYMENT_PENDING'
        }
      });

      // ✅ REMOVED: No ticket generation here!
      // Tickets will only be generated when:
      // 1. Payment is completed (for paid bookings)
      // 2. Admin manually generates them
      // 3. Free bookings can have tickets generated immediately by admin

      // ✅ FIXED: Only reserve stock, don't deduct it yet
      // Stock will be deducted when tickets are actually generated
      console.log('📦 Reserving VR experience stock (not deducting yet)...')
      for (const validation of ticketValidations) {
        await tx.ticketType.update({
          where: { id: validation.selectedTicket.ticketTypeId },
          data: {
            // ✅ RESERVE stock instead of deducting
            reservedStock: { increment: validation.selectedTicket.quantity }
            // availableStock will be updated when tickets are generated
          }
        });
      }

      // Update coupon usage if applied
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { currentUses: { increment: 1 } }
        });
      }

      // ✅ STORE selected tickets in registration for later ticket generation
      // You might want to add a separate table for this, but for now store in adminNotes
      const selectedTicketsInfo = JSON.stringify(validatedData.selectedTickets)
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          adminNotes: `VR Booking - Selected experiences: ${selectedTicketsInfo}`
        }
      })

      return { registration };
    });

    // ✅ FIXED: Send booking confirmation email (without tickets)
    const customerName = `${validatedData.firstName} ${validatedData.lastName}`;
    let emailSent = false;

    try {
      const emailData: RegistrationEmailData = {
        registrationId: result.registration.id,
        customerName,
        email: validatedData.email,
        phone: validatedData.phone,
        isEmsClient: false,
        ticketCount: validatedData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
        finalAmount: totalFinalAmount,
        appliedCouponCode: appliedCoupon?.code,
        // ✅ NO TICKETS in confirmation email - tickets will be sent after payment
        tickets: []
      };

      emailSent = await EmailService.sendRegistrationConfirmation(emailData);
      console.log('📧 VR booking confirmation email sent:', emailSent);

      await prisma.emailLog.create({
        data: {
          registrationId: result.registration.id,
          emailType: 'REGISTRATION_CONFIRMATION',
          subject: totalFinalAmount === 0 
            ? '🎮 VR Room Malta - Free Session Confirmed'
            : '🎮 VR Room Malta - Booking Confirmation & Payment Required',
          recipient: validatedData.email,
          status: emailSent ? 'SENT' : 'FAILED',
          errorMessage: emailSent ? null : 'Failed to send VR booking confirmation email'
        }
      });

    } catch (emailError: any) {
      console.error('❌ VR booking email failed:', emailError);
      await prisma.emailLog.create({
        data: {
          registrationId: result.registration.id,
          emailType: 'REGISTRATION_CONFIRMATION',
          subject: 'Failed to send VR booking email',
          recipient: validatedData.email,
          status: 'FAILED',
          errorMessage: `VR booking email failed: ${emailError.message}`
        }
      });
    }

    console.log('✅ VR booking created successfully (NO TICKETS YET):', {
      registrationId: result.registration.id,
      status: result.registration.status,
      finalAmount: totalFinalAmount,
      sessionCount: validatedData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
      requiresPayment: totalFinalAmount > 0,
      ticketsGenerated: false // ✅ IMPORTANT: No tickets generated yet
    })

    // ✅ FIXED: Return success response with clear messaging
    return NextResponse.json({
      success: true,
      message: totalFinalAmount === 0 
        ? 'VR booking confirmed! Admin will generate your session tickets shortly.'
        : 'VR booking confirmed! Complete payment to receive your session tickets.',
      data: {
        id: result.registration.id,
        email: result.registration.email,
        status: result.registration.status,
        finalAmount: totalFinalAmount,
        appliedCouponCode: appliedCoupon?.code,
        sessionCount: validatedData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
        emailSent: emailSent,
        requiresPayment: totalFinalAmount > 0,
        // ✅ IMPORTANT: Show what was booked, but no actual tickets yet
        bookedExperiences: validatedData.selectedTickets.map(ticket => ({
          experienceName: ticket.name,
          quantity: ticket.quantity,
          totalPrice: ticket.priceInCents
        })),
        // ✅ CLEAR STATUS MESSAGE
        ticketStatus: totalFinalAmount === 0 
          ? 'Free sessions booked - tickets will be generated by admin'
          : 'Payment required - tickets will be generated after payment completion',
        nextSteps: totalFinalAmount === 0 
          ? ['Admin will review and generate your session tickets', 'You will receive tickets via email']
          : ['Complete payment process', 'Tickets will be generated automatically after payment', 'Check your email for payment instructions']
      }
    });

  } catch (error: any) {
    console.error('❌ VR Booking Error:', error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, message: 'Booking conflict occurred. Please try again.' },
          { status: 409 }
        );
      }
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid booking data provided.', errors: error.errors },
        { status: 400 }
      );
    }

    // Generic fallback error
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred during VR booking.' },
      { status: 500 }
    );
  }
}