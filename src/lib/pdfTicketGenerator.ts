// COMPACT: src/lib/pdfTicketGenerator.ts - Simple ticket type display without price
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
  ticketTypeName?: string
  ticketTypePrice?: number
}

export class PDFTicketGenerator {
  private static async drawSingleTicket(
    page: PDFPage, 
    pdfDoc: PDFDocument, 
    ticketData: TicketData, 
    x: number, 
    y: number
  ): Promise<void> {
    // Ticket dimensions - increased height for better fit
    const ticketWidth = 260;
    const ticketHeight = 180; // ✅ Increased from 160 to 180
    
    // Get fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Color scheme
    const primaryBlue = rgb(0.1, 0.3, 0.6);     // EMS Blue
    const lightBlue = rgb(0.9, 0.95, 1);        // Light blue background
    const darkGray = rgb(0.2, 0.2, 0.2);        // Dark text
    const mediumGray = rgb(0.5, 0.5, 0.5);      // Medium gray
    const lightGray = rgb(0.9, 0.9, 0.9);       // Light gray
    const white = rgb(1, 1, 1);
    const gold = rgb(0.85, 0.65, 0.13);         // Accent color
    
    // Main ticket background
    page.drawRectangle({
      x: x,
      y: y,
      width: ticketWidth,
      height: ticketHeight,
      color: white,
      borderColor: lightGray,
      borderWidth: 2,
    });
    
    // Header section background - ✅ FIXED: Fill completely to the top
    page.drawRectangle({
      x: x,
      y: y + ticketHeight - 40,
      width: ticketWidth,
      height: 40, // ✅ Changed from 35 to 40 to fill completely
      color: primaryBlue,
    });
    
    // Main title - EMS TICKETS
    page.drawText('EMS TICKETS', {
      x: x + 12,
      y: y + ticketHeight - 20,
      size: 12,
      font: boldFont,
      color: white,
    });
    
    // Subtitle - MFCC, Malta 2025
    page.drawText('MFCC, Malta 2025', {
      x: x + 12,
      y: y + ticketHeight - 32,
      size: 7,
      font: regularFont,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Content area starts here
    let currentY = y + ticketHeight - 50;
    
    // Ticket Number Section
    page.drawText('TICKET NUMBER:', {
      x: x + 12,
      y: currentY,
      size: 7,
      font: boldFont,
      color: darkGray,
    });
    
    currentY -= 15; // ✅ Increased from 12 to 15 for more gap
    page.drawRectangle({
      x: x + 12,
      y: currentY - 2,
      width: ticketWidth - 100, // Leave space for QR code
      height: 12,
      color: lightBlue,
      borderColor: primaryBlue,
      borderWidth: 1,
    });
    
    page.drawText(ticketData.ticketNumber, {
      x: x + 15,
      y: currentY + 2,
      size: 8,
      font: boldFont,
      color: primaryBlue,
    });
    
    // Sequence indicator for multiple tickets - REMOVED
    // ✅ REMOVED: No more sequence numbers behind QR code
    
    currentY -= 18;
    
    // ✅ SIMPLIFIED: Ticket Type Name - Small and Simple (No title, no background, no price)
    if (ticketData.ticketTypeName && ticketData.ticketTypeName !== 'General Admission') {
      console.log('✅ Drawing simple ticket type for:', ticketData.ticketTypeName)
      
      // Simple ticket type name - small and clean
      page.drawText(ticketData.ticketTypeName.toUpperCase(), {
        x: x + 12,
        y: currentY,
        size: 7,
        font: regularFont,
        color: mediumGray, // Subtle gray color
      });
      
      currentY -= 12; // Reduced spacing to bring customer info closer
    } else {
      console.log('❌ No ticket type name to display or is General Admission')
    }
    
    // ✅ REMOVED "CUSTOMER:" label - customer info directly under ticket type
    // Customer Name - More compact layout
    const displayName = ticketData.customerName.length > 32 
      ? ticketData.customerName.substring(0, 32) + '...'
      : ticketData.customerName;
      
    page.drawText(displayName.toUpperCase(), {
      x: x + 12,
      y: currentY,
      size: 7,
      font: boldFont,
      color: darkGray,
    });
    
    currentY -= 9; // Reduced spacing
    
    // Email - More compact
    const displayEmail = ticketData.email.length > 35 
      ? ticketData.email.substring(0, 35) + '...'
      : ticketData.email;
      
    page.drawText(displayEmail, {
      x: x + 12,
      y: currentY,
      size: 6,
      font: regularFont,
      color: darkGray,
    });
    
    currentY -= 9; // Reduced spacing
    
    // Phone - More compact
    page.drawText(ticketData.phone, {
      x: x + 12,
      y: currentY,
      size: 6,
      font: regularFont,
      color: darkGray,
    });
    
    // Event Details Section - More compact
    currentY -= 12; // Reduced spacing
    
    page.drawText('EVENT:', {
      x: x + 12,
      y: currentY,
      size: 7,
      font: boldFont,
      color: darkGray,
    });
    
    currentY -= 9; // Reduced spacing
    
    page.drawText('June 26 - July 6, 2025', {
      x: x + 12,
      y: currentY,
      size: 6,
      font: regularFont,
      color: darkGray,
    });
    
    currentY -= 8; // Reduced spacing
    
    page.drawText('MFCC, Ta\' Qali, Malta', {
      x: x + 12,
      y: currentY,
      size: 6,
      font: regularFont,
      color: darkGray,
    });
    
    currentY -= 8; // Reduced spacing
    
    page.drawText('EMS Booth - Main Hall', {
      x: x + 12,
      y: currentY,
      size: 6,
      font: regularFont,
      color: darkGray,
    });
    
    // QR Code Section (positioned on the right side) - adjusted for new height
    const qrX = x + ticketWidth - 65;
    const qrY = y + ticketHeight - 130; // ✅ Adjusted for new height
    
    try {
      // QR Code generation
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://emstickets.com';
      const verificationUrl = `${baseUrl}/staff/verify/${ticketData.ticketNumber}`;
      
      console.log('Generating QR code for:', verificationUrl);
      
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 50,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const base64Data = qrCodeDataUrl.split(',')[1];
      const qrCodeImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));
      
      // QR Code background
      page.drawRectangle({
        x: qrX - 3,
        y: qrY - 3,
        width: 56,
        height: 56,
        color: white,
        borderColor: lightGray,
        borderWidth: 1,
      });
      
      page.drawImage(qrCodeImage, {
        x: qrX,
        y: qrY,
        width: 50,
        height: 50,
      });
      
      // ✅ REMOVED: QR Code labels completely removed
      
    } catch (error) {
      console.error('QR code generation error:', error);
      // Fallback: draw placeholder rectangle
      page.drawRectangle({
        x: qrX,
        y: qrY,
        width: 50,
        height: 50,
        color: lightGray,
        borderColor: mediumGray,
        borderWidth: 1,
      });
      
      page.drawText('QR CODE', {
        x: qrX + 12,
        y: qrY + 23,
        size: 6,
        font: regularFont,
        color: mediumGray,
      });
    }
    
    // Footer section
    page.drawRectangle({
      x: x,
      y: y,
      width: ticketWidth,
      height: 20,
      color: rgb(0.95, 0.95, 0.95),
    });
    
    // Support contact
    page.drawText('info@ems.com.mt', {
      x: x + 12,
      y: y + 12,
      size: 6,
      font: regularFont,
      color: mediumGray,
    });
    
    // Important notice
    page.drawText('Valid ID Required • Non-Transferable', {
      x: x + 12,
      y: y + 5,
      size: 5,
      font: regularFont,
      color: mediumGray,
    });
    
    // Sequential number in footer (for multiple tickets) - RESTORED
    if (ticketData.totalTickets > 1) {
      page.drawText(`#${ticketData.sequence}`, {
        x: x + ticketWidth - 20,
        y: y + 8,
        size: 7,
        font: boldFont,
        color: primaryBlue,
      });
    }
  }
  
