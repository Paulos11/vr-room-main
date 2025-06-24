// src/services/apiService.ts - API Service for ticket verification

import type { VerificationResult, TicketData } from '../types/scanner'

export class ApiService {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

  /**
   * Verify ticket by ticket number
   */
  static async verifyTicket(
    ticketNumber: string, 
    checkedInBy: string = 'Scanner Staff',
    location: string = 'EMS Booth - Main Entrance'
  ): Promise<VerificationResult> {
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber,
          checkedInBy,
          location
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: VerificationResult = await response.json()
      return result

    } catch (error) {
      console.error('API verification error:', error)
      
      // Return error result
      return {
        success: false,
        canEnter: false,
        message: error instanceof Error ? error.message : 'Network error - please try again'
      }
    }
  }

  /**
   * Mock verification for development/demo
   */
  static async mockVerifyTicket(ticketNumber: string): Promise<VerificationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Mock logic - 70% success rate
    const isValid = Math.random() > 0.3
    const isEmsClient = Math.random() > 0.5

    // Generate mock customer data
    const mockCustomers = [
      { name: 'John Doe', email: 'john.doe@email.com' },
      { name: 'Jane Smith', email: 'jane.smith@company.com' },
      { name: 'Mike Johnson', email: 'mike.j@business.net' },
      { name: 'Sarah Wilson', email: 'sarah.wilson@org.com' },
      { name: 'David Brown', email: 'david.brown@firm.co' }
    ]

    const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)]

    const mockTicket: TicketData = {
      ticketNumber,
      customerName: customer.name,
      email: customer.email,
      isEmsClient,
      ticketType: isEmsClient ? 'VIP Access' : 'Standard Access',
      status: isValid ? 'VALID' : 'INVALID'
    }

    const result: VerificationResult = {
      success: true,
      canEnter: isValid,
      message: isValid ? 
        'Valid ticket - Entry allowed' : 
        this.getRandomDenialReason(),
      ticket: mockTicket
    }

    // Sometimes add check-in info for already processed tickets
    if (Math.random() > 0.8) {
      result.checkIn = {
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Within last hour
        location: 'EMS Booth - Main Entrance',
        checkedInBy: 'Scanner Staff'
      }
    }

    return result
  }

  /**
   * Get random denial reason for demo
   */
  private static getRandomDenialReason(): string {
    const reasons = [
      'Ticket already used',
      'Ticket has been cancelled',
      'Invalid ticket number',
      'Ticket not found in system',
      'Event access expired',
      'Ticket requires additional verification'
    ]
    return reasons[Math.floor(Math.random() * reasons.length)]
  }

  /**
   * Check API health
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  /**
   * Get scanner statistics
   */
  static async getStats(): Promise<any> {
    try {
      const response = await fetch('/api/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      return {
        totalScans: 0,
        validEntries: 0,
        deniedEntries: 0,
        duplicateScans: 0
      }
    }
  }
}