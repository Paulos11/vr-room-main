// Alternative design - Even more compact and premium
// src/lib/premiumTicketGenerator.ts

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'

interface TicketData {
  ticketNumber: string
  customerName: string
  email: string
  phone: string
  qrCode: string
  sequence: number
  totalTickets: number
  isEmsClient: boolean
}

export class PremiumTicketGenerator {
  static async generateTicketPDF(ticketData: TicketData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create()
    
    // Business card size ticket (3.5" x 2")
    const ticketWidth = 252  // 3.5 inches
    const ticketHeight = 144 // 2 inches
    
    const page = pdfDoc.addPage([ticketWidth, ticketHeight])
    
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    // Elegant color scheme
    const navy = rgb(0.02, 0.12, 0.35)      // Deep navy
    const gold = rgb(0.85, 0.65, 0.13)      // Premium gold
    const silver = rgb(0.7, 0.7, 0.7)       // Silver accent
    const cream = rgb(0.98, 0.97, 0.94)     // Cream background
    const charcoal = rgb(0.2, 0.2, 0.2)     // Dark text
    
    // Main background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: ticketWidth,
      height: ticketHeight,
      color: cream,
    })
    
    // Navy header stripe
    page.drawRectangle({
      x: 0,
      y: ticketHeight - 35,
      width: ticketWidth,
      height: 35,
      color: navy,
    })
    
    // Gold accent line
    page.drawRectangle({
      x: 0,
      y: ticketHeight - 37,
      width: ticketWidth,
      height: 2,
      color: gold,
    })
    
    // Left side accent
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 4,
      height: ticketHeight - 37,
      color: gold,
    })
    
    // EMS branding
    page.drawText('EMS', {
      x: 12,
      y: ticketHeight - 22,
      size: 14,
      font: boldFont,
      color: rgb(1, 1, 1),
    })
    
    // Event title
    page.drawText('VIP TRADE FAIR PASS', {
      x: 45,
      y: ticketHeight - 18,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    })
    
    page.drawText('MALTA 2025', {
      x: 45,
      y: ticketHeight - 30,
      size: 7,
      font: regularFont,
      color: silver,
    })
    
    // Status badge
    const statusText = ticketData.isEmsClient ? 'COMPLIMENTARY' : 'VIP'
    const statusBg = ticketData.isEmsClient ? gold : rgb(0.1, 0.5, 0.2)
    
    page.drawRectangle({
      x: ticketWidth - 65,
      y: ticketHeight - 30,
      width: 55,
      height: 12,
      color: statusBg,
    })
    
    page.drawText(statusText, {
      x: ticketWidth - 62,
      y: ticketHeight - 24,
      size: 6,
      font: boldFont,
      color: rgb(1, 1, 1),
    })
    
    // Ticket number section
    page.drawRectangle({
      x: 8,
      y: ticketHeight - 55,
      width: ticketWidth - 75,
      height: 15,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: navy,
      borderWidth: 1,
    })
    
    page.drawText('TICKET NO.', {
      x: 12,
      y: ticketHeight - 48,
      size: 5,
      font: regularFont,
      color: charcoal,
    })
    
    page.drawText(ticketData.ticketNumber, {
      x: 12,
      y: ticketHeight - 53,
      size: 8,
      font: boldFont,
      color: navy,
    })
    
    // Multiple ticket indicator
    if (ticketData.totalTickets > 1) {
      page.drawText(`${ticketData.sequence} of ${ticketData.totalTickets}`, {
        x: ticketWidth - 65,
        y: ticketHeight - 50,
        size: 6,
        font: regularFont,
        color: charcoal,
      })
    }
    
    // QR Code (small and elegant)
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(ticketData.qrCode, {
        width: 40,
        margin: 0,
      })
      
      const base64Data = qrCodeDataUrl.split(',')[1]
      const qrCodeImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'))
      
      page.drawImage(qrCodeImage, {
        x: ticketWidth - 50,
        y: ticketHeight - 105,
        width: 40,
        height: 40,
      })
      
      page.drawText('SCAN', {
        x: ticketWidth - 45,
        y: ticketHeight - 110,
        size: 5,
        font: regularFont,
        color: charcoal,
      })
    } catch (error) {
      console.error('QR code error:', error)
    }
    
    // Guest information
    page.drawText('GUEST', {
      x: 12,
      y: ticketHeight - 68,
      size: 5,
      font: regularFont,
      color: charcoal,
    })
    
    const guestName = ticketData.customerName.length > 25 
      ? ticketData.customerName.substring(0, 25) + '...'
      : ticketData.customerName
      
    page.drawText(guestName.toUpperCase(), {
      x: 12,
      y: ticketHeight - 78,
      size: 7,
      font: boldFont,
      color: charcoal,
    })
    
    // Event details
    page.drawText('26 JUL - 06 AUG 2025', {
      x: 12,
      y: ticketHeight - 90,
      size: 6,
      font: boldFont,
      color: navy,
    })
    
    page.drawText('MFCC, TA\' QALI, MALTA', {
      x: 12,
      y: ticketHeight - 98,
      size: 5,
      font: regularFont,
      color: charcoal,
    })
    
    page.drawText('EMS BOOTH - MAIN HALL', {
      x: 12,
      y: ticketHeight - 106,
      size: 5,
      font: regularFont,
      color: charcoal,
    })
    
    // Entry requirements
    page.drawText('VALID ID REQUIRED • NON-TRANSFERABLE', {
      x: 12,
      y: ticketHeight - 120,
      size: 4,
      font: regularFont,
      color: charcoal,
    })
    
    // Footer
    page.drawText('www.ems-events.com', {
      x: 12,
      y: 8,
      size: 4,
      font: regularFont,
      color: silver,
    })
    
    page.drawText('+356 2123 4567', {
      x: 12,
      y: 3,
      size: 4,
      font: regularFont,
      color: silver,
    })
    
    // Security features (decorative patterns)
    // Micro text border
    const microText = 'EMS-VIP-2025-'
    let x = 8
    for (let i = 0; i < 15; i++) {
      page.drawText(microText, {
        x: x,
        y: ticketHeight - 130,
        size: 3,
        font: regularFont,
        color: rgb(0.8, 0.8, 0.8),
      })
      x += 15
      if (x > ticketWidth - 30) break
    }
    
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }
  
  static async generateAllTicketsPDF(tickets: TicketData[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create()
    
    // A4 page with 4 tickets arranged in 2x2 grid
    const pageWidth = 595
    const pageHeight = 842
    const ticketWidth = 252
    const ticketHeight = 144
    
    // Calculate spacing for center alignment
    const totalWidth = 2 * ticketWidth + 50  // 50px gap between tickets
    const totalHeight = 2 * ticketHeight + 50
    const startX = (pageWidth - totalWidth) / 2
    const startY = (pageHeight - totalHeight) / 2
    
    const positions = [
      { x: startX, y: startY + ticketHeight + 25 },                    // Top left
      { x: startX + ticketWidth + 25, y: startY + ticketHeight + 25 }, // Top right
      { x: startX, y: startY },                                        // Bottom left
      { x: startX + ticketWidth + 25, y: startY }                      // Bottom right
    ]
    
    let currentPage = null
    
    for (let i = 0; i < tickets.length; i++) {
      // Create new page every 4 tickets
      if (i % 4 === 0) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight])
        
        // Add page title
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        currentPage.drawText('EMS VIP TRADE FAIR TICKETS', {
          x: 50,
          y: pageHeight - 50,
          size: 16,
          font: titleFont,
          color: rgb(0.02, 0.12, 0.35),
        })
        
        // Add cut lines
        const lineColor = rgb(0.8, 0.8, 0.8)
        
        // Vertical cut line
        currentPage.drawLine({
          start: { x: pageWidth / 2, y: startY - 20 },
          end: { x: pageWidth / 2, y: startY + totalHeight + 20 },
          color: lineColor,
          dashArray: [2, 2],
        })
        
        // Horizontal cut line
        currentPage.drawLine({
          start: { x: startX - 20, y: pageHeight / 2 },
          end: { x: startX + totalWidth + 20, y: pageHeight / 2 },
          color: lineColor,
          dashArray: [2, 2],
        })
      }
      
      // Generate individual ticket
      const ticketPdf = await this.generateTicketPDF(tickets[i])
      const ticketDoc = await PDFDocument.load(ticketPdf)
      const [ticketPage] = await pdfDoc.copyPages(ticketDoc, [0])
      
      // Position on page
      const position = positions[i % 4]
      currentPage!.drawPage(ticketPage, {
        x: position.x,
        y: position.y,
        width: ticketWidth,
        height: ticketHeight,
      })
    }
    
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }
}