// src/lib/ticketGenerator.ts - Updated with verification URLs for fast scanning
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

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
  private static readonly PREFIX = 'TKT'
  private static readonly YEAR = new Date().getFullYear()
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  /**
   * Generate a random, unique ticket number
   * Format: TKT-2025-A7K9M2 (random alphanumeric)
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
   * Generate verification token for QR code security
   */
  private static generateVerificationToken(ticketNumber: string): string {
    // Create a secure hash for verification
    const secret = process.env.TICKET_VERIFICATION_SECRET || 'default-secret-change-in-production'
    const timestamp = Math.floor(Date.now() / 1000) // Current timestamp in seconds
    
    // Create hash with ticket number and timestamp (valid for 24 hours)
    const data = `${ticketNumber}:${timestamp}`
    const hash = crypto.createHmac('sha256', secret).update(data).digest('hex')
    
    // Return first 16 characters of hash + timestamp
    return `${hash.substring(0, 16)}:${timestamp}`
  }

  /**
   * Generate QR code with verification URL for super-fast scanning
   */
  static generateQRCode(ticketNumber: string): string {
    // Generate verification token
    const verificationToken = this.generateVerificationToken(ticketNumber)
    
    // Create verification URL that directly identifies the ticket
    const verificationUrl = `${this.BASE_URL}/verify/${ticketNumber}?token=${verificationToken}`
    
    return verificationUrl
  }

  /**
   * Generate complete ticket with verification URL QR code
   */
  static async generateTicket(options: TicketGenerationOptions): Promise<GeneratedTicket> {
    const ticketNumber = await this.generateTicketNumber()
    const qrCode = this.generateQRCode(ticketNumber)

    console.log(`Generated ticket: ${ticketNumber}`)
    console.log(`QR Code URL: ${qrCode}`)

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
    // Format: TKT-2025-A7K9M2 (6 or 8 character suffix)
    const pattern = /^TKT-\d{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6,8}$/
    return pattern.test(ticketNumber)
  }

  /**
   * Validate verification token
   */
  static validateVerificationToken(ticketNumber: string, token: string): boolean {
    try {
      const [hash, timestamp] = token.split(':')
      const tokenTimestamp = parseInt(timestamp)
      const currentTimestamp = Math.floor(Date.now() / 1000)
      
      // Check if token is not older than 24 hours
      if (currentTimestamp - tokenTimestamp > 86400) {
        return false
      }
      
      // Recreate expected hash
      const secret = process.env.TICKET_VERIFICATION_SECRET || 'default-secret-change-in-production'
      const data = `${ticketNumber}:${timestamp}`
      const expectedHash = crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16)
      
      return hash === expectedHash
    } catch (error) {
      return false
    }
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