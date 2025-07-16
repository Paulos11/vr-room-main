// ENHANCED: src/lib/pdfTicketGenerator.ts - VR Room Malta support
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
  isVRTicket?: boolean // ✅ NEW: VR ticket flag
  venue?: string // ✅ NEW: Venue info
  boothLocation?: string // ✅ NEW: Location info
}

export class PDFTicketGenerator {
  private static async drawSingleTicket(
    page: PDFPage, 
    pdfDoc: PDFDocument, 
    ticketData: TicketData, 
    x: number, 
    y: number
  ): Promise<void> {
    // Ticket dimensions
    const ticketWidth = 260;
    const ticketHeight = 180;
    
    // Get fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // ✅ UPDATED: Different color schemes for VR vs EMS
    const isVR = ticketData.isVRTicket || ticketData.venue === 'VR Room Malta'
    
    // VR Room Malta colors (cyan/teal theme)
    const vrBlue = rgb(0.004, 0.682, 0.929); // #01AEED
    const vrDark = rgb(0.149, 0.149, 0.141); // #262624
    const vrLight = rgb(0.9, 0.98, 1); // Light cyan background
    
    // EMS colors (traditional blue theme)
    const emsBlue = rgb(0.1, 0.3, 0.6);
    const emsLight = rgb(0.9, 0.95, 1);
    
    const primaryColor = isVR ? vrBlue : emsBlue;
    const lightBackground = isVR ? vrLight : emsLight;
    const darkGray = rgb(0.2, 0.2, 0.2);
    const mediumGray = rgb(0.5, 0.5, 0.5);
    const lightGray = rgb(0.9, 0.9, 0.9);
    const white = rgb(1, 1, 1);
    
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
    
    // Header section background
    page.drawRectangle({
      x: x,
      y: y + ticketHeight - 40,
      width: ticketWidth,
      height: 40,
      color: primaryColor,
    });
    
    // ✅ UPDATED: Different titles for VR vs EMS
    const mainTitle = isVR ? 'VR ROOM MALTA' : 'EMS TICKETS';
    const subtitle = isVR ? 'Bugibba Square, Malta' : 'MFCC, Malta 2025';
    
    page.drawText(mainTitle, {
      x: x + 12,
      y: y + ticketHeight - 20,
      size: 12,
      font: boldFont,
      color: white,
    });
    
    page.drawText(subtitle, {
      x: x + 12,
      y: y + ticketHeight - 32,
      size: 7,
      font: regularFont,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Content area starts here
    let currentY = y + ticketHeight - 50;
    
    // Ticket Number Section
    page.drawText(isVR ? 'SESSION NUMBER:' : 'TICKET NUMBER:', {
      x: x + 12,
      y: currentY,
      size: 7,
      font: boldFont,
      color: darkGray,
    });
    
    currentY -= 15;
    page.drawRectangle({
      x: x + 12,
      y: currentY - 2,
      width: ticketWidth - 100,
      height: 12,
      color: lightBackground,
      borderColor: primaryColor,
      borderWidth: 1,
    });
    
    page.drawText(ticketData.ticketNumber, {
      x: x + 15,
      y: currentY + 2,
      size: 8,
      font: boldFont,
      color: primaryColor,
    });
    
    currentY -= 18;
    
    // ✅ UPDATED: Show VR experience name or ticket type
    if (ticketData.ticketTypeName && ticketData.ticketTypeName !== 'General Admission') {
      const displayName = isVR 
        ? ticketData.ticketTypeName.replace('VR ', '').toUpperCase()
        : ticketData.ticketTypeName.toUpperCase();
      
      page.drawText(displayName, {
        x: x + 12,
        y: currentY,
        size: 7,
        font: regularFont,
        color: mediumGray,
      });
      
      currentY -= 12;
    }
    
    // Customer Name
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
    
    currentY -= 9;
    
    // Email
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
    
    currentY -= 9;
    
    // Phone
    page.drawText(ticketData.phone, {
      x: x + 12,
      y: currentY,
      size: 6,
      font: regularFont,
      color: darkGray,
    });
    
    // ✅ UPDATED: Different event details for VR vs EMS
    currentY -= 12;
    
    page.drawText(isVR ? 'EXPERIENCE:' : 'EVENT:', {
      x: x + 12,
      y: currentY,
      size: 7,
      font: boldFont,
      color: darkGray,
    });
    
    currentY -= 9;
    
    if (isVR) {
      // VR-specific details
      page.drawText('Virtual Reality Experience', {
        x: x + 12,
        y: currentY,
        size: 6,
        font: regularFont,
        color: darkGray,
      });
      
      currentY -= 8;
      
      page.drawText('VR Room Malta', {
        x: x + 12,
        y: currentY,
        size: 6,
        font: regularFont,
        color: darkGray,
      });
      
      currentY -= 8;
      
      page.drawText('Bugibba Square, Malta', {
        x: x + 12,
        y: currentY,
        size: 6,
        font: regularFont,
        color: darkGray,
      });
      
      currentY -= 8;
      
      page.drawText('Duration: 5 Minutes', {
        x: x + 12,
        y: currentY,
        size: 6,
        font: regularFont,
        color: darkGray,
      });
    } else {
      // EMS-specific details
      page.drawText('June 26 - July 6, 2025', {
        x: x + 12,
        y: currentY,
        size: 6,
        font: regularFont,
        color: darkGray,
      });
      
      currentY -= 8;
      
      page.drawText('MFCC, Ta\' Qali, Malta', {
        x: x + 12,
        y: currentY,
        size: 6,
        font: regularFont,
        color: darkGray,
      });
      
      currentY -= 8;
      
      page.drawText('EMS Booth - Main Hall', {
        x: x + 12,
        y: currentY,
        size: 6,
        font: regularFont,
        color: darkGray,
      });
    }
    
    // QR Code Section
    const qrX = x + ticketWidth - 65;
    const qrY = y + ticketHeight - 130;
    
    try {
      // ✅ UPDATED: Different QR code URLs for VR vs EMS
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://emstickets.com';
      const verificationUrl = isVR 
        ? `${baseUrl}/vr/checkin/${ticketData.ticketNumber}`
        : `${baseUrl}/staff/verify/${ticketData.ticketNumber}`;
      
      console.log(`Generating QR code for ${isVR ? 'VR' : 'EMS'}:`, verificationUrl);
      
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
    
    // ✅ UPDATED: Different contact info for VR vs EMS
    const contactEmail = isVR ? 'info@vrroom.mt' : 'info@ems.com.mt';
    
    page.drawText(contactEmail, {
      x: x + 12,
      y: y + 12,
      size: 6,
      font: regularFont,
      color: mediumGray,
    });
    

    // Sequential number in footer
    if (ticketData.totalTickets > 1) {
      page.drawText(`#${ticketData.sequence}`, {
        x: x + ticketWidth - 20,
        y: y + 8,
        size: 7,
        font: boldFont,
        color: primaryColor,
      });
    }
  }
  
  static async generateTicketPDF(ticketData: TicketData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([260, 180]);
    
    await this.drawSingleTicket(page, pdfDoc, ticketData, 0, 0);
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
  
  static async generateAllTicketsPDF(tickets: TicketData[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    
    // Check if this is a VR booking
    const isVRBooking = tickets.some(t => t.isVRTicket || t.venue === 'VR Room Malta')
    
    console.log(`🎫 PDF Generator: ${tickets.length} ${isVRBooking ? 'VR' : 'EMS'} tickets`)
    
    tickets.forEach((ticket, index) => {
      console.log(`📄 PDF TICKET ${index + 1}:`)
      console.log('  - ticketNumber:', ticket.ticketNumber)
      console.log('  - ticketTypeName:', ticket.ticketTypeName)
      console.log('  - isVRTicket:', ticket.isVRTicket)
      console.log('  - venue:', ticket.venue)
    })
    
    // A4 page dimensions
    const pageWidth = 595;
    const pageHeight = 842;
    const ticketWidth = 260;
    const ticketHeight = 180;
    const margin = 15;
    
    // Layout: 6 tickets per page (2 columns × 3 rows)
    const ticketsPerRow = 2;
    const ticketsPerCol = 3;
    const ticketsPerPage = 6;
    
    // Calculate total pages needed
    const totalPages = Math.ceil(tickets.length / ticketsPerPage);
    
    console.log(`🎫 Arranging ${tickets.length} tickets: ${ticketsPerPage} per page = ${totalPages} pages`);
    
    let currentPage: PDFPage | null = null;
    
    for (let i = 0; i < tickets.length; i++) {
      // Create new page every 6 tickets
      if (i % ticketsPerPage === 0) {
        const pageNumber = Math.floor(i / ticketsPerPage) + 1;
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Page header
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // ✅ UPDATED: Different header titles for VR vs EMS
        const headerTitle = isVRBooking ? 'VR ROOM MALTA - SESSION TICKETS' : 'EMS TICKETS - 2025';
        const headerColor = isVRBooking ? rgb(0.004, 0.682, 0.929) : rgb(0.1, 0.3, 0.6); // VR cyan or EMS blue
        
        currentPage.drawText(headerTitle, {
          x: margin,
          y: pageHeight - 30,
          size: 16,
          font: titleFont,
          color: headerColor,
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
            x: pageWidth - 200,
            y: pageHeight - 30,
            size: 8,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          currentPage.drawText(`Page ${pageNumber} of ${totalPages}`, {
            x: pageWidth - 200,
            y: pageHeight - 40,
            size: 8,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          // ✅ UPDATED: Different labels for VR vs EMS
          const ticketLabel = isVRBooking ? 'Total Sessions:' : 'Total Tickets:';
          currentPage.drawText(`${ticketLabel} ${tickets.length}`, {
            x: pageWidth - 200,
            y: pageHeight - 50,
            size: 8,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }
      
      // Calculate position on current page (0-5 tickets per page)
      const positionOnPage = i % ticketsPerPage;
      const row = Math.floor(positionOnPage / ticketsPerRow); // 0, 1, 2 (3 rows)
      const col = positionOnPage % ticketsPerRow; // 0, 1 (2 columns)
      
      // Calculate spacing to fit exactly 6 tickets nicely
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - 120; // Leave space for header and footer
      
      const ticketSpacingX = availableWidth / ticketsPerRow;
      const ticketSpacingY = availableHeight / ticketsPerCol;
      
      const x = margin + col * ticketSpacingX + (ticketSpacingX - ticketWidth) / 2;
      const y = pageHeight - 80 - (row + 1) * ticketSpacingY + (ticketSpacingY - ticketHeight) / 2;
      
      // Draw the ticket
      if (currentPage) {
        console.log(`🎨 Drawing ${isVRBooking ? 'VR session' : 'ticket'} ${i + 1} on page ${Math.floor(i / ticketsPerPage) + 1}: ${tickets[i].ticketNumber}`)
        console.log(`   Position: Row ${row + 1}, Column ${col + 1} (${positionOnPage + 1}/6 on page)`)
        console.log('   Ticket type name:', tickets[i].ticketTypeName)
        console.log('   Is VR ticket:', tickets[i].isVRTicket)
        
        await this.drawSingleTicket(currentPage, pdfDoc, tickets[i], x, y);
        
        // Add subtle cut lines around ticket
        const lineColor = rgb(0.9, 0.9, 0.9);
        const dashArray = [3, 2];
        
        // Horizontal cut lines (between rows)
        if (row > 0) {
          currentPage.drawLine({
            start: { x: x - 10, y: y + ticketHeight + (ticketSpacingY - ticketHeight) / 2 },
            end: { x: x + ticketWidth + 10, y: y + ticketHeight + (ticketSpacingY - ticketHeight) / 2 },
            color: lineColor,
            dashArray: dashArray,
          });
        }
        
        // Vertical cut lines (between columns)
        if (col > 0) {
          currentPage.drawLine({
            start: { x: x - (ticketSpacingX - ticketWidth) / 2, y: y - 10 },
            end: { x: x - (ticketSpacingX - ticketWidth) / 2, y: y + ticketHeight + 10 },
            color: lineColor,
            dashArray: dashArray,
          });
        }
      }
    }
    
    console.log(`✅ PDF generated successfully: ${tickets.length} ${isVRBooking ? 'VR session' : 'EMS'} tickets across ${totalPages} pages`);
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Helper method to generate PDF tickets from registration data
   */
  static async generateTicketsFromRegistration(registration: any): Promise<Buffer> {
    const customerName = `${registration.firstName} ${registration.lastName}`;
    
    const ticketDataArray = registration.tickets.map((ticket: any, index: number) => {
      // Determine if this is a VR ticket
      const isVRTicket = ticket.venue === 'VR Room Malta' || 
                        ticket.ticketType?.category === 'VR_EXPERIENCE' ||
                        ticket.ticketType?.name?.includes('VR');

      return {
        ticketNumber: ticket.ticketNumber,
        customerName,
        email: registration.email,
        phone: registration.phone,
        qrCode: ticket.qrCode,
        sequence: ticket.ticketSequence || (index + 1),
        totalTickets: registration.tickets.length,
        isEmsClient: registration.isEmsClient,
        isVRTicket: isVRTicket, // ✅ VR flag
        // Include ticket type information
        ticketTypeName: ticket.ticketType?.name || (isVRTicket ? 'VR Experience' : 'General Admission'),
        ticketTypePrice: ticket.purchasePrice || ticket.ticketType?.priceInCents || 0,
        // Venue information
        venue: isVRTicket ? 'VR Room Malta' : (ticket.venue || 'Malta Fairs and Conventions Centre'),
        boothLocation: isVRTicket ? 'Bugibba Square, Malta' : (ticket.boothLocation || 'EMS Booth - MFCC')
      }
    });

    return await this.generateAllTicketsPDF(ticketDataArray);
  }
}