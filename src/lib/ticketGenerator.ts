// src/lib/ticketGenerator.ts - Updated with random ticket numbers
import { prisma } from '@/lib/prisma'

interface TicketGenerationOptions {
  registrationId: string
  isEmsClient: boolean
  eventYear?: number
}

interface GeneratedTicket {
  ticketNumber: string
  qrCode: string
  accessType: 'VIP' | 'STANDARD'
}

export class TicketGenerator {
  private static readonly PREFIX = 'EMS'
  private static readonly YEAR = new Date().getFullYear()

  /**
   * Generate a random, unique ticket number
   * Format: EMS-2025-A7K9M2 (random alphanumeric)
   */
  static async generateTicketNumber(): Promise<string> {
    const year = this.YEAR
    let ticketNumber: string
    let attempts = 0
    const maxAttempts = 50

    do {
      // Generate random 6-character alphanumeric string
      const randomSuffix = this.generateRandomString(6)
      ticketNumber = `${this.PREFIX}-${year}-${randomSuffix}`
      
      // Check if this ticket number already exists
      const existingTicket = await prisma.ticket.findUnique({
        where: { ticketNumber }
      })
      
      if (!existingTicket) {
        break // Found a unique number
      }
      
      attempts++
      if (attempts >= maxAttempts) {
        // Fallback to longer random string if many collisions
        const longRandomSuffix = this.generateRandomString(8)
        ticketNumber = `${this.PREFIX}-${year}-${longRandomSuffix}`
        break
      }
    } while (true)

    return ticketNumber
  }

  /**
   * Generate random alphanumeric string (excluding confusing characters)
   */
  private static generateRandomString(length: number): string {
    // Exclude confusing characters: 0, O, I, 1, L
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length)
      result += chars[randomIndex]
    }
    
    return result
  }

  /**
   * Generate QR code data for the ticket
   */
  static generateQRCode(ticketNumber: string, registrationId: string): string {
    // QR code contains ticket verification data
    const qrData = {
      ticket: ticketNumber,
      registration: registrationId,
      event: 'EMS-TRADE-FAIR-2025',
      venue: 'MFCC',
      timestamp: Date.now(),
      // Add random verification code for extra security
      verification: this.generateRandomString(8)
    }

    // Convert to base64 encoded string for QR code
    return Buffer.from(JSON.stringify(qrData)).toString('base64')
  }

  /**
   * Generate complete ticket with random number and QR code
   */
  static async generateTicket(options: TicketGenerationOptions): Promise<GeneratedTicket> {
    const { registrationId } = options

    const ticketNumber = await this.generateTicketNumber()
    const qrCode = this.generateQRCode(ticketNumber, registrationId)

    return {
      ticketNumber,
      qrCode,
      accessType: 'VIP' // All tickets are VIP for this event
    }
  }

  /**
   * Validate ticket number format
   */
  static validateTicketNumber(ticketNumber: string): boolean {
    // Format: EMS-2025-A7K9M2 (6 or 8 character suffix)
    const pattern = /^EMS-\d{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6,8}$/
    return pattern.test(ticketNumber)
  }

  /**
   * Parse ticket number to extract information
   */
  static parseTicketNumber(ticketNumber: string): {
    prefix: string
    year: number
    randomCode: string
  } | null {
    if (!this.validateTicketNumber(ticketNumber)) {
      return null
    }

    const parts = ticketNumber.split('-')
    return {
      prefix: parts[0],
      year: parseInt(parts[1]),
      randomCode: parts[2]
    }
  }

  /**
   * Decode QR code data
   */
  static decodeQRCode(qrCode: string): any | null {
    try {
      const decoded = Buffer.from(qrCode, 'base64').toString('utf-8')
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Error decoding QR code:', error)
      return null
    }
  }

  /**
   * Generate batch of unique ticket numbers for multiple tickets
   */
  static async generateMultipleTicketNumbers(count: number): Promise<string[]> {
    const ticketNumbers: string[] = []
    
    for (let i = 0; i < count; i++) {
      const ticketNumber = await this.generateTicketNumber()
      ticketNumbers.push(ticketNumber)
    }
    
    return ticketNumbers
  }
}