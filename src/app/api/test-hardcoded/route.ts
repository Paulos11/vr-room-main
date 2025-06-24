// src/app/api/test-hardcoded/route.ts - Test with absolutely hardcoded data
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Creating PDF with absolutely hardcoded ticket type...')
    
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([260, 160])
    
    // Get fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    // Colors
    const primaryBlue = rgb(0.1, 0.3, 0.6)
    const darkGray = rgb(0.2, 0.2, 0.2)
    const lightBlue = rgb(0.9, 0.95, 1)
    const white = rgb(1, 1, 1)
    
    let currentY = 120
    
    // Header
    page.drawRectangle({
      x: 0,
      y: 120,
      width: 260,
      height: 40,
      color: primaryBlue,
    })
    
    page.drawText('EMS TICKETS', {
      x: 12,
      y: 140,
      size: 12,
      font: boldFont,
      color: white,
    })
    
    currentY = 100
    
    // Ticket Number
    page.drawText('TICKET NUMBER:', {
      x: 12,
      y: currentY,
      size: 7,
      font: boldFont,
      color: darkGray,
    })
    
    currentY -= 12
    page.drawRectangle({
      x: 12,
      y: currentY - 2,
      width: 160,
      height: 12,
      color: lightBlue,
      borderColor: primaryBlue,
      borderWidth: 1,
    })
    
    page.drawText('EMS-TEST-HARDCODED', {
      x: 15,
      y: currentY + 2,
      size: 8,
      font: boldFont,
      color: primaryBlue,
    })
    
    currentY -= 18
    
    // THIS SHOULD DEFINITELY WORK - HARDCODED TICKET TYPE
    console.log('🎫 Drawing hardcoded ticket type section...')
    
    page.drawText('TICKET TYPE:', {
      x: 12,
      y: currentY,
      size: 7,
      font: boldFont,
      color: darkGray,
    })
    
    currentY -= 12
    page.drawRectangle({
      x: 12,
      y: currentY - 2,
      width: 160,
      height: 12,
      color: rgb(0.95, 1, 0.95), // Light green
      borderColor: rgb(0.2, 0.7, 0.2), // Green border
      borderWidth: 1,
    })
    
    page.drawText('ICE SKATING', {
      x: 15,
      y: currentY + 2,
      size: 8,
      font: boldFont,
      color: rgb(0.1, 0.5, 0.1), // Dark green
    })
    
    page.drawText('€20.00', {
      x: 200,
      y: currentY + 2,
      size: 7,
      font: boldFont,
      color: rgb(0.1, 0.5, 0.1),
    })
    
    console.log('✅ Hardcoded ticket type section drawn!')
    
    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)
    const base64Pdf = pdfBuffer.toString('base64')
    
    console.log('✅ Hardcoded PDF generated, size:', pdfBuffer.length, 'bytes')
    
    return NextResponse.json({
      success: true,
      message: 'Hardcoded PDF generated - should definitely show ICE SKATING',
      data: {
        pdfBase64: base64Pdf,
        pdfSize: pdfBuffer.length
      }
    })
    
  } catch (error: any) {
    console.error('❌ Hardcoded test failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Hardcoded test failed',
      error: error.message
    }, { status: 500 })
  }
}