  static async generateTicketPDF(ticketData: TicketData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([260, 160]);
    
    await this.drawSingleTicket(page, pdfDoc, ticketData, 0, 0);
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
  
  static async generateAllTicketsPDF(tickets: TicketData[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    
    // DEBUG: Log what we're receiving
    console.log('🎫 PDF Generator called with', tickets.length, 'tickets')
    tickets.forEach((ticket, index) => {
      console.log(`📄 PDF TICKET ${index + 1}:`)
      console.log('  - ticketNumber:', ticket.ticketNumber)
      console.log('  - ticketTypeName:', ticket.ticketTypeName)
      console.log('  - isEmsClient:', ticket.isEmsClient)
    })
    
    // A4 page dimensions
    const pageWidth = 595;
    const pageHeight = 842;
    const ticketWidth = 260;
    const ticketHeight = 180; // ✅ Updated height
    const margin = 15;
    
    // Calculate layout - 2 tickets per row, multiple rows per page
    const ticketsPerRow = 2;
    const ticketsPerCol = Math.floor((pageHeight - 60) / (ticketHeight + margin));
    const ticketsPerPage = ticketsPerRow * ticketsPerCol;
    
    console.log(`Arranging ${tickets.length} tickets: ${ticketsPerRow} per row, ${ticketsPerCol} per column, ${ticketsPerPage} per page`);
    
    let currentPage: PDFPage | null = null;
    
    for (let i = 0; i < tickets.length; i++) {
      // Create new page if needed
      if (i % ticketsPerPage === 0) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Page header
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        currentPage.drawText('EMS TICKETS - 2025', {
          x: margin,
          y: pageHeight - 30,
          size: 16,
          font: titleFont,
          color: rgb(0.1, 0.3, 0.6),
        });
        
        // Customer info in header
        if (tickets[i]) {
          currentPage.drawText(`Customer: ${tickets[i].customerName}`, {
            x: margin,
            y: pageHeight - 45,
            size: 10,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          currentPage.drawText(`Generated: ${new Date().toLocaleString()}`, {
            x: pageWidth - 150,
            y: pageHeight - 30,
            size: 8,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          currentPage.drawText(`Total Tickets: ${tickets.length}`, {
            x: pageWidth - 150,
            y: pageHeight - 45,
            size: 8,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }
      
      // Calculate position on current page
      const positionOnPage = i % ticketsPerPage;
      const row = Math.floor(positionOnPage / ticketsPerRow);
      const col = positionOnPage % ticketsPerRow;
      
      const x = margin + col * (ticketWidth + margin);
      const y = pageHeight - 80 - (row + 1) * (ticketHeight + margin);
      
      // Draw the ticket
      if (currentPage) {
        console.log(`🎨 Drawing ticket ${i + 1}: ${tickets[i].ticketNumber}`)
        console.log('  - Ticket type name:', tickets[i].ticketTypeName)
        
        await this.drawSingleTicket(currentPage, pdfDoc, tickets[i], x, y);
        
        // Add subtle cut lines around ticket
        const lineColor = rgb(0.9, 0.9, 0.9);
        const dashArray = [3, 2];
        
        // Horizontal cut lines
        if (row > 0) {
          currentPage.drawLine({
            start: { x: x - 5, y: y + ticketHeight + (margin/2) },
            end: { x: x + ticketWidth + 5, y: y + ticketHeight + (margin/2) },
            color: lineColor,
            dashArray: dashArray,
          });
        }
        
        // Vertical cut lines
        if (col > 0) {
          currentPage.drawLine({
            start: { x: x - (margin/2), y: y - 5 },
            end: { x: x - (margin/2), y: y + ticketHeight + 5 },
            color: lineColor,
            dashArray: dashArray,
          });
        }
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Helper method to generate PDF tickets from registration data
   */
  static async generateTicketsFromRegistration(registration: any): Promise<Buffer> {
    const customerName = `${registration.firstName} ${registration.lastName}`;
    
    const ticketDataArray = registration.tickets.map((ticket: any, index: number) => ({
      ticketNumber: ticket.ticketNumber,
      customerName,
      email: registration.email,
      phone: registration.phone,
      qrCode: ticket.qrCode,
      sequence: ticket.ticketSequence || (index + 1),
      totalTickets: registration.tickets.length,
      isEmsClient: registration.isEmsClient,
      // Include ticket type information
      ticketTypeName: ticket.ticketType?.name || 'General Admission',
      ticketTypePrice: ticket.purchasePrice || ticket.ticketType?.priceInCents || 0
    }));

    return await this.generateAllTicketsPDF(ticketDataArray);
  }
}