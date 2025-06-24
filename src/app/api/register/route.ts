// src/app/api/register/route.ts - Complete with email integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma, TicketType } from '@prisma/client'
import { EmailService, RegistrationEmailData } from '@/lib/emailService'
import { PDFTicketGenerator } from '@/lib/pdfTicketGenerator'

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
        const now = new Date();
        const isValidTime = coupon.validFrom <= now && (!coupon.validTo || coupon.validTo >= now);
        const hasUsageLeft = !coupon.maxUses || coupon.currentUses < coupon.maxUses;
        const meetsMinAmount = !coupon.minOrderAmount || totalOriginalAmount >= coupon.minOrderAmount;

        if (isValidTime && hasUsageLeft && meetsMinAmount) {
          let calculatedDiscount = 0;
          if (coupon.discountType === 'PERCENTAGE') {
            calculatedDiscount = Math.round((totalOriginalAmount * coupon.discountValue) / 100);
          } else if (coupon.discountType === 'FIXED_AMOUNT') {
            calculatedDiscount = Math.min(coupon.discountValue, totalOriginalAmount);
          }

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

    // Create all database records within a single transaction
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
          status: validatedData.isEmsClient ? 'COMPLETED' : 'PAYMENT_PENDING' // EMS clients are immediately completed
        }
      });

      // 2. Create individual tickets for the registration
      const tickets = [];
      let ticketSequence = 1;
      
      for (const validation of ticketValidations) {
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
              purchasePrice: validation.ticketPrice,
              eventDate: new Date('2025-06-26'),
              venue: 'Malta Fairs and Conventions Centre',
              boothLocation: 'EMS Booth - MFCC',
              status: validatedData.isEmsClient ? 'GENERATED' : 'GENERATED' // Will be updated to SENT after email
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
            panelType: 'SOLAR_PANELS',
            interestLevel: 'MEDIUM',
            status: 'NEW'
          }
        });
      }

      // 5. Increment coupon usage for EMS clients immediately
      if (appliedCoupon && validatedData.isEmsClient) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { currentUses: { increment: 1 } }
        });
        console.log(`Coupon ${appliedCoupon.code} usage incremented for EMS customer.`);
      }

      return { registration, tickets };
    });

    // 6. 🎯 EMAIL INTEGRATION - Send emails after successful registration
    const customerName = `${validatedData.firstName} ${validatedData.lastName}`;
    let emailSent = false;
    
    try {
      if (validatedData.isEmsClient) {
        // For EMS clients: Generate PDF tickets and send email immediately
        console.log('Generating PDF tickets for EMS customer:', result.registration.id);
        
        const pdfBuffer = await PDFTicketGenerator.generateTicketsFromRegistration({
          ...result.registration,
          tickets: result.tickets
        });

        const emailData: RegistrationEmailData = {
          registrationId: result.registration.id,
          customerName,
          email: validatedData.email,
          phone: validatedData.phone,
          isEmsClient: true,
          ticketCount: result.tickets.length,
          finalAmount: 0, // Free for EMS customers
          appliedCouponCode: appliedCoupon?.code,
          tickets: result.tickets.map(ticket => ({
            ticketNumber: ticket.ticketNumber,
            customerName,
            email: validatedData.email,
            phone: validatedData.phone,
            qrCode: ticket.qrCode,
            sequence: ticket.ticketSequence || 1,
            totalTickets: result.tickets.length,
            isEmsClient: true
          }))
        };

        // Send registration confirmation with PDF tickets attached
        emailSent = await EmailService.sendPaymentConfirmation(emailData, pdfBuffer);
        console.log('EMS customer email sent:', emailSent);
        
        // Update tickets to SENT status
        await prisma.ticket.updateMany({
          where: { registrationId: result.registration.id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        });
        
        // Log email activity
        await prisma.emailLog.create({
          data: {
            registrationId: result.registration.id,
            emailType: 'TICKET_DELIVERY',
            subject: '🎫 Your EMS VIP Tickets - Ready for Use!',
            recipient: validatedData.email,
            status: emailSent ? 'SENT' : 'FAILED',
            errorMessage: emailSent ? null : 'Failed to send EMS registration email'
          }
        });
        
      } else {
        // For public customers: Send registration confirmation (payment required)
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
        
        // Log email activity
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
      // Don't fail the registration if email fails - log the error
      await prisma.emailLog.create({
        data: {
          registrationId: result.registration.id,
          emailType: validatedData.isEmsClient ? 'TICKET_DELIVERY' : 'REGISTRATION_CONFIRMATION',
          subject: 'Failed to send registration email',
          recipient: validatedData.email,
          status: 'FAILED',
          errorMessage: `Email sending failed: ${emailError.message}`
        }
      });
    }

    // Return success response
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
        ticketCount: result.tickets.length,
        emailSent: emailSent
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