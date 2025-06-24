// src/lib/ticketService.ts - Updated to use URL-based QR codes
import { TicketGenerator } from './ticketGenerator'
import { prisma } from '@/lib/prisma'

export class TicketService {
  /**
   * Create a new ticket for a registration with URL-based QR code
   */
  static async createTicket(registrationId: string, sequence: number = 1): Promise<any> {
    try {
      // Get registration details
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { tickets: true }
      })

      if (!registration) {
        throw new Error('Registration not found')
      }

      // Generate ticket with URL-based QR code
      const ticketData = await TicketGenerator.generateTicket({
        registrationId,
        isEmsClient: registration.isEmsClient
      })

      console.log(`Generated ticket: ${ticketData.ticketNumber}`)
      console.log(`QR Code URL: ${ticketData.qrCode}`)
      console.log(`Verification URL: ${ticketData.verificationUrl}`)

      // Get default ticket type and price (you should implement proper logic here)
      const defaultTicketTypeId = 'clx2h32u60000r3v5897tq4u2' // REPLACE with actual logic
      const defaultPurchasePrice = registration.isEmsClient ? 0 : 50 // Example pricing

      // Create ticket in database with URL-based QR code
      const ticket = await prisma.ticket.create({
        data: {
          registrationId,
          ticketNumber: ticketData.ticketNumber,
          qrCode: ticketData.qrCode, // This now contains the full verification URL
          eventDate: new Date('2025-06-26'),
          venue: 'Malta Fairs and Conventions Centre',
          boothLocation: 'EMS Booth - MFCC',
          status: 'GENERATED',
          ticketSequence: sequence,
          ticketTypeId: defaultTicketTypeId,
          purchasePrice: defaultPurchasePrice,
        }
      })

      return ticket
    } catch (error) {
      console.error('Error creating ticket:', error)
      throw error
    }
  }

  /**
   * Create multiple tickets with URL-based QR codes for a registration
   */
  static async createMultipleTickets(registrationId: string, quantity: number): Promise<any[]> {
    try {
      console.log(`Creating ${quantity} tickets with URL-based QR codes for registration ${registrationId}`)
      
      const tickets = []
      
      for (let i = 1; i <= quantity; i++) {
        const ticket = await this.createTicket(registrationId, i)
        tickets.push(ticket)
        console.log(`Created ticket ${i}/${quantity}: ${ticket.ticketNumber}`)
        console.log(`QR Code: ${ticket.qrCode}`)
      }
      
      console.log(`Successfully created ${tickets.length} tickets with URL-based QR codes`)
      return tickets
    } catch (error) {
      console.error('Error creating multiple tickets:', error)
      throw error
    }
  }

  /**
   * Generate tickets when registration is approved (for EMS customers)
   */
  static async generateTicketForApprovedRegistration(registrationId: string): Promise<any[]> {
    try {
      // Update registration status to COMPLETED
      await prisma.registration.update({
        where: { id: registrationId },
        data: { 
          status: 'COMPLETED',
          verifiedAt: new Date()
        }
      })

      // Check if tickets already exist
      const existingTickets = await prisma.ticket.findMany({
        where: { registrationId }
      })

      if (existingTickets.length > 0) {
        // Update existing tickets to SENT
        await prisma.ticket.updateMany({
          where: { registrationId },
          data: { 
            status: 'SENT',
            sentAt: new Date()
          }
        })
        return existingTickets
      }

      // Create new ticket (EMS customers get 1 free ticket)
      const tickets = await this.createMultipleTickets(registrationId, 1)

      // Update ticket status to SENT
      await prisma.ticket.updateMany({
        where: { registrationId },
        data: { 
          status: 'SENT',
          sentAt: new Date()
        }
      })

      return tickets
    } catch (error) {
      console.error('Error generating ticket for approved registration:', error)
      throw error
    }
  }

  /**
   * Get all tickets for a registration
   */
  static async getTicketsByRegistration(registrationId: string): Promise<any[]> {
    return await prisma.ticket.findMany({
      where: { registrationId },
      orderBy: { ticketSequence: 'asc' },
      include: {
        registration: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isEmsClient: true
          }
        }
      }
    })
  }

  /**
   * Verify ticket by ticket number or QR code URL
   */
  static async verifyTicket(ticketNumberOrUrl: string): Promise<any> {
    let ticketNumber = ticketNumberOrUrl

    // If it's a URL, extract the ticket number
    if (ticketNumberOrUrl.startsWith('https://')) {
      const extractedNumber = TicketGenerator.extractTicketNumberFromUrl(ticketNumberOrUrl)
      if (!extractedNumber) {
        return { valid: false, message: 'Invalid verification URL format' }
      }
      ticketNumber = extractedNumber
    }

    // Validate the ticket number format
    if (!TicketGenerator.validateTicketNumber(ticketNumber)) {
      return { valid: false, message: 'Invalid ticket number format' }
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        registration: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            isEmsClient: true,
            status: true
          }
        }
      }
    })

    if (!ticket) {
      return { valid: false, message: 'Ticket not found' }
    }

    if (ticket.registration.status !== 'COMPLETED') {
      return { valid: false, message: 'Registration not completed' }
    }

    return {
      valid: true,
      ticket: {
        ...ticket,
        verificationUrl: TicketGenerator.getVerificationUrl(ticket.ticketNumber),
        ticketType: TicketGenerator.getTicketType(ticket.ticketNumber)
      },
      message: 'Ticket is valid'
    }
  }

  /**
   * Mark ticket as collected at booth
   */
  static async markTicketCollected(ticketNumber: string, collectedBy: string): Promise<any> {
    return await prisma.ticket.update({
      where: { ticketNumber },
      data: {
        status: 'COLLECTED',
        collectedAt: new Date(),
        collectedBy
      }
    })
  }

  /**
   * Check in ticket at event
   */
  static async checkInTicket(ticketNumber: string, checkedInBy: string, notes?: string): Promise<any> {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber }
    })

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    // Create check-in record
    const checkIn = await prisma.ticketCheckIn.create({
      data: {
        ticketId: ticket.id,
        checkedInBy,
        notes: notes || `Checked in at ${new Date().toLocaleString()}`
      }
    })

    // Update ticket status to USED
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'USED' }
    })

    return checkIn
  }

  /**
   * Regenerate a ticket with new ticket number and URL-based QR code
   */
  static async regenerateTicket(ticketId: string): Promise<any> {
    try {
      // Get the existing ticket
      const existingTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { registration: true }
      })

      if (!existingTicket) {
        throw new Error('Ticket not found')
      }

      // Generate new ticket data with URL-based QR code
      const newTicketData = await TicketGenerator.generateTicket({
        registrationId: existingTicket.registrationId,
        isEmsClient: existingTicket.registration.isEmsClient
      })

      console.log(`Regenerating ticket: ${existingTicket.ticketNumber} -> ${newTicketData.ticketNumber}`)
      console.log(`New QR Code URL: ${newTicketData.qrCode}`)

      // Update the existing ticket with new data
      const regeneratedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          ticketNumber: newTicketData.ticketNumber,
          qrCode: newTicketData.qrCode, // Now contains full verification URL
          status: 'GENERATED',
          updatedAt: new Date()
        }
      })

      return regeneratedTicket
    } catch (error) {
      console.error('Error regenerating ticket:', error)
      throw error
    }
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStats(): Promise<any> {
    const stats = await prisma.ticket.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const totalTickets = await prisma.ticket.count()
    
    return {
      total: totalTickets,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>)
    }
  }
}