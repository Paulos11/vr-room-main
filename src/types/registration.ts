// src/types/registration.ts - Updated with quantity support
export interface RegistrationFormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  
  // Customer Type
  isEmsClient: boolean
  
  // Quantity (for non-EMS customers)
  quantity?: number
  
  // EMS Client Details (if applicable)
  customerName?: string
  emsCustomerId?: string
  accountManager?: string
  
  // Simplified Panel Interest
  panelInterest: boolean
  
  // Terms
  acceptTerms: boolean
  acceptPrivacyPolicy: boolean
}

export interface StepProps {
  formData: RegistrationFormData
  onUpdate: (field: keyof RegistrationFormData, value: any) => void
}
