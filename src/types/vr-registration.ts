// src/types/vr-registration.ts - Enhanced VR-specific types with payment step
export interface VRRegistrationFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  selectedTickets: VRSelectedTicket[]
  couponCode?: string
  appliedDiscount?: number
  acceptTerms: boolean
  acceptPrivacyPolicy: boolean
}

export interface VRSelectedTicket {
  ticketTypeId: string
  name: string
  priceInCents: number
  quantity: number
  maxPerOrder: number
  minPerOrder: number
}

export interface VRTicketType {
  id: string
  name: string
  description?: string | null
  category?: string | null
  priceInCents: number
  currency?: string
  availableStock: number
  isActive: boolean
  maxPerOrder: number
  minPerOrder: number
  imageUrl?: string | null
  featured?: boolean
  tags?: string[]
  duration?: number // minutes
  maxPlayers?: number
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  ageRating?: string
  createdAt?: Date | string
  updatedAt?: Date | string
     
  // ✅ ADDED: Tiered pricing properties
  pricingType?: 'FIXED' | 'TIERED'
  hasTieredPricing?: boolean
  isAvailable?: boolean
  isFree?: boolean
     
  // Tiered pricing hint for display
  tieredPricingNote?: {
    message: string
    bestOffer: string
    allOffers: string[]
    tiers: Array<{
      quantity: number
      totalPrice: number
      pricePerTicket: number
      savings: number
      savingsPercent: number
    }>
  }
     
  // Full pricing tier data from database
  pricingTiers?: Array<{
    id: string
    name: string
    description?: string
    ticketCount: number
    priceInCents: number // Total price for this quantity
    pricePerTicket: number // Price per individual ticket
    savingsAmount: number
    savingsPercent: number
    isPopular: boolean
    sortOrder: number
  }>
}

export interface VRStepProps {
  formData: VRRegistrationFormData
  onUpdate: (field: keyof VRRegistrationFormData, value: any) => void
}

// ✅ NEW: Payment step props
export interface VRPaymentStepProps {
  registrationData: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    originalAmount: number
    discountAmount: number
    finalAmount: number
    appliedCouponCode?: string
    sessionCount: number
    bookedExperiences?: Array<{
      experienceName: string
      quantity: number
      totalPrice: number
    }>
  }
  onPaymentComplete: () => void
  isFreeOrder: boolean
}

export interface CouponValidationResult {
  isValid: boolean
  message?: string
  coupon?: {
    id: string
    code: string
    name: string
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
    discountValue: number
    minOrderAmount?: number
    maxUsesPerUser?: number
    maxUses?: number
    currentUses?: number
    description?: string
  }
  discountAmount?: number
  appliedCouponCode?: string
}

export interface VRRegistrationResponse {
  success: boolean
  message: string
  data?: {
    id: string
    email: string
    finalAmount: number
    appliedCouponCode?: string
    sessionCount: number
    emailSent: boolean
    bookedExperiences?: Array<{
      experienceName: string
      quantity: number
      totalPrice: number
    }>
  }
  errors?: any[]
}

// ✅ ADDED: Helper interface for pricing calculations
export interface VRPricingCalculation {
  totalPrice: number
  pricePerTicket: number
  savings: number
  savingsPercent: number
  tierName?: string | null
  isOptimalTier: boolean
  tierInfo?: {
    tierPackages: number
    tierName: string
    remainingTickets: number
  } | null
}