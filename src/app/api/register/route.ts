// UPDATED: src/app/api/register/route.ts - Support multiple registrations
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma, TicketType } from '@prisma/client'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'

// Schema for a single selected ticket in the request body
const SelectedTicketSchema = z.object({
  ticketTypeId: z.string(),
  name: z.string(),
  priceInCents: z.number(),
  quantity: z.number().min(1)
});

// Updated registration schema - ID card number is optional
const RegisterSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(8),
  idCardNumber: z.string().optional(), // ✅ CHANGED: Made optional
  isEmsClient: z.boolean(),
  selectedTickets: z.array(SelectedTicketSchema).min(1),
  customerName: z.string().optional(),
  orderNumber: z.string().optional(),
  applicationNumber: z.string().optional(),
  orderDate: z.string().optional(),
  panelInterest: z.boolean().default(false),
  couponCode: z.string().optional(),
  appliedDiscount: z.number().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Terms and conditions must be accepted"
  }),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: "Privacy policy must be accepted"
  })
});

interface TicketValidationDetail {
  ticketType: TicketType;
  selectedTicket: z.infer<typeof SelectedTicketSchema>;
  effectivePrice: number;
  ticketTotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RegisterSchema.parse(body)

    console.log('Registration request:', {
      email: validatedData.email,
      isEmsClient: validatedData.isEmsClient,
      selectedTickets: validatedData.selectedTickets,
      appliedDiscount: validatedData.appliedDiscount
    })

