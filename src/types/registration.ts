// SOLUTION 1: Updated types/registration.ts
// src/types/registration.ts - Complete updated types

export interface RegistrationFormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  
  // Customer Type
  isEmsClient: boolean
  
  // Ticket Selection
  selectedTickets: SelectedTicket[]
  
  // EMS Client Details (if applicable)
  customerName?: string
  orderNumber?: string
  applicationNumber?: string
  orderDate?: string
  
  // Panel Interest
  panelInterest: boolean
  
  // Coupon Support
  couponCode?: string
  appliedDiscount?: number
  
  // Terms
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
}

// ✅ UPDATED: Extended TicketType interface to match your Prisma schema
export interface TicketType {
  id: string
  name: string
  description?: string | null          // ✅ Added
  category?: string | null             // ✅ Added
  priceInCents: number
  currency?: string                    // ✅ Added
  totalStock?: number                  // ✅ Added
  reservedStock?: number               // ✅ Added
  soldStock?: number                   // ✅ Added
  availableStock: number
  isActive: boolean
  availableFrom?: Date | string | null // ✅ Added
  availableUntil?: Date | string | null// ✅ Added
  maxPerOrder: number
  minPerOrder: number
  emsClientsOnly?: boolean             // ✅ Added
  publicOnly?: boolean                 // ✅ Added
  sortOrder?: number                   // ✅ Added
  imageUrl?: string | null             // ✅ Added
  featured?: boolean                   // ✅ Added
  tags?: string | null                 // ✅ Added
  parsedTags?: string[]                // ✅ Added (computed field)
  createdBy?: string                   // ✅ Added
  notes?: string | null                // ✅ Added
  createdAt?: Date | string            // ✅ Added
  updatedAt?: Date | string            // ✅ Added
  
  // ✅ Keep your existing computed properties
  formattedPrice: string
  isAvailable: boolean
  isFree: boolean
}

export interface StepProps {
  formData: RegistrationFormData
  onUpdate: (field: keyof RegistrationFormData, value: any) => void
}

// ✅ BONUS: Add interface for coupon validation
export interface CouponValidationResult {
  isValid: boolean
  coupon?: {
    id: string
    code: string
    name: string
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
    discountValue: number
    minOrderAmount?: number
    maxUsesPerUser?: number
    currentUses?: number
    maxUses?: number
  }
  discountAmount?: number
  message?: string
}