// src/lib/ticketGenerator.ts - Updated to generate QR codes with verification URLs
import { randomBytes } from 'crypto'

interface TicketGenerationData {
  registrationId: string
  isEmsClient: boolean
}

export class TicketGenerator {
  private static readonly TICKET_PREFIX = 'EMS'
  private static readonly VERIFICATION_BASE_URL = 'https://emstickets.com/staff/verify'

  /**
   * Generate a random ticket number
   */
  static generateTicketNumber(isEmsClient: boolean = false): string {
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const randomPart = randomBytes(4).toString('hex').toUpperCase() // 8 character random hex
    const clientPrefix = isEmsClient ? 'VIP' : 'STD'
    
    return `${this.TICKET_PREFIX}${clientPrefix}${timestamp}${randomPart}`
  }

  /**
   * Generate QR code data with verification URL
   */
  static generateQRCodeData(ticketNumber: string): string {
    return `${this.VERIFICATION_BASE_URL}/${ticketNumber}`
  }

  /**
   * Generate a complete ticket with number and QR code URL
   */
  static async generateTicket(data: TicketGenerationData): Promise<{
    ticketNumber: string
    qrCode: string
    verificationUrl: string
  }> {
    const ticketNumber = this.generateTicketNumber(data.isEmsClient)
    const verificationUrl = `${this.VERIFICATION_BASE_URL}/${ticketNumber}`
    
    return {
      ticketNumber,
      qrCode: verificationUrl, // QR code contains the full verification URL
      verificationUrl
    }
  }

  /**
   * Validate ticket number format
   */
  static validateTicketNumber(ticketNumber: string): boolean {
    // EMS ticket format: EMSVIP[6-digit-timestamp][8-digit-hex] or EMSSTD[6-digit-timestamp][8-digit-hex]
    const pattern = /^EMS(VIP|STD)\d{6}[A-F0-9]{8}$/
    return pattern.test(ticketNumber)
  }

  /**
   * Extract ticket type from ticket number
   */
  static getTicketType(ticketNumber: string): 'VIP' | 'STD' | null {
    if (!this.validateTicketNumber(ticketNumber)) {
      return null
    }
    
    return ticketNumber.includes('VIP') ? 'VIP' : 'STD'
  }

  /**
   * Generate verification URL for existing ticket number
   */
  static getVerificationUrl(ticketNumber: string): string {
    return `${this.VERIFICATION_BASE_URL}/${ticketNumber}`
  }

  /**
   * Extract ticket number from verification URL
   */
  static extractTicketNumberFromUrl(url: string): string | null {
    const urlPattern = new RegExp(`^${this.VERIFICATION_BASE_URL}/(.+)$`)
    const match = url.match(urlPattern)
    return match ? match[1] : null
  }
}