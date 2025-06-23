// src/utils/formValidation.ts - Fixed validation logic for correct step flow
import { RegistrationFormData } from '@/types/registration'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface FieldValidationResult {
  isValid: boolean
  error?: string
}

export function validateField(fieldName: string, value: any): FieldValidationResult {
  switch (fieldName) {
    case 'firstName':
    case 'lastName':
      if (!value || value.trim().length < 2) {
        return { isValid: false, error: 'Must be at least 2 characters' }
      }
      if (value.trim().length > 50) {
        return { isValid: false, error: 'Must be less than 50 characters' }
      }
      return { isValid: true }

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!value || !emailRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid email address' }
      }
      return { isValid: true }

    case 'phone':
      // Basic phone validation - adjust based on your requirements
      const phoneRegex = /^[\+]?[\s\d\-\(\)]{8,}$/
      if (!value || !phoneRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid phone number' }
      }
      return { isValid: true }

    case 'idCardNumber':
      if (!value || value.trim().length < 3) {
        return { isValid: false, error: 'Please enter your ID card number' }
      }
      return { isValid: true }

    case 'selectedTickets':
      if (!Array.isArray(value) || value.length === 0) {
        return { isValid: false, error: 'Please select at least one ticket' }
      }
      return { isValid: true }

    default:
      return { isValid: true }
  }
}

export function validateStep(step: number, formData: RegistrationFormData): boolean {
  switch (step) {
    case 1: // Ticket Selection
      return formData.selectedTickets.length > 0

    case 2: // Personal Information
      return validateField('firstName', formData.firstName).isValid &&
             validateField('lastName', formData.lastName).isValid &&
             validateField('email', formData.email).isValid &&
             validateField('phone', formData.phone).isValid &&
             validateField('idCardNumber', formData.idCardNumber).isValid

    case 3: 
      if (formData.isEmsClient) {
        // EMS Customer Details step - all fields are optional, so always valid
        return true
      } else {
        // Panel Interest step for public customers - always valid since it's optional
        return true
      }

    case 4: 
      if (formData.isEmsClient) {
        // Panel Interest step for EMS customers - always valid since it's optional
        return true
      } else {
        // Terms step for public customers - check terms acceptance
        return formData.acceptTerms && formData.acceptPrivacyPolicy
      }

    case 5: 
      // Terms step for EMS customers only - check terms acceptance
      if (formData.isEmsClient) {
        return formData.acceptTerms && formData.acceptPrivacyPolicy
      } else {
        // Public customers should never reach step 5
        console.error('Public customer should not reach step 5')
        return false
      }

    default:
      return true
  }
}

export function validateAllFields(formData: RegistrationFormData): ValidationResult {
  const errors: string[] = []

  // Personal information validation
  const firstNameValidation = validateField('firstName', formData.firstName)
  if (!firstNameValidation.isValid) errors.push(`First name: ${firstNameValidation.error}`)

  const lastNameValidation = validateField('lastName', formData.lastName)
  if (!lastNameValidation.isValid) errors.push(`Last name: ${lastNameValidation.error}`)

  const emailValidation = validateField('email', formData.email)
  if (!emailValidation.isValid) errors.push(`Email: ${emailValidation.error}`)

  const phoneValidation = validateField('phone', formData.phone)
  if (!phoneValidation.isValid) errors.push(`Phone: ${phoneValidation.error}`)

  const idValidation = validateField('idCardNumber', formData.idCardNumber)
  if (!idValidation.isValid) errors.push(`ID Card: ${idValidation.error}`)

  // Ticket selection validation
  const ticketValidation = validateField('selectedTickets', formData.selectedTickets)
  if (!ticketValidation.isValid) errors.push(`Tickets: ${ticketValidation.error}`)

  // Terms validation
  if (!formData.acceptTerms) {
    errors.push('Please accept the terms and conditions')
  }

  if (!formData.acceptPrivacyPolicy) {
    errors.push('Please accept the privacy policy')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}