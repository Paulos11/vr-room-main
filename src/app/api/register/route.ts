
// Enhanced API Route for Registration
// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const RegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  idCardNumber: z.string().min(5, 'Please enter a valid ID card number'),
  isEmsClient: z.boolean(),
  companyName: z.string().optional(),
  emsCustomerId: z.string().optional(),
  accountManager: z.string().optional(),
  panelInterest: z.boolean().optional(),
  panelType: z.string().optional(),
  interestLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedBudget: z.string().optional(),
  timeframe: z.string().optional(),
  panelNotes: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, 'You must accept the privacy policy')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RegistrationSchema.parse(body)
    
    // Check for existing email
    const existingRegistration = await prisma.registration.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingRegistration) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 400 }
      )
    }
    
    // Check for existing ID card
    const existingIdCard = await prisma.registration.findUnique({
      where: { idCardNumber: validatedData.idCardNumber }
    })
    
    if (existingIdCard) {
      return NextResponse.json(
        { success: false, message: 'This ID card number is already registered' },
        { status: 400 }
      )
    }
    
    // Determine initial status
    const initialStatus = validatedData.isEmsClient ? 'PENDING' : 'PAYMENT_PENDING'
    
    // Create registration
    const registration = await prisma.registration.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        idCardNumber: validatedData.idCardNumber,
        isEmsClient: validatedData.isEmsClient,
        companyName: validatedData.companyName,
        emsCustomerId: validatedData.emsCustomerId,
        accountManager: validatedData.accountManager,
        status: initialStatus
      }
    })
    
    // Create panel interest if indicated
    if (validatedData.panelInterest && validatedData.panelType && validatedData.interestLevel) {
      await prisma.panelInterest.create({
        data: {
          registrationId: registration.id,
          panelType: validatedData.panelType,
          interestLevel: validatedData.interestLevel,
          estimatedBudget: validatedData.estimatedBudget,
          timeframe: validatedData.timeframe,
          notes: validatedData.panelNotes,
          status: 'NEW'
        }
      })
    }
    
    // Send appropriate email
    const emailType = validatedData.isEmsClient ? 'REGISTRATION_CONFIRMATION' : 'PAYMENT_REQUIRED'
    
    // Log email (implement actual email sending)
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType,
        subject: validatedData.isEmsClient 
          ? 'Registration Received - Pending Approval'
          : 'Complete Your VIP Registration - Payment Required',
        recipient: registration.email,
        status: 'SENT'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        id: registration.id,
        email: registration.email,
        isEmsClient: registration.isEmsClient,
        status: registration.status
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
