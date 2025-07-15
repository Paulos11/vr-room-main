// src/types/vr-registration.ts - VR-specific types
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
}

export interface VRStepProps {
  formData: VRRegistrationFormData
  onUpdate: (field: keyof VRRegistrationFormData, value: any) => void
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
  }
  errors?: any[]
}