    // ✅ NEW: Updated duplicate checking logic
    if (validatedData.isEmsClient) {
      // For EMS customers: Only allow ONE pending registration at a time
      const existingPendingEmsRegistration = await prisma.registration.findFirst({
        where: {
          email: validatedData.email,
          isEmsClient: true,
          status: {
            in: ['PENDING', 'PAYMENT_PENDING'] // Check for any unresolved registrations
          }
        }
      });

      if (existingPendingEmsRegistration) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'You already have a pending EMS registration. Please wait for approval or contact support.',
            existingRegistrationId: existingPendingEmsRegistration.id,
            registrationStatus: existingPendingEmsRegistration.status
          },
          { status: 409 }
        );
      }

      console.log('EMS customer check passed - no pending registrations found');
    } else {
      // For general/public customers: No restrictions - they can register multiple times
      console.log('Public customer - multiple registrations allowed');
    }

    // ✅ UPDATED: Only check ID card uniqueness if provided and not empty
    if (validatedData.idCardNumber && validatedData.idCardNumber.trim().length > 0) {
      const existingIdRegistration = await prisma.registration.findFirst({
        where: { 
          idCardNumber: validatedData.idCardNumber.trim(),
          // Only check within active registrations to allow reuse after cancellation
          status: {
            in: ['PENDING', 'VERIFIED', 'PAYMENT_PENDING', 'COMPLETED']
          }
        }
      });

      if (existingIdRegistration) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'This ID card number is already in use for an active registration. Please use a different ID or contact support if this is an error.' 
          },
          { status: 400 }
        );
      }
    }

    // Validate tickets and use the pricing sent from frontend
    let totalOriginalAmount = 0;
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

      const effectivePrice = validatedData.isEmsClient ? 0 : selectedTicket.priceInCents;
      const ticketTotal = effectivePrice;
      totalOriginalAmount += ticketTotal;

      console.log(`Ticket validation for ${selectedTicket.name}:`, {
        originalPrice: ticketType.priceInCents,
        effectivePrice: effectivePrice,
        quantity: selectedTicket.quantity,
        ticketTotal: ticketTotal
      })

      ticketValidations.push({
        ticketType,
        selectedTicket,
        effectivePrice,
        ticketTotal
      });
    }

    console.log('Total original amount:', totalOriginalAmount)

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
        const now = new Date();
        const isValidTime = coupon.validFrom <= now && (!coupon.validTo || coupon.validTo >= now);
        const hasUsageLeft = !coupon.maxUses || coupon.currentUses < coupon.maxUses;
        const meetsMinAmount = !coupon.minOrderAmount || totalOriginalAmount >= coupon.minOrderAmount;

        if (isValidTime && hasUsageLeft && meetsMinAmount) {
          totalFinalAmount = Math.max(0, totalOriginalAmount - discountAmount);
          appliedCoupon = coupon;

          console.log('Coupon validation successful:', {
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

    console.log('Final pricing:', {
      originalAmount: totalOriginalAmount,
      discountAmount,
      finalAmount: totalFinalAmount
    })

    // Create registration and handle both flows
    let result: { registration: any; tickets: any[] };

    if (validatedData.isEmsClient) {
      // ===== EMS CUSTOMER FLOW: Registration only, NO tickets yet =====
      result = await prisma.$transaction(async (tx) => {
        // Create the main registration record - STATUS: PENDING
        const registration = await tx.registration.create({
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone,
            idCardNumber: validatedData.idCardNumber?.trim() || null, // ✅ UPDATED: Allow null
            isEmsClient: true,
            customerName: validatedData.customerName || null,
            orderNumber: validatedData.orderNumber || null,
            applicationNumber: validatedData.applicationNumber || null,
            orderDate: validatedData.orderDate ? new Date(validatedData.orderDate) : null,
            originalAmount: 0,
            discountAmount: 0,
            finalAmount: 0,
            appliedCouponCode: appliedCoupon?.code || null,
            appliedCouponId: appliedCoupon?.id || null,
            status: 'PENDING' // EMS customers start as PENDING
          }
        });

        // Store ticket selections for later generation
        await tx.registration.update({
          where: { id: registration.id },
          data: {
            adminNotes: JSON.stringify({
              pendingTickets: validatedData.selectedTickets,
              submittedAt: new Date().toISOString(),
              awaitingApproval: true
            })
          }
        });

        // Create panel interest if checked
        if (validatedData.panelInterest) {
          await tx.panelInterest.create({
            data: {
              registrationId: registration.id,
              panelType: 'SOLAR_PANELS',
              interestLevel: 'MEDIUM',
              status: 'NEW'
            }
          });
        }

        return { registration, tickets: [] };
      });

      console.log('EMS customer registration created - awaiting admin approval:', result.registration.id);

    } else {
      // ===== PUBLIC CUSTOMER FLOW: Full registration with tickets =====
      result = await prisma.$transaction(async (tx) => {
        // Create the main registration record
        const registration = await tx.registration.create({
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone,
            idCardNumber: validatedData.idCardNumber?.trim() || null, // ✅ UPDATED: Allow null
            isEmsClient: false,
            originalAmount: totalOriginalAmount,
            discountAmount: discountAmount,
            finalAmount: totalFinalAmount,
            appliedCouponCode: appliedCoupon?.code || null,
            appliedCouponId: appliedCoupon?.id || null,
            status: 'PAYMENT_PENDING'
          }
        });

        // Create individual tickets
        const tickets = [];
        let ticketSequence = 1;
               
        for (const validation of ticketValidations) {
          const pricePerIndividualTicket = Math.round(validation.effectivePrice / validation.selectedTicket.quantity);
                   
          for (let i = 0; i < validation.selectedTicket.quantity; i++) {
            const ticketNumber = `EMS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const qrCode = `${process.env.NEXT_PUBLIC_SITE_URL}/staff/verify/${ticketNumber}`;

            const ticket = await tx.ticket.create({
              data: {
                registrationId: registration.id,
                ticketTypeId: validation.selectedTicket.ticketTypeId,
                ticketNumber,
                ticketSequence: ticketSequence++,
                qrCode,
                purchasePrice: pricePerIndividualTicket,
                eventDate: new Date('2025-06-26'),
                venue: 'Malta Fairs and Conventions Centre',
                boothLocation: 'EMS Booth - MFCC',
                status: 'GENERATED'
              }
            });
            tickets.push(ticket);
          }

          // Update ticket stock
          await tx.ticketType.update({
            where: { id: validation.selectedTicket.ticketTypeId },
            data: {
              availableStock: { decrement: validation.selectedTicket.quantity },
              soldStock: { increment: validation.selectedTicket.quantity }
            }
          });
        }

        // Create panel interest if checked
        if (validatedData.panelInterest) {
          await tx.panelInterest.create({
            data: {
              registrationId: registration.id,
              panelType: 'SOLAR_PANELS',
              interestLevel: 'MEDIUM',
              status: 'NEW'
            }
          });
        }

        return { registration, tickets };
      });
    }

    // EMAIL INTEGRATION
    const customerName = `${validatedData.firstName} ${validatedData.lastName}`;
    let emailSent = false;
         
    try {
      if (validatedData.isEmsClient) {
        // For EMS clients - Send registration received email
        console.log('EMS customer registration - sending registration received email:', result.registration.id);

        const emailData: RegistrationEmailData = {
          registrationId: result.registration.id,
          customerName,
          email: validatedData.email,
          phone: validatedData.phone,
          isEmsClient: true,
          ticketCount: validatedData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
          finalAmount: 0,
          appliedCouponCode: appliedCoupon?.code,
          tickets: []
        };

        emailSent = await EmailService.sendEmsRegistrationReceived(emailData);
        console.log('EMS customer registration received email sent:', emailSent);
               
        await prisma.emailLog.create({
          data: {
            registrationId: result.registration.id,
            emailType: 'REGISTRATION_CONFIRMATION',
            subject: '📝 EMS Registration Received - Under Review',
            recipient: validatedData.email,
            status: emailSent ? 'SENT' : 'FAILED',
            errorMessage: emailSent ? null : 'Failed to send EMS registration received email'
          }
        });
               
      } else {
        // For public customers: Send registration confirmation
        const emailData: RegistrationEmailData = {
          registrationId: result.registration.id,
          customerName,
          email: validatedData.email,
          phone: validatedData.phone,
          isEmsClient: false,
          ticketCount: result.tickets.length,
          finalAmount: totalFinalAmount,
          appliedCouponCode: appliedCoupon?.code,
          tickets: result.tickets.map(ticket => ({
            ticketNumber: ticket.ticketNumber,
            customerName,
            email: validatedData.email,
            phone: validatedData.phone,
            qrCode: ticket.qrCode,
            sequence: ticket.ticketSequence || 1,
            totalTickets: result.tickets.length,
            isEmsClient: false
          }))
        };

        emailSent = await EmailService.sendRegistrationConfirmation(emailData);
        console.log('Public customer registration email sent:', emailSent);
               
        await prisma.emailLog.create({
          data: {
            registrationId: result.registration.id,
            emailType: 'REGISTRATION_CONFIRMATION',
            subject: '🎫 Registration Successful - Payment Required',
            recipient: validatedData.email,
            status: emailSent ? 'SENT' : 'FAILED',
            errorMessage: emailSent ? null : 'Failed to send registration confirmation email'
          }
        });
      }
    } catch (emailError: any) {
      console.error('Email sending failed during registration:', emailError);
      await prisma.emailLog.create({
        data: {
          registrationId: result.registration.id,
          emailType: 'REGISTRATION_CONFIRMATION',
          subject: 'Failed to send registration email',
          recipient: validatedData.email,
          status: 'FAILED',
          errorMessage: `Email sending failed: ${emailError.message}`
        }
      });
    }

    console.log('Registration completed successfully:', {
      registrationId: result.registration.id,
      isEmsClient: validatedData.isEmsClient,
      status: result.registration.status,
      finalAmount: validatedData.isEmsClient ? 0 : totalFinalAmount,
      ticketCount: validatedData.isEmsClient ? 0 : result.tickets.length
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: validatedData.isEmsClient 
        ? 'EMS registration submitted successfully. You will receive your tickets after admin approval.'
        : 'Registration successful',
      data: {
        id: result.registration.id,
        email: result.registration.email,
        isEmsClient: result.registration.isEmsClient,
        status: result.registration.status,
        finalAmount: validatedData.isEmsClient ? 0 : totalFinalAmount,
        appliedCouponCode: appliedCoupon?.code,
        ticketCount: validatedData.isEmsClient ? 0 : result.tickets.length,
        emailSent: emailSent,
        awaitingApproval: validatedData.isEmsClient
      }
    });

  } catch (error: any) {
    console.error('Registration Error:', error);
         
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[] || [];
        if (target.includes('email')) {
          return NextResponse.json(
            { success: false, message: 'This email address is already registered.' },
            { status: 409 }
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