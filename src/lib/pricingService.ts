// src/lib/pricingService.ts
import { prisma } from '@/lib/prisma'
import { TicketType } from '@prisma/client' // Import TicketType model

export interface PricingCalculation {
  originalAmount: number // in cents
  discountAmount: number // in cents  
  finalAmount: number // in cents
  appliedCoupon?: {
    id: string
    code: string
    name: string
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
    discountValue: number
  }
}

export interface CouponValidationResult {
  isValid: boolean
  error?: string
  coupon?: any
}

export class PricingService {
  // Get current ticket price for customer type
  static async getCurrentTicketPrice(isEmsClient: boolean): Promise<number> {
    try {
      // For EMS clients, always free
      if (isEmsClient) return 0

      // Try to get active ticket price from database
      // Changed prisma.ticketPrice to prisma.ticketType
      const activePrice: TicketType | null = await prisma.ticketType.findFirst({
        where: {
          isActive: true,
          // Removed `accessType: 'VIP'` as it's not a field in TicketType
          // Consider if you need to filter by `name` or another field to get a specific 'VIP' ticket type
          // For example: name: 'EMS VIP Trade Fair Access'
          OR: [
            { publicOnly: true },
            { publicOnly: false, emsClientsOnly: false }
          ],
          AND: [
            {
              OR: [
                { availableFrom: null },
                { availableFrom: { lte: new Date() } }
              ]
            },
            {
              OR: [
                { availableUntil: null },
                { availableUntil: { gte: new Date() } }
              ]
            }
          ]
        },
        orderBy: { sortOrder: 'desc' }
      })

      if (activePrice) {
        return activePrice.priceInCents
      }

      // Fallback to default price (€50.00 = 5000 cents)
      return 5000
    } catch (error) {
      console.error('Error getting ticket price:', error)
      // Fallback to default
      return 5000
    }
  }

  // Validate a coupon code
  static async validateCoupon(
    couponCode: string, 
    isEmsClient: boolean,
    orderAmount: number // in cents
  ): Promise<CouponValidationResult> {
    try {
      if (!couponCode.trim()) {
        return { isValid: false, error: 'Coupon code is required' }
      }

      const coupon = await prisma.coupon.findUnique({
        where: { 
          code: couponCode.toUpperCase().trim()
        }
      })

      if (!coupon) {
        return { isValid: false, error: 'Invalid coupon code' }
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        return { isValid: false, error: 'This coupon is no longer active' }
      }

      // Check validity dates
      const now = new Date()
      if (coupon.validFrom > now) {
        return { isValid: false, error: 'This coupon is not yet valid' }
      }

      if (coupon.validTo && coupon.validTo < now) {
        return { isValid: false, error: 'This coupon has expired' }
      }

      // Check customer type restrictions
      if (coupon.emsClientsOnly && !isEmsClient) {
        return { isValid: false, error: 'This coupon is only valid for EMS customers' }
      }

      if (coupon.publicOnly && isEmsClient) {
        return { isValid: false, error: 'This coupon is not valid for EMS customers' }
      }

      // Check minimum order amount
      if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
        const minAmount = (coupon.minOrderAmount / 100).toFixed(2)
        return { 
          isValid: false, 
          error: `Minimum order amount of €${minAmount} required for this coupon` 
        }
      }

      // Check usage limits
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return { isValid: false, error: 'This coupon has reached its usage limit' }
      }

      return {
        isValid: true,
        coupon
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      return { isValid: false, error: 'Error validating coupon' }
    }
  }

  // Calculate pricing with optional coupon
  static async calculatePricing(
    quantity: number,
    isEmsClient: boolean,
    couponCode?: string
  ): Promise<PricingCalculation> {
    try {
      // Get base ticket price
      const ticketPrice = await this.getCurrentTicketPrice(isEmsClient)
      const originalAmount = ticketPrice * quantity

      // If EMS client or no coupon, return original pricing
      if (isEmsClient || !couponCode) {
        return {
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount
        }
      }

      // Validate coupon
      const couponValidation = await this.validateCoupon(couponCode, isEmsClient, originalAmount)
      
      if (!couponValidation.isValid || !couponValidation.coupon) {
        return {
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount
        }
      }

      const coupon = couponValidation.coupon

      // Calculate discount
      let discountAmount = 0
      
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = Math.round((originalAmount * coupon.discountValue) / 100)
      } else if (coupon.discountType === 'FIXED_AMOUNT') {
        discountAmount = Math.min(coupon.discountValue, originalAmount)
      }

      const finalAmount = Math.max(0, originalAmount - discountAmount)

      return {
        originalAmount,
        discountAmount,
        finalAmount,
        appliedCoupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        }
      }
    } catch (error) {
      console.error('Error calculating pricing:', error)
      // Fallback to original pricing
      const ticketPrice = await this.getCurrentTicketPrice(isEmsClient)
      const originalAmount = ticketPrice * quantity
      
      return {
        originalAmount,
        discountAmount: 0,
        finalAmount: originalAmount
      }
    }
  }

  // Apply coupon to registration (increment usage count)
  static async applyCouponToRegistration(couponId: string): Promise<void> {
    try {
      await prisma.coupon.update({
        where: { id: couponId },
        data: {
          currentUses: {
            increment: 1
          }
        }
      })
    } catch (error) {
      console.error('Error applying coupon to registration:', error)
      throw error
    }
  }

  // Get available ticket prices for admin
  static async getAvailableTicketPrices() {
    try {
      // Changed prisma.ticketPrice to prisma.ticketType
      return await prisma.ticketType.findMany({
        where: { isActive: true },
        orderBy: [
          { sortOrder: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    } catch (error) {
      console.error('Error getting ticket prices:', error)
      return []
    }
  }

  // Format price for display
  static formatPrice(priceInCents: number): string {
    return `€${(priceInCents / 100).toFixed(2)}`
  }

  // Get pricing summary for admin
  static async getPricingSummary() {
    try {
      // Changed prisma.ticketPrice to prisma.ticketType
      const [ticketPrices, activeCoupons, usedCoupons] = await Promise.all([
        prisma.ticketType.count({ where: { isActive: true } }),
        prisma.coupon.count({ where: { isActive: true } }),
        prisma.coupon.aggregate({
          _sum: { currentUses: true },
          where: { isActive: true }
        })
      ])

      return {
        activeTicketPrices: ticketPrices,
        activeCoupons: activeCoupons,
        totalCouponUses: usedCoupons._sum.currentUses || 0
      }
    } catch (error) {
      console.error('Error getting pricing summary:', error)
      return {
        activeTicketPrices: 0,
        activeCoupons: 0,
        totalCouponUses: 0
      }
    }
  }
}