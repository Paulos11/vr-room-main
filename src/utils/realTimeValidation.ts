// UPDATED: src/utils/realTimeValidation.ts - Optional ID card + Multiple registrations support
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
      // ✅ UPDATED: ID card is now optional, but if provided it should be valid
      if (value && value.trim().length > 0 && value.trim().length < 3) {
        return { isValid: false, error: 'ID card number must be at least 3 characters if provided' }
      }
      return { isValid: true } // Valid even if empty

    case 'selectedTickets':
      if (!Array.isArray(value) || value.length === 0) {
        return { isValid: false, error: 'Please select at least one ticket' }
      }
      return { isValid: true }

    // EMS Customer required field validations
    case 'customerName':
      if (!value || value.trim().length < 2) {
        return { isValid: false, error: 'Customer name is required' }
      }
      return { isValid: true }

    case 'orderNumber':
      if (!value || value.trim().length < 3) {
        return { isValid: false, error: 'Order number is required' }
      }
      return { isValid: true }

    case 'applicationNumber':
      if (!value || value.trim().length < 3) {
        return { isValid: false, error: 'Application number is required' }
      }
      return { isValid: true }

    default:
      return { isValid: true }
  }
}

// Helper function to validate EMS customer required fields
export function validateEmsCustomerFields(formData: RegistrationFormData): boolean {
  if (!formData.isEmsClient) return true // Skip validation for non-EMS customers
  
  return validateField('customerName', formData.customerName).isValid &&
         validateField('orderNumber', formData.orderNumber).isValid &&
         validateField('applicationNumber', formData.applicationNumber).isValid
}

export function validateStep(step: number, formData: RegistrationFormData): boolean {
  switch (step) {
    case 1: // Ticket Selection
      return formData.selectedTickets.length > 0

    case 2: // Personal Information
      return validateField('firstName', formData.firstName).isValid &&
             validateField('lastName', formData.lastName).isValid &&
             validateField('email', formData.email).isValid &&
             validateField('phone', formData.phone).isValid
             // ✅ REMOVED: ID card validation is no longer required for step completion

    case 3: 
      if (formData.isEmsClient) {
        // EMS Customer Details step - validate required fields
        return validateEmsCustomerFields(formData)
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

  // ✅ UPDATED: ID card validation only if provided
  if (formData.idCardNumber && formData.idCardNumber.trim().length > 0) {
    const idValidation = validateField('idCardNumber', formData.idCardNumber)
    if (!idValidation.isValid) errors.push(`ID Card: ${idValidation.error}`)
  }

  // Ticket selection validation
  const ticketValidation = validateField('selectedTickets', formData.selectedTickets)
  if (!ticketValidation.isValid) errors.push(`Tickets: ${ticketValidation.error}`)

  // EMS Customer fields validation (if EMS customer)
  if (formData.isEmsClient) {
    const customerNameValidation = validateField('customerName', formData.customerName)
    if (!customerNameValidation.isValid) errors.push(`Customer name: ${customerNameValidation.error}`)

    const orderNumberValidation = validateField('orderNumber', formData.orderNumber)
    if (!orderNumberValidation.isValid) errors.push(`Order number: ${orderNumberValidation.error}`)

    const applicationNumberValidation = validateField('applicationNumber', formData.applicationNumber)
    if (!applicationNumberValidation.isValid) errors.push(`Application number: ${applicationNumberValidation.error}`)
  }

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

// Helper function to get specific field errors for real-time validation
export function getFieldErrors(formData: RegistrationFormData): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  
  // Personal fields (ID card is optional now)
  const personalFields = ['firstName', 'lastName', 'email', 'phone']
  personalFields.forEach(field => {
    const validation = validateField(field, formData[field as keyof RegistrationFormData])
    if (!validation.isValid && validation.error) {
      fieldErrors[field] = validation.error
    }
  })

  // Check ID card only if provided
  if (formData.idCardNumber && formData.idCardNumber.trim().length > 0) {
    const validation = validateField('idCardNumber', formData.idCardNumber)
    if (!validation.isValid && validation.error) {
      fieldErrors['idCardNumber'] = validation.error
    }
  }
  
  // EMS customer fields (if applicable)
  if (formData.isEmsClient) {
    const emsFields = ['customerName', 'orderNumber', 'applicationNumber']
    emsFields.forEach(field => {
      const validation = validateField(field, formData[field as keyof RegistrationFormData])
      if (!validation.isValid && validation.error) {
        fieldErrors[field] = validation.error
      }
    })
  }
  
  return fieldErrors
}

// ✅ NEW: Check if customer can register (for EMS customers)
export async function checkRegistrationEligibility(email: string, isEmsClient: boolean): Promise<{
  canRegister: boolean
  message?: string
  existingRegistrationId?: string
}> {
  if (!isEmsClient) {
    // Public customers can always register multiple times
    return { canRegister: true }
  }

  try {
    // Check for existing pending EMS registrations
    const response = await fetch(`/api/registration/check-eligibility?email=${encodeURIComponent(email)}&isEmsClient=true`)
    const result = await response.json()
    
    return result
  } catch (error) {
    console.error('Error checking registration eligibility:', error)
    return { 
      canRegister: false, 
      message: 'Unable to verify registration eligibility. Please try again.' 
    }
  }
}