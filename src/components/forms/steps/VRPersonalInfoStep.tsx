// src/components/forms/steps/VRPersonalInfoStep.tsx - Mobile-first responsive design
'use client'

import { useState, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, AlertCircle, Gamepad2, Info, Mail, Phone } from 'lucide-react'
import { VRStepProps } from '@/types/vr-registration'
import { validateVRField } from '@/utils/vrFormValidation'

export function VRPersonalInfoStep({ formData, onUpdate }: VRStepProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Memoized pricing calculations for performance - FIX NaN issues
  const pricing = useMemo(() => {
    const subtotal = formData.selectedTickets.reduce((sum, ticket) => 
      sum + (ticket.priceInCents || 0), 0
    )
    const discount = formData.appliedDiscount || 0
    const final = Math.max(0, subtotal - discount)

    return { subtotal, discount, final }
  }, [formData.selectedTickets, formData.appliedDiscount])

  const formatPrice = useCallback((cents: number) => {
    if (isNaN(cents) || cents === null || cents === undefined) {
      return '€0.00'
    }
    return `€${(cents / 100).toFixed(2)}`
  }, [])

  const handleFieldChange = useCallback((field: string, value: string) => {
    // Update the form data
    onUpdate(field as keyof typeof formData, value)

    // Validate the field in real-time
    const validation = validateVRField(field, value)
    setFieldErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? '' : validation.error || ''
    }))
  }, [onUpdate])

  const getFieldClasses = useCallback((fieldName: string) => {
    const hasError = fieldErrors[fieldName]
    return `h-10 sm:h-11 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-[#01AEED]/30 focus:border-[#01AEED]'}`
  }, [fieldErrors])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-semibold flex items-center justify-center gap-2 text-[#262624]">
          <User className="h-5 w-5 text-[#01AEED]" />
          Your Information
        </h3>
        <p className="text-sm text-gray-600 mt-1">Required for your VR session booking</p>
      </div>
             
      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name Fields - Stacked on mobile, side by side on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-[#262624] mb-1.5 block">
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
              <div className="flex items-center gap-1 mt-1.5">
                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
              </div>
            )}
          </div>
                   
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-[#262624] mb-1.5 block">
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
              <div className="flex items-center gap-1 mt-1.5">
                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-[#262624] mb-1.5 block">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#01AEED]" />
              Email Address *
            </div>
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
            <div className="flex items-center gap-1 mt-1.5">
              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            </div>
          )}
          {!fieldErrors.email && (
            <div className="mt-1.5">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-3 w-3 flex-shrink-0" />
                We'll send your booking confirmation to this email
              </p>
            </div>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-[#262624] mb-1.5 block">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#01AEED]" />
              Phone Number *
            </div>
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
            <div className="flex items-center gap-1 mt-1.5">
              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{fieldErrors.phone}</p>
            </div>
          )}
          {!fieldErrors.phone && (
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <Info className="h-3 w-3 flex-shrink-0" />
              For booking confirmations and session reminders
            </p>
          )}
        </div>
      </div>

      {/* VR Session Summary */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-3 sm:p-4 bg-gradient-to-r from-[#01AEED]/5 to-blue-50 border border-[#01AEED]/20 rounded-lg sm:rounded-xl">
          <h4 className="text-base sm:text-lg font-semibold mb-3 text-[#262624] flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#01AEED]" />
            Booking Summary{formData.firstName && ` for ${formData.firstName}`}
          </h4>
          
          <div className="space-y-3">
            {/* Session Details - Mobile Optimized */}
            <div className="space-y-2">
              {formData.selectedTickets.map(ticket => (
                <div key={ticket.ticketTypeId} className="space-y-1">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[#262624] block truncate">
                          {ticket.name}
                        </span>
                        <span className="text-xs text-gray-600">
                          Quantity: {ticket.quantity}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[#01AEED] ml-2">
                        {formatPrice(ticket.priceInCents)}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex justify-between items-start">
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
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="border-t pt-3 space-y-1.5">
              {/* Mobile Pricing Layout */}
              <div className="block sm:hidden space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-[#262624]">{formatPrice(pricing.subtotal)}</span>
                </div>
                
                {pricing.discount > 0 && formData.couponCode && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(pricing.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-base border-t pt-1.5">
                  <span className="text-[#262624]">Total:</span>
                  <span className="text-[#01AEED] text-lg">{formatPrice(pricing.final)}</span>
                </div>
              </div>

              {/* Desktop Pricing Layout */}
              <div className="hidden sm:block space-y-1">
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
              </div>

              {/* Savings Highlight */}
              {pricing.discount > 0 && (
                <div className="text-center p-2 bg-green-100 border border-green-300 rounded-lg mt-2">
                  <p className="text-sm font-medium text-green-800">
                    🎉 You saved {formatPrice(pricing.discount)}!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Change Notice */}
          <div className="mt-3 p-2 bg-[#01AEED]/10 border border-[#01AEED]/20 rounded-lg">
            <p className="text-xs text-[#01AEED] text-center">
              Need to change experiences? Go back to the previous step.
            </p>
          </div>
        </div>
      )}

      {/* Contact Information Notice */}
      <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl">
        <h4 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
          <Info className="h-4 w-4 text-[#01AEED]" />
          Important Information
        </h4>
        <div className="text-xs sm:text-sm text-gray-700 space-y-1">
          <p>• Your contact information is used only for booking management</p>
          <p>• We'll send confirmation and reminder messages</p>
          <p>• All data is protected according to our privacy policy</p>
          <p>• You can update your information anytime by contacting us</p>
        </div>
      </div>

      {/* Mobile-Specific Tips */}
      <div className="block sm:hidden p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-800">
          <p className="font-medium mb-1">💡 Pro Tips:</p>
          <ul className="space-y-0.5 ml-3">
            <li>• Double-check your email for typos</li>
            <li>• Include country code for international numbers</li>
            <li>• Make sure you can receive SMS messages</li>
          </ul>
        </div>
      </div>
    </div>
  )
}