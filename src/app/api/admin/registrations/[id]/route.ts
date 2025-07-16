// src/app/api/admin/registrations/[id]/route.ts - Individual Registration API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Registration ID is required' },
        { status: 400 }
      )
    }

    // Fetch registration with all related data
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tickets: {
          include: {
            ticketType: {
              select: {
                name: true,
                priceInCents: true,
                description: true
              }
            },
            pricingTier: {
              select: {
                name: true,
                priceInCents: true,
                ticketCount: true
              }
            }
          }
        },
        payment: {
          select: {
            status: true,
            paidAt: true,
            amount: true,
            originalAmount: true,
            discountAmount: true,
            stripePaymentId: true
          }
        },
        panelInterests: {
          select: {
            id: true,
            panelType: true,
            interestLevel: true,
            estimatedBudget: true,
            notes: true,
            status: true
          }
        },
        appliedCoupon: {
          select: {
            code: true,
            name: true,
            discountType: true,
            discountValue: true
          }
        },
        emailLogs: {
          select: {
            emailType: true,
            sentAt: true,
            status: true
          },
          orderBy: { sentAt: 'desc' },
          take: 10
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'VR booking not found' },
        { status: 404 }
      )
    }

    // Transform tickets data
    const ticketSummary = registration.tickets.reduce((acc, ticket) => {
      const ticketName = ticket.ticketType.name || 'VR Session'
      const existing = acc.find(t => t.name === ticketName)
      if (existing) {
        existing.quantity += 1
        existing.totalPrice += ticket.purchasePrice
      } else {
        acc.push({
          name: ticketName,
          quantity: 1,
          price: ticket.purchasePrice,
          totalPrice: ticket.purchasePrice,
        })
      }
      return acc
    }, [] as Array<{ 
      name: string
      quantity: number
      price: number
      totalPrice: number
      description?: string 
    }>)

    // Transform party booking data
    const partyDetails = registration.panelInterests.map(interest => ({
      type: interest.panelType,
      level: interest.interestLevel,
      budget: interest.estimatedBudget,
      notes: interest.notes,
      status: interest.status
    }))

    // Format the response
    const formattedRegistration = {
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone || 'N/A',
      status: registration.status,
      isEmsClient: registration.isEmsClient,
      
      // Financial information
      finalAmount: registration.finalAmount,
      originalAmount: registration.originalAmount,
      discountAmount: registration.discountAmount,
      appliedCouponCode: registration.appliedCouponCode,
      
      // Timestamps
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      verifiedAt: registration.verifiedAt?.toISOString(),
      paidAt: registration.payment?.paidAt?.toISOString(),
      
      // VR Experience details
      selectedTickets: ticketSummary.length > 0 ? ticketSummary : [
        { name: 'VR Experience', quantity: 1, price: 0, totalPrice: 0 }
      ],
      sessionCount: registration.tickets.length || 1,
      vrExperiences: ticketSummary.map(t => t.name).join(', ') || 'VR Experience',
      customerType: registration.isEmsClient ? 'VIP' : 'Regular',
      
      // EMS/VIP specific data
      customerName: registration.customerName,
      orderNumber: registration.orderNumber,
      applicationNumber: registration.applicationNumber,
      orderDate: registration.orderDate?.toISOString(),
      
      // Payment information
      paymentStatus: registration.payment?.status,
      paymentAmount: registration.payment?.amount,
      paymentMethod: 'Credit Card', // Default for now
      stripePaymentId: registration.payment?.stripePaymentId,
      
      // Party booking information
      hasPartyBooking: registration.panelInterests.length > 0,
      partyDetails: partyDetails.length > 0 ? partyDetails : undefined,
      
      // Additional metadata
      adminNotes: registration.adminNotes,
      verifiedBy: registration.verifiedBy,
      rejectedReason: registration.rejectedReason,
      
      // Communication history
      emailHistory: registration.emailLogs.map(log => ({
        type: log.emailType,
        sentAt: log.sentAt.toISOString(),
        status: log.status
      })),
      
      // Statistics
      totalTickets: registration.tickets.length,
      bookingValue: registration.isEmsClient ? 0 : registration.finalAmount,
      discount: registration.appliedCoupon ? {
        code: registration.appliedCoupon.code,
        name: registration.appliedCoupon.name,
        type: registration.appliedCoupon.discountType,
        value: registration.appliedCoupon.discountValue
      } : undefined
    }

    return NextResponse.json({
      success: true,
      data: formattedRegistration,
      message: 'VR booking details retrieved successfully'
    })

  } catch (error: any) {
    console.error('Registration detail API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch VR booking details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// PUT endpoint for updating registration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const {
      firstName,
      lastName,
      email,
      phone,
      status,
      adminNotes,
      verifiedBy
    } = body

    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        status,
        adminNotes,
        verifiedBy,
        verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRegistration,
      message: 'VR booking updated successfully'
    })

  } catch (error: any) {
    console.error('Update registration error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update VR booking',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint for deleting registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if registration exists
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { tickets: true, payment: true }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'VR booking not found' },
        { status: 404 }
      )
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.ticket.deleteMany({
      where: { registrationId: id }
    })

    if (registration.payment) {
      await prisma.payment.delete({
        where: { registrationId: id }
      })
    }

    await prisma.panelInterest.deleteMany({
      where: { registrationId: id }
    })

    await prisma.emailLog.deleteMany({
      where: { registrationId: id }
    })

    // Finally delete the registration
    await prisma.registration.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'VR booking deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete registration error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete VR booking',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}