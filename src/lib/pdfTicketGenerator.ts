// src/lib/pdfTicketGenerator.ts - Clean version with all fixes
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib'
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

export class PDFTicketGenerator {
  private static async drawSingleTicket(
    page: PDFPage, 
    pdfDoc: PDFDocument, 
    ticketData: TicketData, 
    x: number, 
    y: number
  ): Promise<void> {
    // Compact ticket dimensions
    const ticketWidth = 252;  // 3.5 inches
    const ticketHeight = 144; // 2 inches
    
    // Get fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Premium color scheme
    const navy = rgb(0.02, 0.12, 0.35);      // Deep navy
    const gold = rgb(0.85, 0.65, 0.13);      // Premium gold
    const silver = rgb(0.7, 0.7, 0.7);       // Silver accent
    const cream = rgb(0.98, 0.97, 0.94);     // Cream background
    const charcoal = rgb(0.2, 0.2, 0.2);     // Dark text
    const white = rgb(1, 1, 1);
    
    // Main background
    page.drawRectangle({
      x: x,
      y: y,
      width: ticketWidth,
      height: ticketHeight,
      color: cream,
      borderColor: silver,
      borderWidth: 1,
    });
    
    // Navy header stripe
    page.drawRectangle({
      x: x,
      y: y + ticketHeight - 35,
      width: ticketWidth,
      height: 35,
      color: navy,
    });
    
    // Gold accent line
    page.drawRectangle({
      x: x,
      y: y + ticketHeight - 37,
      width: ticketWidth,
      height: 2,
      color: gold,
    });
    
    // Left side accent
    page.drawRectangle({
      x: x,
      y: y,
      width: 4,
      height: ticketHeight - 37,
      color: gold,
    });
    
    // EMS branding
    page.drawText('EMS', {
      x: x + 12,
      y: y + ticketHeight - 22,
      size: 14,
      font: boldFont,
      color: white,
    });
    
    // Event title
    page.drawText('VIP TRADE FAIR PASS', {
      x: x + 45,
      y: y + ticketHeight - 18,
      size: 9,
      font: boldFont,
      color: white,
    });
    
    page.drawText('MALTA 2025', {
      x: x + 45,
      y: y + ticketHeight - 30,
      size: 7,
      font: regularFont,
      color: silver,
    });
    
    // Status badge
    const statusText = ticketData.isEmsClient ? 'COMP' : 'VIP';
    const statusBg = ticketData.isEmsClient ? gold : rgb(0.1, 0.5, 0.2);
    
    page.drawRectangle({
      x: x + ticketWidth - 45,
      y: y + ticketHeight - 30,
      width: 35,
      height: 12,
      color: statusBg,
    });
    
    page.drawText(statusText, {
      x: x + ticketWidth - 40,
      y: y + ticketHeight - 24,
      size: 6,
      font: boldFont,
      color: white,
    });
    
    // Ticket number section
    page.drawRectangle({
      x: x + 8,
      y: y + ticketHeight - 55,
      width: ticketWidth - 75,
      height: 15,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: navy,
      borderWidth: 1,
    });
    
    page.drawText('TICKET NO.', {
      x: x + 12,
      y: y + ticketHeight - 48,
      size: 5,
      font: regularFont,
      color: charcoal,
    });
    
    page.drawText(ticketData.ticketNumber, {
      x: x + 12,
      y: y + ticketHeight - 53,
      size: 8,
      font: boldFont,
      color: navy,
    });
    
    // Multiple ticket indicator
    if (ticketData.totalTickets > 1) {
      page.drawText(`${ticketData.sequence} of ${ticketData.totalTickets}`, {
        x: x + ticketWidth - 65,
        y: y + ticketHeight - 50,
        size: 6,
        font: regularFont,
        color: charcoal,
      });
    }
    
    // QR Code
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(ticketData.qrCode, {
        width: 40,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const base64Data = qrCodeDataUrl.split(',')[1];
      const qrCodeImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));
      
      page.drawImage(qrCodeImage, {
        x: x + ticketWidth - 50,
        y: y + ticketHeight - 105,
        width: 40,
        height: 40,
      });
      
      page.drawText('SCAN', {
        x: x + ticketWidth - 45,
        y: y + ticketHeight - 110,
        size: 5,
        font: regularFont,
        color: charcoal,
      });
    } catch (error) {
      console.error('QR code error:', error);
      // Fallback rectangle
      page.drawRectangle({
        x: x + ticketWidth - 50,
        y: y + ticketHeight - 105,
        width: 40,
        height: 40,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: charcoal,
        borderWidth: 1,
      });
    }
    
