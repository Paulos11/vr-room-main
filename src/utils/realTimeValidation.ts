
// src/utils/realTimeValidation.ts - Real-time field validation
export function validateField(fieldName: string, value: any): { isValid: boolean; error?: string } {
  switch (fieldName) {
    case 'firstName':
    case 'lastName':
      if (!value || value.trim().length === 0) {
        return { isValid: false, error: 'This field is required' }
      }
      if (value.trim().length < 2) {
        return { isValid: false, error: 'Must be at least 2 characters' }
      }
      if (value.trim().length > 50) {
        return { isValid: false, error: 'Must be less than 50 characters' }
      }
      return { isValid: true }

    case 'email':
      if (!value || value.trim().length === 0) {
        return { isValid: false, error: 'Email is required' }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid email address' }
      }
      return { isValid: true }

    case 'phone':
      if (!value || value.trim().length === 0) {
        return { isValid: false, error: 'Phone number is required' }
      }
      const phoneRegex = /^[\+]?[\s\d\-\(\)]{8,}$/
      if (!phoneRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid phone number' }
      }
      return { isValid: true }

    case 'idCardNumber':
      if (!value || value.trim().length === 0) {
        return { isValid: false, error: 'ID card number is required' }
      }
      if (value.trim().length < 3) {
        return { isValid: false, error: 'ID card number too short' }
      }
      return { isValid: true }

    default:
      return { isValid: true }
  }
}
