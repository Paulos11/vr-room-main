// src/app/api/registration/details/route.ts - Get registration details by ID
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('id')

    if (!registrationId) {
      return NextResponse.json(
        { success: false, message: 'Registration ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching registration details for ID:', registrationId)

    // Get registration with all related data
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tickets: {
          include: {
            ticketType: true
          },
          orderBy: { ticketSequence: 'asc' }
        },
        payment: true,
        panelInterests: true,
        appliedCoupon: true
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    // Format the response data
    const responseData = {
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      registrationStatus: registration.status,
      isEmsClient: registration.isEmsClient,
      createdAt: registration.createdAt,
      customerName: registration.customerName,
      orderNumber: registration.orderNumber,
      applicationNumber: registration.applicationNumber,
      originalAmount: registration.originalAmount,
      discountAmount: registration.discountAmount,
      finalAmount: registration.finalAmount,
      appliedCouponCode: registration.appliedCouponCode,
      panelInterest: registration.panelInterests.length > 0,
      
      // All tickets list
      allTickets: registration.tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        sequence: ticket.ticketSequence,
        issuedAt: ticket.issuedAt,
        sentAt: ticket.sentAt,
        collectedAt: ticket.collectedAt,
        purchasePrice: ticket.purchasePrice,
        qrCode: ticket.qrCode,
        ticketType: ticket.ticketType ? {
          name: ticket.ticketType.name,
          description: ticket.ticketType.description
        } : null
      })),
      
      // Tickets summary
      ticketsSummary: {
        total: registration.tickets.length,
        generated: registration.tickets.filter(t => t.status === 'GENERATED').length,
        sent: registration.tickets.filter(t => t.status === 'SENT').length,
        collected: registration.tickets.filter(t => t.status === 'COLLECTED').length,
        used: registration.tickets.filter(t => t.status === 'USED').length,
        cancelled: registration.tickets.filter(t => t.status === 'CANCELLED').length
      },
      
      // Payment information
      payment: registration.payment ? {
        status: registration.payment.status,
        amount: registration.payment.amount,
        currency: registration.payment.currency,
        paidAt: registration.payment.paidAt,
        stripePaymentId: registration.payment.stripePaymentId
      } : null,
      
      // Applied coupon information
      appliedCoupon: registration.appliedCoupon ? {
        code: registration.appliedCoupon.code,
        name: registration.appliedCoupon.name,
        discountType: registration.appliedCoupon.discountType,
        discountValue: registration.appliedCoupon.discountValue
      } : null,
      
      // Panel interests
      panelInterests: registration.panelInterests.map(interest => ({
        id: interest.id,
        panelType: interest.panelType,
        interestLevel: interest.interestLevel,
        status: interest.status
      }))
    }

    console.log('Registration details fetched successfully:', {
      registrationId: responseData.id,
      status: responseData.registrationStatus,
      ticketCount: responseData.allTickets.length,
      isFreeOrder: responseData.finalAmount === 0
    })

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error: any) {
    console.error('Error fetching registration details:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}