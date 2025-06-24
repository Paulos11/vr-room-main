// src/app/api/test-webhook/route.ts - Test webhook functionality
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID required' },
        { status: 400 }
      )
    }

    console.log('🔍 Testing webhook for session:', sessionId)

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: sessionId },
      include: {
        registration: {
          include: {
            tickets: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({
        success: false,
        message: 'Payment not found',
        sessionId
      })
    }

    // Check email logs
    const emailLogs = await prisma.emailLog.findMany({
      where: { registrationId: payment.registrationId },
      orderBy: { sentAt: 'desc' }
    })

    // Check webhook logs (if you have them)
    const webhookStatus = {
      paymentExists: true,
      paymentStatus: payment.status,
      registrationStatus: payment.registration.status,
      ticketCount: payment.registration.tickets.length,
      ticketStatuses: payment.registration.tickets.map(t => ({
        number: t.ticketNumber,
        status: t.status,
        sentAt: t.sentAt
      })),
      emailLogs: emailLogs.map(log => ({
        type: log.emailType,
        status: log.status,
        sentAt: log.sentAt,
        errorMessage: log.errorMessage
      }))
    }

    console.log('📊 Webhook status:', webhookStatus)

    return NextResponse.json({
      success: true,
      data: webhookStatus,
      recommendations: generateRecommendations(webhookStatus)
    })

  } catch (error: any) {
    console.error('Error testing webhook:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error testing webhook',
      error: error.message
    }, { status: 500 })
  }
}

function generateRecommendations(status: any): string[] {
  const recommendations = []

  if (status.paymentStatus !== 'SUCCEEDED') {
    recommendations.push('❌ Payment status is not SUCCEEDED - webhook may not have fired')
  }

  if (status.registrationStatus !== 'COMPLETED') {
    recommendations.push('❌ Registration not completed - webhook processing failed')
  }

  if (status.ticketStatuses.some((t: any) => t.status !== 'SENT')) {
    recommendations.push('❌ Some tickets not marked as SENT - email may not have been sent')
  }

  if (status.emailLogs.length === 0) {
    recommendations.push('❌ No email logs found - email system not triggered')
  }

  if (status.emailLogs.some((log: any) => log.status === 'FAILED')) {
    recommendations.push('❌ Some emails failed to send - check email service configuration')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Everything looks good! Check spam folder if email not received.')
  }

  return recommendations
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint is active',
    timestamp: new Date().toISOString(),
    usage: 'POST with { "sessionId": "cs_test_..." }'
  })
}
