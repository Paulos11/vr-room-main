// FIXED: src/types/registration.ts - Add missing CouponValidationResult type

export interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  isEmsClient: boolean
  selectedTickets: SelectedTicket[]
  customerName?: string
  orderNumber?: string
  applicationNumber?: string
  orderDate?: string
  panelInterest: boolean
  couponCode?: string
  appliedDiscount?: number
  acceptTerms: boolean
  acceptPrivacyPolicy: boolean
}

export interface SelectedTicket {
  ticketTypeId: string
  name: string
  priceInCents: number
  quantity: number
  maxPerOrder: number
  minPerOrder: number
  
  // ✅ For package deals
  originalTicketId?: string // Original ticket ID for packages
  tierId?: string // Which tier was selected
  packageInfo?: {
    ticketCount: number // How many actual tickets this package gives
    pricePerTicket: number
    savingsAmount: number
    savingsPercent: number
    isPopular: boolean
  }
}

// ✅ ADD: Missing CouponValidationResult interface
export interface CouponValidationResult {
  isValid: boolean
  message?: string
  coupon?: {
    id: string
    code: string
    name: string
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
    discountValue: number
  }
  discountAmount?: number
  appliedCouponCode?: string
}

export interface TicketType {
  id: string
  name: string
  description?: string | null
  category?: string | null
  pricingType: 'FIXED' | 'TIERED' | 'PACKAGE'
  priceInCents: number
  currency?: string
  totalStock?: number
  reservedStock?: number
  soldStock?: number
  availableStock: number
  isActive: boolean
  availableFrom?: Date | string | null
  availableUntil?: Date | string | null
  maxPerOrder: number
  minPerOrder: number
  emsClientsOnly?: boolean
  publicOnly?: boolean
  sortOrder?: number
  imageUrl?: string | null
  featured?: boolean
  tags?: string | null
  parsedTags?: string[]
  createdBy?: string
  notes?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  
  // Computed properties
  formattedPrice: string
  isAvailable: boolean
  isFree: boolean
  hasTieredPricing?: boolean
  
  // ✅ For tiered pricing
  pricingTiers?: Array<{
    id: string
    name: string
    ticketCount: number
    priceInCents: number
    savingsAmount: number
    savingsPercent: number
    pricePerTicket: number
    isPopular: boolean
  }>
  tieredPricingNote?: {
    message: string
    bestOffer: string
    allOffers: string[]
    tiers: Array<{
      quantity: number
      totalPrice: number
      savings: number
      pricePerTicket: number
    }>
  }
  
  // ✅ For package deals
  originalTicketId?: string
  tierId?: string
  packageInfo?: {
    ticketCount: number
    pricePerTicket: number
    savingsAmount: number
    savingsPercent: number
    isPopular: boolean
  }
}

export interface StepProps {
  formData: RegistrationFormData
  onUpdate: (field: keyof RegistrationFormData, value: any) => void
}