    // Guest information
    page.drawText('GUEST', {
      x: x + 12,
      y: y + ticketHeight - 68,
      size: 5,
      font: regularFont,
      color: charcoal,
    });
    
    const guestName = ticketData.customerName.length > 25 
      ? ticketData.customerName.substring(0, 25) + '...'
      : ticketData.customerName;
      
    page.drawText(guestName.toUpperCase(), {
      x: x + 12,
      y: y + ticketHeight - 78,
      size: 7,
      font: boldFont,
      color: charcoal,
    });
    
    // Event details
    page.drawText('26 JUL - 06 AUG 2025', {
      x: x + 12,
      y: y + ticketHeight - 90,
      size: 6,
      font: boldFont,
      color: navy,
    });
    
    page.drawText('MFCC, TA\' QALI, MALTA', {
      x: x + 12,
      y: y + ticketHeight - 98,
      size: 5,
      font: regularFont,
      color: charcoal,
    });
    
    page.drawText('EMS BOOTH - MAIN HALL', {
      x: x + 12,
      y: y + ticketHeight - 106,
      size: 5,
      font: regularFont,
      color: charcoal,
    });
    
    // Entry requirements
    page.drawText('VALID ID REQUIRED • NON-TRANSFERABLE', {
      x: x + 12,
      y: y + ticketHeight - 120,
      size: 4,
      font: regularFont,
      color: charcoal,
    });
    
    // Footer
    page.drawText('support@ems-events.com • +356 2123 4567', {
      x: x + 12,
      y: y + 8,
      size: 4,
      font: regularFont,
      color: silver,
    });
  }
  
  static async generateTicketPDF(ticketData: TicketData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([252, 144]); // Single ticket size
    
    await this.drawSingleTicket(page, pdfDoc, ticketData, 0, 0);
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
  
  static async generateAllTicketsPDF(tickets: TicketData[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    
    // A4 page dimensions
    const pageWidth = 595;
    const pageHeight = 842;
    const ticketWidth = 252;
    const ticketHeight = 144;
    const margin = 20;
    
    // Calculate how many tickets fit per page
    const ticketsPerRow = Math.floor((pageWidth - margin * 2) / (ticketWidth + margin));
    const ticketsPerCol = Math.floor((pageHeight - margin * 2) / (ticketHeight + margin));
    const ticketsPerPage = ticketsPerRow * ticketsPerCol;
    
    console.log(`Arranging ${tickets.length} tickets: ${ticketsPerRow} per row, ${ticketsPerCol} per column`);
    
    let currentPage: PDFPage | null = null;
    
    for (let i = 0; i < tickets.length; i++) {
      // Create new page if needed
      if (i % ticketsPerPage === 0) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Add page title
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        currentPage.drawText('EMS VIP TRADE FAIR TICKETS', {
          x: margin,
          y: pageHeight - 30,
          size: 14,
          font: titleFont,
          color: rgb(0.02, 0.12, 0.35),
        });
        
        // Add current date
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        currentPage.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
          x: pageWidth - 150,
          y: pageHeight - 30,
          size: 8,
          font: regularFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      // Calculate position on current page
      const positionOnPage = i % ticketsPerPage;
      const row = Math.floor(positionOnPage / ticketsPerRow);
      const col = positionOnPage % ticketsPerRow;
      
      const x = margin + col * (ticketWidth + margin);
      const y = pageHeight - margin - 50 - (row + 1) * (ticketHeight + margin);
      
      // Draw the ticket
      if (currentPage) {
        await this.drawSingleTicket(currentPage, pdfDoc, tickets[i], x, y);
        
        // Add cut lines around ticket
        const lineColor = rgb(0.8, 0.8, 0.8);
        
        // Top cut line
        currentPage.drawLine({
          start: { x: x - 5, y: y + ticketHeight + 5 },
          end: { x: x + ticketWidth + 5, y: y + ticketHeight + 5 },
          color: lineColor,
          dashArray: [2, 2],
        });
        
        // Bottom cut line
        currentPage.drawLine({
          start: { x: x - 5, y: y - 5 },
          end: { x: x + ticketWidth + 5, y: y - 5 },
          color: lineColor,
          dashArray: [2, 2],
        });
        
        // Left cut line
        currentPage.drawLine({
          start: { x: x - 5, y: y - 5 },
          end: { x: x - 5, y: y + ticketHeight + 5 },
          color: lineColor,
          dashArray: [2, 2],
        });
        
        // Right cut line
        currentPage.drawLine({
          start: { x: x + ticketWidth + 5, y: y - 5 },
          end: { x: x + ticketWidth + 5, y: y + ticketHeight + 5 },
          color: lineColor,
          dashArray: [2, 2],
        });
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}