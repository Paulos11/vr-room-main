// src/app/api/admin/settings/ticket-pricing/route.ts - Ticket pricing API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Get ticket pricing settings
export async function GET() {
  try {
    // Get pricing settings from EventSettings table
    const settings = await prisma.eventSettings.findMany({
      where: {
        key: {
          in: ['ticket_general_price', 'ticket_currency']
        }
      }
    })

    // Convert to object format
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    const pricing = {
      generalPrice: parseInt(settingsObj.ticket_general_price || '50'),
      currency: settingsObj.ticket_currency || 'EUR'
    }

    return NextResponse.json({
      success: true,
      data: pricing
    })

  } catch (error: any) {
    console.error('Error fetching ticket pricing:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pricing settings' },
      { status: 500 }
    )
  }
}

// Update ticket pricing settings
export async function POST(request: NextRequest) {
  try {
    const { generalPrice, currency } = await request.json()

    if (typeof generalPrice !== 'number' || generalPrice < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid price amount' },
        { status: 400 }
      )
    }

    // Update settings in database using upsert
    await Promise.all([
      prisma.eventSettings.upsert({
        where: { key: 'ticket_general_price' },
        update: { 
          value: generalPrice.toString(),
          updatedAt: new Date()
        },
        create: {
          key: 'ticket_general_price',
          value: generalPrice.toString(),
          description: 'Price for general public tickets',
          category: 'pricing'
        }
      }),
      
      prisma.eventSettings.upsert({
        where: { key: 'ticket_currency' },
        update: { 
          value: currency,
          updatedAt: new Date()
        },
        create: {
          key: 'ticket_currency',
          value: currency,
          description: 'Currency for ticket pricing',
          category: 'pricing'
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Ticket pricing updated successfully',
      data: { generalPrice, currency }
    })

  } catch (error: any) {
    console.error('Error updating ticket pricing:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update pricing settings' },
      { status: 500 }
    )
  }
}
