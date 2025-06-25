// NEW: src/app/api/registration/check-eligibility/route.ts - Check if customer can register
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const isEmsClient = searchParams.get('isEmsClient') === 'true'

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('Checking registration eligibility:', { email, isEmsClient })

    if (!isEmsClient) {
      // Public customers can always register multiple times
      return NextResponse.json({
        success: true,
        canRegister: true,
        message: 'Public customers can register multiple times'
      })
    }

    // For EMS customers: Check for pending registrations
    const existingPendingRegistration = await prisma.registration.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isEmsClient: true,
        status: {
          in: ['PENDING', 'PAYMENT_PENDING'] // Check for any unresolved registrations
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        customerName: true,
        orderNumber: true
      }
    })

    if (existingPendingRegistration) {
      return NextResponse.json({
        success: true,
        canRegister: false,
        message: 'You already have a pending EMS registration. Please wait for approval or contact support.',
        existingRegistrationId: existingPendingRegistration.id,
        registrationStatus: existingPendingRegistration.status,
        registrationDate: existingPendingRegistration.createdAt,
        customerName: existingPendingRegistration.customerName,
        orderNumber: existingPendingRegistration.orderNumber
      })
    }

    // Check for recently completed/verified registrations (optional info)
    const recentRegistrations = await prisma.registration.findMany({
      where: {
        email: email.toLowerCase().trim(),
        isEmsClient: true,
        status: {
          in: ['VERIFIED', 'COMPLETED']
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        verifiedAt: true
      },
      orderBy: {
        verifiedAt: 'desc'
      },
      take: 3 // Get last 3 registrations for context
    })

    return NextResponse.json({
      success: true,
      canRegister: true,
      message: 'EMS customer can register for new tickets',
      hasHistoricalRegistrations: recentRegistrations.length > 0,
      recentRegistrations: recentRegistrations.map(reg => ({
        id: reg.id,
        status: reg.status,
        registrationDate: reg.createdAt,
        verifiedDate: reg.verifiedAt
      }))
    })

  } catch (error: any) {
    console.error('Error checking registration eligibility:', error)
    return NextResponse.json(
      { 
        success: false, 
        canRegister: false,
        message: 'Unable to verify registration eligibility. Please try again.',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// Optional: POST endpoint for batch checking multiple emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails } = body

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Array of emails is required' },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      emails.map(async (email: string) => {
        const pendingRegistration = await prisma.registration.findFirst({
          where: {
            email: email.toLowerCase().trim(),
            isEmsClient: true,
            status: {
              in: ['PENDING', 'PAYMENT_PENDING']
            }
          },
          select: {
            id: true,
            status: true,
            customerName: true
          }
        })

        return {
          email,
          canRegister: !pendingRegistration,
          existingRegistrationId: pendingRegistration?.id || null,
          status: pendingRegistration?.status || null
        }
      })
    )

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('Error batch checking registration eligibility:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unable to check registration eligibility for provided emails',
        error: error.message 
      },
      { status: 500 }
    )
  }
}