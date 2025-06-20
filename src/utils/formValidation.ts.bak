// src/utils/formValidation.ts - Updated with real-time validation
import { RegistrationFormData } from '@/types/registration'
import { validateField } from '@/utils/realTimeValidation'

export const validateStep = (step: number, formData: RegistrationFormData): boolean => {
  switch (step) {
    case 1:
      // Validate all personal info fields
      const personalFields = ['firstName', 'lastName', 'email', 'phone', 'idCardNumber']
      for (const field of personalFields) {
        const result = validateField(field, formData[field as keyof RegistrationFormData])
        if (!result.isValid) return false
      }
      
      // For non-EMS customers, also validate quantity
      if (!formData.isEmsClient) {
        const quantityResult = validateField('quantity', formData.quantity)
        if (!quantityResult.isValid) return false
      }
      
      return true
      
    case 2:
      // EMS details are all optional
      return true
      
    case 3:
      if (formData.isEmsClient) {
        // Panel interest step for EMS clients - no required fields
        return true
      } else {
        // For non-EMS clients, step 3 is terms
        return formData.acceptTerms && formData.acceptPrivacyPolicy
      }
      
    case 4:
      // Only for EMS clients - terms
      return formData.acceptTerms && formData.acceptPrivacyPolicy
      
    default:
      return true
  }
}

export const validateAllFields = (formData: RegistrationFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Validate personal info
  const personalFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'idCardNumber', label: 'ID Card Number' }
  ]
  
  for (const field of personalFields) {
    const result = validateField(field.key, formData[field.key as keyof RegistrationFormData])
    if (!result.isValid) {
      errors.push(`${field.label}: ${result.error}`)
    }
  }
  
  // Validate quantity for non-EMS customers
  if (!formData.isEmsClient) {
    const quantityResult = validateField('quantity', formData.quantity)
    if (!quantityResult.isValid) {
      errors.push(`Quantity: ${quantityResult.error}`)
    }
  }
  
  // Validate terms
  if (!formData.acceptTerms) {
    errors.push('You must accept the Terms and Conditions')
  }
  
  if (!formData.acceptPrivacyPolicy) {
    errors.push('You must accept the Privacy Policy')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
