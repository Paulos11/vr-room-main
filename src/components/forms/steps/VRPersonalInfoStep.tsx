// src/components/forms/steps/VRPersonalInfoStep.tsx - Clean VR personal info
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, AlertCircle, Gamepad2, Info } from 'lucide-react'
import { VRStepProps } from '@/types/vr-registration'
import { validateVRField } from '@/utils/vrFormValidation'

export function VRPersonalInfoStep({ formData, onUpdate }: VRStepProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (field: string, value: string) => {
    // Update the form data
    onUpdate(field as keyof typeof formData, value)

    // Validate the field in real-time
    const validation = validateVRField(field, value)
    setFieldErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? '' : validation.error || ''
    }))
  }

  const getFieldClasses = (fieldName: string) => {
    const hasError = fieldErrors[fieldName]
    return `h-10 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-[#01AEED]/30 focus:border-[#01AEED]'}`
  }

  const calculatePricing = () => {
    const subtotal = formData.selectedTickets.reduce((sum, ticket) => 
      sum + ticket.priceInCents, 0
    )
    const discount = formData.appliedDiscount || 0
    const final = Math.max(0, subtotal - discount)

    return { subtotal, discount, final }
  }

  const pricing = calculatePricing()
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2 text-[#262624]">
          <User className="h-5 w-5 text-[#01AEED]" />
          Your Information
        </h3>
        <p className="text-sm text-gray-600">Required for your VR session booking</p>
      </div>
             
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName" className="text-sm font-medium text-[#262624]">
            First Name *
          </Label>
          <Input 
            id="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            className={`${getFieldClasses('firstName')} placeholder-gray-400`} 
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
          <Label htmlFor="lastName" className="text-sm font-medium text-[#262624]">
            Last Name *
          </Label>
          <Input 
            id="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            className={`${getFieldClasses('lastName')} placeholder-gray-400`} 
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
        <Label htmlFor="email" className="text-sm font-medium text-[#262624]">
          Email Address *
        </Label>
        <Input 
          id="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          className={`${getFieldClasses('email')} placeholder-gray-400`} 
          required
        />
        {fieldErrors.email && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <p className="text-xs text-red-500">{fieldErrors.email}</p>
          </div>
        )}
        {!fieldErrors.email && (
          <div className="mt-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="h-3 w-3" />
              We'll send your booking confirmation to this email
            </p>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm font-medium text-[#262624]">
          Phone Number *
        </Label>
        <Input 
          id="phone"
          type="tel"
          placeholder="+356 1234 5678"
          value={formData.phone}
          onChange={(e) => handleFieldChange('phone', e.target.value)}
          className={`${getFieldClasses('phone')} placeholder-gray-400`} 
          required
        />
        {fieldErrors.phone && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <p className="text-xs text-red-500">{fieldErrors.phone}</p>
          </div>
        )}
        {!fieldErrors.phone && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Info className="h-3 w-3" />
            For booking confirmations and session reminders
          </p>
        )}
      </div>

      {/* VR Session Summary */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-[#01AEED]/5 to-blue-50 border border-[#01AEED]/20 rounded-xl">
          <h4 className="text-base font-semibold mb-3 text-[#262624] flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-[#01AEED]" />
            Booking Summary for {formData.firstName || 'Guest'}
          </h4>
          
          <div className="space-y-3">
            {/* Session Details */}
            <div className="space-y-2">
              {formData.selectedTickets.map(ticket => {
                // Mock session details - you might want to fetch these from the experience data
                
                return (
                  <div key={ticket.ticketTypeId} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-[#262624]">
                          {ticket.name} × {ticket.quantity}
                        </span>
                        
                      </div>
                      <span className="text-sm font-semibold text-[#01AEED]">
                        {formatPrice(ticket.priceInCents)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pricing Breakdown */}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-[#262624]">{formatPrice(pricing.subtotal)}</span>
              </div>
              
              {pricing.discount > 0 && formData.couponCode && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({formData.couponCode}):</span>
                  <span>-{formatPrice(pricing.discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span className="text-[#262624]">Total:</span>
                <span className="text-[#01AEED] text-lg">{formatPrice(pricing.final)}</span>
              </div>

              {pricing.discount > 0 && (
                <div className="text-center p-2 bg-green-100 border border-green-300 rounded-lg mt-2">
                  <p className="text-sm font-medium text-green-800">
                    🎉 You saved {formatPrice(pricing.discount)}!
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-[#01AEED] mt-3 text-center">
            Need to change experiences? Go back to the previous step.
          </p>
        </div>
      )}

    </div>
  )
}