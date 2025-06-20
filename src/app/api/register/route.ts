// src/app/api/register/route.ts - Updated: NO tickets for EMS clients until approval
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'
import { z } from 'zod'

const RegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name too long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name too long'),
  email: z.string().email('Please enter a valid email address').max(255, 'Email too long'),
  phone: z.string().min(8, 'Please enter a valid phone number').max(20, 'Phone number too long'),
  idCardNumber: z.string().min(5, 'Please enter a valid ID card number').max(50, 'ID card number too long'),
  isEmsClient: z.boolean(),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per order').optional(),
  customerName: z.string().max(100, 'Customer name too long').optional(),
  emsCustomerId: z.string().max(50, 'Customer ID too long').optional(),
  accountManager: z.string().max(100, 'Account manager name too long').optional(),
  panelInterest: z.boolean().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, 'You must accept the privacy policy')
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== REGISTRATION API DEBUG ===')
    
    const body = await request.json()
    console.log('Raw request body:', JSON.stringify(body, null, 2))
    
    const validatedData = RegistrationSchema.parse(body)
    console.log('Validated data:', JSON.stringify(validatedData, null, 2))
    
    // Set default quantity
    const quantity = validatedData.isEmsClient ? 1 : (validatedData.quantity || 1)
    console.log('Final quantity:', quantity)
    
    // Check for existing email
    const existingRegistration = await prisma.registration.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingRegistration) {
      console.log('ERROR: Email already exists:', validatedData.email)
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
      console.log('ERROR: ID card already exists:', validatedData.idCardNumber)
      return NextResponse.json(
        { success: false, message: 'This ID card number is already registered' },
        { status: 400 }
      )
    }
    
    // Determine initial status
    const initialStatus = validatedData.isEmsClient ? 'PENDING' : 'PAYMENT_PENDING'
    console.log('Initial status:', initialStatus)
    
    // Create registration
    const registration = await prisma.registration.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        idCardNumber: validatedData.idCardNumber,
        isEmsClient: validatedData.isEmsClient,
        companyName: validatedData.customerName,
        emsCustomerId: validatedData.emsCustomerId,
        accountManager: validatedData.accountManager,
        status: initialStatus
      }
    })
    
    console.log('Registration created:', registration.id)
    
    // Create simplified panel interest if indicated
    if (validatedData.panelInterest) {
      await prisma.panelInterest.create({
        data: {
          registrationId: registration.id,
          panelType: 'General Interest',
          interestLevel: 'MEDIUM',
          notes: 'Customer expressed interest in EMS solar panels during registration',
          status: 'NEW'
        }
      })
      console.log('Panel interest created')
    }
    
    // IMPORTANT: Only create tickets for NON-EMS clients
    const tickets = []
    if (!validatedData.isEmsClient) {
      console.log('Creating tickets for non-EMS client...')
      for (let i = 0; i < quantity; i++) {
        try {
          const ticket = await TicketService.createTicket(registration.id, i + 1)
          tickets.push(ticket)
          console.log(`Ticket ${i + 1} created:`, ticket.ticketNumber)
        } catch (error) {
          console.error(`Failed to create ticket ${i + 1}:`, error)
          // Continue with other tickets
        }
      }
    } else {
      console.log('EMS client - NO tickets created. Waiting for admin approval.')
    }
    
    // Send appropriate email
    const emailType = validatedData.isEmsClient ? 'REGISTRATION_CONFIRMATION' : 'PAYMENT_REQUIRED'
    
    // Log email (implement actual email sending later)
    await prisma.emailLog.create({
      data: {
        registrationId: registration.id,
        emailType,
        subject: validatedData.isEmsClient 
          ? 'Registration Received - Pending Admin Verification'
          : `Complete Your Registration - Payment Required (${quantity} ticket${quantity > 1 ? 's' : ''})`,
        recipient: registration.email,
        status: 'SENT'
      }
    })
    
    console.log('Email logged')
    console.log('=== REGISTRATION SUCCESS ===')
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        id: registration.id,
        email: registration.email,
        isEmsClient: registration.isEmsClient,
        status: registration.status,
        quantity: quantity,
        totalCost: validatedData.isEmsClient ? 0 : quantity * 5000, // in cents
        ticketNumbers: tickets.map(t => t.ticketNumber),
        pendingApproval: validatedData.isEmsClient // Indicate if waiting for approval
      }
    })
    
  } catch (error: any) {
    console.error('=== REGISTRATION ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json(
        { success: false, message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
