// src/types/registration.ts - Updated with order fields
// src/types/registration.ts - Add appliedDiscount field
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
  appliedDiscount?: number // ADD THIS LINE
  
  // Terms
  acceptTerms: boolean
  acceptPrivacyPolicy: boolean
}

// ... rest of the types remain the same


export interface SelectedTicket {
  ticketTypeId: string
  name: string
  priceInCents: number
  quantity: number
  maxPerOrder: number
  minPerOrder: number
}

export interface TicketType {
  id: string
  name: string
  priceInCents: number
  availableStock: number
  maxPerOrder: number
  minPerOrder: number
  isActive: boolean
  formattedPrice: string
  isAvailable: boolean
  isFree: boolean
}

export interface StepProps {
  formData: RegistrationFormData
  onUpdate: (field: keyof RegistrationFormData, value: any) => void
}