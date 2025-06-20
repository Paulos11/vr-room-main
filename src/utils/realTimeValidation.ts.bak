// src/utils/realTimeValidation.ts
export interface ValidationResult {
  isValid: boolean
  error?: string
}

export const validateField = (field: string, value: any): ValidationResult => {
  switch (field) {
    case 'firstName':
      if (!value || value.trim().length < 2) {
        return { isValid: false, error: 'First name must be at least 2 characters' }
      }
      if (value.trim().length > 50) {
        return { isValid: false, error: 'First name is too long' }
      }
      return { isValid: true }

    case 'lastName':
      if (!value || value.trim().length < 2) {
        return { isValid: false, error: 'Last name must be at least 2 characters' }
      }
      if (value.trim().length > 50) {
        return { isValid: false, error: 'Last name is too long' }
      }
      return { isValid: true }

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!value || !emailRegex.test(value.trim())) {
        return { isValid: false, error: 'Please enter a valid email address' }
      }
      if (value.trim().length > 255) {
        return { isValid: false, error: 'Email address is too long' }
      }
      return { isValid: true }

    case 'phone':
      if (!value || value.trim().length < 8) {
        return { isValid: false, error: 'Phone number must be at least 8 characters' }
      }
      if (value.trim().length > 20) {
        return { isValid: false, error: 'Phone number is too long' }
      }
      return { isValid: true }

    case 'idCardNumber':
      if (!value || value.trim().length < 5) {
        return { isValid: false, error: 'ID card number must be at least 5 characters' }
      }
      if (value.trim().length > 50) {
        return { isValid: false, error: 'ID card number is too long' }
      }
      return { isValid: true }

    case 'quantity':
      if (!value || value < 1 || value > 10) {
        return { isValid: false, error: 'Please select 1-10 tickets' }
      }
      return { isValid: true }

    default:
      return { isValid: true }
  }
}
