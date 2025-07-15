// src/utils/vrFormValidation.ts - VR form validation utilities
import { VRRegistrationFormData } from '@/types/vr-registration'

export interface VRValidationResult {
  isValid: boolean
  errors: string[]
}

export interface VRFieldValidationResult {
  isValid: boolean
  error?: string
}

export function validateVRField(fieldName: string, value: any): VRFieldValidationResult {
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
      const phoneRegex = /^[\+]?[\s\d\-\(\)]{8,}$/
      if (!value || !phoneRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid phone number' }
      }
      return { isValid: true }

    case 'selectedTickets':
      if (!Array.isArray(value) || value.length === 0) {
        return { isValid: false, error: 'Please select at least one VR experience' }
      }
      return { isValid: true }

    default:
      return { isValid: true }
  }
}

export function validateVRStep(step: number, formData: VRRegistrationFormData): boolean {
  switch (step) {
    case 1: // VR Experience Selection
      return formData.selectedTickets.length > 0

    case 2: // Personal Information
      return validateVRField('firstName', formData.firstName).isValid &&
             validateVRField('lastName', formData.lastName).isValid &&
             validateVRField('email', formData.email).isValid &&
             validateVRField('phone', formData.phone).isValid

    case 3: // Terms & Conditions
      return formData.acceptTerms && formData.acceptPrivacyPolicy

    default:
      return true
  }
}

export function validateAllVRFields(formData: VRRegistrationFormData): VRValidationResult {
  const errors: string[] = []

  // Personal information validation
  const firstNameValidation = validateVRField('firstName', formData.firstName)
  if (!firstNameValidation.isValid) errors.push(`First name: ${firstNameValidation.error}`)

  const lastNameValidation = validateVRField('lastName', formData.lastName)
  if (!lastNameValidation.isValid) errors.push(`Last name: ${lastNameValidation.error}`)

  const emailValidation = validateVRField('email', formData.email)
  if (!emailValidation.isValid) errors.push(`Email: ${emailValidation.error}`)

  const phoneValidation = validateVRField('phone', formData.phone)
  if (!phoneValidation.isValid) errors.push(`Phone: ${phoneValidation.error}`)

  // VR Experience selection validation
  const experienceValidation = validateVRField('selectedTickets', formData.selectedTickets)
  if (!experienceValidation.isValid) errors.push(`VR Experiences: ${experienceValidation.error}`)

  // Terms validation
  if (!formData.acceptTerms) {
    errors.push('Please accept the VR experience terms and conditions')
  }

  if (!formData.acceptPrivacyPolicy) {
    errors.push('Please accept the privacy policy')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to get specific field errors for real-time validation
export function getVRFieldErrors(formData: VRRegistrationFormData): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  
  const personalFields = ['firstName', 'lastName', 'email', 'phone']
  personalFields.forEach(field => {
    const validation = validateVRField(field, formData[field as keyof VRRegistrationFormData])
    if (!validation.isValid && validation.error) {
      fieldErrors[field] = validation.error
    }
  })
  
  return fieldErrors
}