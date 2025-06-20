'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, AlertCircle } from 'lucide-react'
import { StepProps } from '@/types/registration'
import { validateField } from '@/utils/realTimeValidation'

export function PersonalInfoStep({ formData, onUpdate }: StepProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (field: string, value: string) => {
    // Update the form data
    onUpdate(field as keyof typeof formData, value)

    // Validate the field in real-time
    const validation = validateField(field, value)
    setFieldErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? '' : validation.error || ''
    }))
  }

  const handleQuantityChange = (value: number) => {
    onUpdate('quantity', value)
    const validation = validateField('quantity', value)
    setFieldErrors(prev => ({
      ...prev,
      quantity: validation.isValid ? '' : validation.error || ''
    }))
  }

  const getFieldClasses = (fieldName: string) => {
    const hasError = fieldErrors[fieldName]
    return `h-9 ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`
  }

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="text-base font-semibold flex items-center justify-center gap-2">
          <User className="h-4 w-4" />
          Personal Information
        </h3>
        <p className="text-xs text-gray-600">Required for event access</p>
      </div>
             
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="firstName" className="text-sm">First Name *</Label>
          <Input 
            id="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            className={`${getFieldClasses('firstName')} placeholder-gray-500 opacity-50`} 
            required
          />
          {fieldErrors.firstName && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-red-500" />
              <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
            </div>
          )}
        </div>
                 
        <div>
          <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
          <Input 
            id="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            className={`${getFieldClasses('lastName')} placeholder-gray-500 opacity-50`} 
            required
          />
          {fieldErrors.lastName && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-red-500" />
              <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm">Email Address *</Label>
        <Input 
          id="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          className={`${getFieldClasses('email')} placeholder-gray-500 opacity-50`} 
          required
        />
        {fieldErrors.email && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <p className="text-xs text-red-500">{fieldErrors.email}</p>
          </div>
        )}
        {!fieldErrors.email && (
          <p className="text-xs text-gray-500 mt-1">
            We'll send your ticket(s) to this email
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
        <Input 
          id="phone"
          type="tel"
          placeholder="+356 1234 5678"
          value={formData.phone}
          onChange={(e) => handleFieldChange('phone', e.target.value)}
          className={`${getFieldClasses('phone')} placeholder-gray-500 opacity-50`} 
          required
        />
        {fieldErrors.phone && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <p className="text-xs text-red-500">{fieldErrors.phone}</p>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="idCard" className="text-sm">ID Card Number *</Label>
        <Input 
          id="idCard"
          placeholder="ID number"
          value={formData.idCardNumber}
          onChange={(e) => handleFieldChange('idCardNumber', e.target.value)}
          className={`${getFieldClasses('idCardNumber')} placeholder-gray-500 opacity-50`} 
          required
        />
        {fieldErrors.idCardNumber && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <p className="text-xs text-red-500">{fieldErrors.idCardNumber}</p>
          </div>
        )}
        {!fieldErrors.idCardNumber && (
          <p className="text-xs text-gray-500 mt-1">
            Required for event verification
          </p>
        )}
      </div>

      {/* Quantity selection for non-EMS customers */}
      {!formData.isEmsClient && (
        <div>
          <Label htmlFor="quantity" className="text-sm">Number of VIP Tickets *</Label>
          <select
            id="quantity"
            value={formData.quantity || 1}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
            className={`w-full h-9 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 ${
              fieldErrors.quantity 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          >
            <option value={1}>1 Ticket - €50.00</option>
            <option value={2}>2 Tickets - €100.00</option>
            <option value={3}>3 Tickets - €150.00</option>
            <option value={4}>4 Tickets - €200.00</option>
            <option value={5}>5 Tickets - €250.00</option>
            <option value={6}>6 Tickets - €300.00</option>
            <option value={7}>7 Tickets - €350.00</option>
            <option value={8}>8 Tickets - €400.00</option>
            <option value={9}>9 Tickets - €450.00</option>
            <option value={10}>10 Tickets - €500.00</option>
          </select>
          {fieldErrors.quantity && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-red-500" />
              <p className="text-xs text-red-500">{fieldErrors.quantity}</p>
            </div>
          )}
          {!fieldErrors.quantity && (
            <p className="text-xs text-gray-500 mt-1">
              All tickets will be under your name with unique ticket numbers
            </p>
          )}
        </div>
      )}
    </div>
  )
}
