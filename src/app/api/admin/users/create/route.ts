// src/app/api/admin/users/create/route.ts - Create new user endpoint
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TicketService } from '@/lib/ticketService'
import { InterestLevel, Ticket } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface CreateUserRequest {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  
  // EMS Client Information
  isEmsClient: boolean
  companyName?: string
  emsCustomerId?: string
  accountManager?: string
  
  // Panel Interests
  hasPanelInterest: boolean
  panelType?: string
  interestLevel?: string
  estimatedBudget?: string
  timeframe?: string
  panelNotes?: string
  
  // Admin Settings
  adminNotes?: string
  autoApprove: boolean
  generateTickets: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json()
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required personal information' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const existingUser = await prisma.registration.findUnique({
      where: { email: body.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    // Check if ID card number already exists (if provided)
    if (body.idCardNumber) {
      const existingIdCard = await prisma.registration.findUnique({
        where: { idCardNumber: body.idCardNumber }
      })
      
      if (existingIdCard) {
        return NextResponse.json(
          { success: false, message: 'User with this ID card number already exists' },
          { status: 409 }
        )
      }
    }
    
    // Validate EMS customer fields if EMS client
    if (body.isEmsClient && !body.companyName) {
      return NextResponse.json(
        { success: false, message: 'Company name is required for EMS customers' },
        { status: 400 }
      )
    }
    
    // Helper function to validate and convert InterestLevel
    const getValidInterestLevel = (level?: string): InterestLevel => {
      if (!level) return InterestLevel.MEDIUM
      
      const upperLevel = level.toUpperCase()
      if (Object.values(InterestLevel).includes(upperLevel as InterestLevel)) {
        return upperLevel as InterestLevel
      }
      return InterestLevel.MEDIUM
    }
    
    // Helper function to validate panel type (string validation)
    const getValidPanelType = (type?: string): string | null => {
      if (!type || type.trim().length === 0) return null
      return type.trim()
    }
    
    // Determine registration status
    const registrationStatus = body.autoApprove ? 'COMPLETED' : 'PENDING'
    
    // Create registration in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the registration
      const registration = await tx.registration.create({
        data: {
          firstName: body.firstName.trim(),
          lastName: body.lastName.trim(),
          email: body.email.toLowerCase().trim(),
          phone: body.phone.trim(),
          idCardNumber: body.idCardNumber?.trim() || `AUTO-${Date.now()}`,
          isEmsClient: body.isEmsClient,
          companyName: body.isEmsClient ? body.companyName?.trim() : null,
          emsCustomerId: body.isEmsClient ? body.emsCustomerId?.trim() : null,
          accountManager: body.isEmsClient ? body.accountManager?.trim() : null,
          status: registrationStatus,
          adminNotes: body.adminNotes?.trim() || 'Created by admin',
          verifiedAt: body.autoApprove ? new Date() : null,
          verifiedBy: body.autoApprove ? 'System Admin' : null
        }
      })
      
      // Create panel interest if specified
      let panelInterest = null
      if (body.hasPanelInterest && body.panelType) {
        const validPanelType = getValidPanelType(body.panelType)
        
        if (validPanelType) {
          panelInterest = await tx.panelInterest.create({
            data: {
              registrationId: registration.id,
              panelType: validPanelType,
              interestLevel: getValidInterestLevel(body.interestLevel),
              estimatedBudget: body.estimatedBudget?.trim(),
              timeframe: body.timeframe?.trim(),
              notes: body.panelNotes?.trim(),
              status: 'NEW'
            }
          })
        }
      }
      
      // Generate tickets if requested and auto-approved
      let tickets: Ticket[] = []
      if (body.generateTickets && body.autoApprove) {
        try {
          const ticketData = await TicketService.createTicket(registration.id, 1)
          
          const createdTicket = await tx.ticket.create({
            data: {
              registrationId: registration.id,
              ticketNumber: ticketData.ticketNumber,
              qrCode: ticketData.qrCode,
              status: 'GENERATED',
              eventDate: new Date('2025-07-26'), // Event start date
              venue: process.env.VENUE_NAME || 'Malta Fairs and Conventions Centre',
              boothLocation: process.env.BOOTH_LOCATION || 'EMS Booth - MFCC',
              accessType: 'VIP',
              ticketSequence: 1
            }
          })
          
          tickets = [createdTicket]
        } catch (ticketError) {
          console.error('Error generating ticket:', ticketError)
          // Continue without ticket generation - don't fail the entire operation
        }
      }
      
      // Create email log
      await tx.emailLog.create({
        data: {
          registrationId: registration.id,
          emailType: 'REGISTRATION_CONFIRMATION',
          subject: `Registration ${body.autoApprove ? 'Approved' : 'Created'} - ${registration.firstName} ${registration.lastName}`,
          recipient: registration.email,
          status: 'SENT'
        }
      })
      
      return {
        registration,
        panelInterest,
        tickets
      }
    })
    
    // Format response data
    const responseData = {
      id: result.registration.id,
      firstName: result.registration.firstName,
      lastName: result.registration.lastName,
      email: result.registration.email,
      phone: result.registration.phone,
      idCardNumber: result.registration.idCardNumber,
      isEmsClient: result.registration.isEmsClient,
      companyName: result.registration.companyName,
      emsCustomerId: result.registration.emsCustomerId,
      status: result.registration.status,
      createdAt: result.registration.createdAt,
      verifiedAt: result.registration.verifiedAt,
      adminNotes: result.registration.adminNotes,
      ticketCount: result.tickets.length,
      tickets: result.tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        issuedAt: ticket.issuedAt
      })),
      panelInterest: result.panelInterest ? {
        id: result.panelInterest.id,
        panelType: result.panelInterest.panelType,
        interestLevel: result.panelInterest.interestLevel,
        estimatedBudget: result.panelInterest.estimatedBudget,
        timeframe: result.panelInterest.timeframe
      } : null
    }
    
    return NextResponse.json({
      success: true,
      message: `User created successfully${body.autoApprove ? ' and approved' : ''}${body.generateTickets && body.autoApprove ? ' with tickets generated' : ''}`,
      data: responseData
    })
    
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      return NextResponse.json(
        { 
          success: false, 
          message: `A user with this ${field} already exists`,
          field: field
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create user', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}