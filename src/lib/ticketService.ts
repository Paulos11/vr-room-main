// src/lib/ticketService.ts - Fixed version
import { TicketGenerator } from './ticketGenerator'
import { prisma } from '@/lib/prisma'

export class TicketService {
  /**
   * Create a new ticket for a registration with random ticket number
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

      // Generate random ticket details
      const ticketData = await TicketGenerator.generateTicket({
        registrationId,
        isEmsClient: registration.isEmsClient
      })

      console.log(`Generated random ticket number: ${ticketData.ticketNumber}`)

      // You need to determine the actual ticketTypeId and purchasePrice here
      // For instance, you might fetch it from the TicketType based on some logic,
      // or derive it from the registration's selectedTickets if this is for an individual ticket.
      // For now, I'll use placeholders as a direct fix for the type error,
      // but you MUST replace these with actual logic.
      const defaultTicketTypeId = 'clx2h32u60000r3v5897tq4u2' // REPLACE with a real ID from your TicketType model
      const defaultPurchasePrice = 0 // REPLACE with actual price (e.g., from registration.finalAmount or selectedTickets)

      // Create ticket in database
      const ticket = await prisma.ticket.create({
        data: {
          registrationId,
          ticketNumber: ticketData.ticketNumber,
          qrCode: ticketData.qrCode,
          eventDate: new Date('2025-06-26'), // Start date of the event
          venue: 'Malta Fairs and Conventions Centre',
          boothLocation: 'EMS Booth - MFCC',
          status: 'GENERATED',
          ticketSequence: sequence,
          // These two fields are required by your schema
          ticketTypeId: defaultTicketTypeId, // Provide actual ticket type ID
          purchasePrice: defaultPurchasePrice, // Provide actual purchase price
        }
      })

      return ticket
    } catch (error) {
      console.error('Error creating ticket:', error)
      throw error
    }
  }

  /**
   * Create multiple tickets with random numbers for a registration
   */
  static async createMultipleTickets(registrationId: string, quantity: number): Promise<any[]> {
    try {
      console.log(`Creating ${quantity} tickets with random numbers for registration ${registrationId}`)
      
      const tickets = []
      
      for (let i = 1; i <= quantity; i++) {
        const ticket = await this.createTicket(registrationId, i)
        tickets.push(ticket)
        console.log(`Created ticket ${i}/${quantity}: ${ticket.ticketNumber}`)
      }
      
      console.log(`Successfully created ${tickets.length} tickets with random numbers`)
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
   * Verify ticket by ticket number
   */
  static async verifyTicket(ticketNumber: string): Promise<any> {
    // First validate the format
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

    // Basic ticket validation without QR verification for now
    // You can add QR verification back once you implement the decodeQRCode method
    return {
      valid: true,
      ticket,
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