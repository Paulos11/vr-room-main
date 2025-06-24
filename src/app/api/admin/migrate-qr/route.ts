// src/app/api/admin/migrate-qr/route.ts - Migration script for existing tickets
import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/lib/ticketService' // Note: TicketService is imported but not used, consider removing if unnecessary.
import { TicketGenerator } from '@/lib/ticketGenerator'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('=== QR CODE MIGRATION STARTED ===')

    // Get all existing tickets
    const tickets = await prisma.ticket.findMany({
      select: { 
        id: true, 
        ticketNumber: true, 
        qrCode: true 
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`Found ${tickets.length} tickets to migrate`)

    let migratedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process tickets in batches
    const batchSize = 10
    for (let i = 0; i < tickets.length; i += batchSize) {
      const batch = tickets.slice(i, i + batchSize)
      
      for (const ticket of batch) {
        try {
          // Check if ticket already has new format
          if (ticket.qrCode.startsWith('http') && ticket.qrCode.includes('/verify/')) {
            console.log(`Ticket ${ticket.ticketNumber} already migrated, skipping`)
            continue
          }

          // Generate new verification URL QR code
          // FIX: Changed generateQRCode to generateQRCodeData to match the method in TicketGenerator
          const newQrCode = TicketGenerator.generateQRCodeData(ticket.ticketNumber)

          // Update ticket with new QR code
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { qrCode: newQrCode }
          })

          migratedCount++
          console.log(`✅ Migrated ${ticket.ticketNumber}`)

        } catch (error: any) {
          errorCount++
          const errorMsg = `Failed to migrate ${ticket.ticketNumber}: ${error.message}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      // Log progress
      if ((i + batchSize) % 50 === 0 || i + batchSize >= tickets.length) {
        console.log(`Progress: ${Math.min(i + batchSize, tickets.length)}/${tickets.length} processed`)
      }
    }

    console.log('=== QR CODE MIGRATION COMPLETED ===')
    console.log(`✅ Successfully migrated: ${migratedCount}`)
    console.log(`❌ Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: 'QR code migration completed',
      stats: {
        totalTickets: tickets.length,
        migrated: migratedCount,
        errors: errorCount,
        skipped: tickets.length - migratedCount - errorCount
      },
      errors: errors.slice(0, 10) // Return first 10 errors
    })

  } catch (error: any) {
    console.error('=== QR CODE MIGRATION FAILED ===')
    console.error('Error:', error.message)
    
    return NextResponse.json({
      success: false,
      message: 'QR code migration failed',
      error: error.message
    }, { status: 500 })
  }
}

// GET method to check migration status
export async function GET(request: NextRequest) {
  try {
    const tickets = await prisma.ticket.findMany({
      select: { 
        qrCode: true 
      }
    })

    const newFormatCount = tickets.filter(t => 
      t.qrCode.startsWith('http') && t.qrCode.includes('/verify/')
    ).length

    const oldFormatCount = tickets.length - newFormatCount

    return NextResponse.json({
      success: true,
      stats: {
        totalTickets: tickets.length,
        newFormat: newFormatCount,
        oldFormat: oldFormatCount,
        migrationNeeded: oldFormatCount > 0
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message
    }, { status: 500 })
  }
}