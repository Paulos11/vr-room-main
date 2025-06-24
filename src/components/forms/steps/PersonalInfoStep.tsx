// FIXED: src/components/forms/steps/PersonalInfoStep.tsx - Tiered pricing support
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, AlertCircle, Tag, TrendingDown } from 'lucide-react'
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

  const getFieldClasses = (fieldName: string) => {
    const hasError = fieldErrors[fieldName]
    return `h-9 ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`
  }

  // ✅ FIXED: Calculate pricing with tiered pricing support
  const calculatePricing = () => {
    if (formData.isEmsClient) {
      return { 
        original: 0, 
        tierSavings: 0,
        couponDiscount: 0, 
        final: 0, 
        showFree: true 
      }
    }

    // Calculate original prices vs tiered prices
    let originalTotal = 0
    let tierDiscountedTotal = 0
    
    formData.selectedTickets.forEach(ticket => {
      if (ticket.packageInfo) {
        // This is a package/tier ticket
        const regularPrice = ticket.packageInfo.pricePerTicket * ticket.packageInfo.ticketCount * ticket.quantity
        originalTotal += regularPrice
        tierDiscountedTotal += ticket.priceInCents
      } else {
        // Regular single ticket
        originalTotal += ticket.priceInCents
        tierDiscountedTotal += ticket.priceInCents
      }
    })
    
    const tierSavings = Math.max(0, originalTotal - tierDiscountedTotal)
    const couponDiscount = formData.appliedDiscount || 0
    const finalTotal = Math.max(0, tierDiscountedTotal - couponDiscount)

    return {
      original: originalTotal,
      tierSavings: tierSavings,
      couponDiscount: couponDiscount,
      final: finalTotal,
      showFree: false
    }
  }

  const pricing = calculatePricing()
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`

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
            className={`${getFieldClasses('firstName')} placeholder-gray-500`} 
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
            className={`${getFieldClasses('lastName')} placeholder-gray-500`} 
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
          className={`${getFieldClasses('email')} placeholder-gray-500`} 
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
          className={`${getFieldClasses('phone')} placeholder-gray-500`} 
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
          className={`${getFieldClasses('idCardNumber')} placeholder-gray-500`} 
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

      {/* ✅ ENHANCED: Ticket Summary with Tiered Pricing Support */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium mb-2 text-blue-900 flex items-center gap-2">
            <User className="h-4 w-4" />
            Order Summary for {formData.firstName || 'Customer'}
          </h4>
          
          <div className="space-y-2">
            {/* ✅ IMPROVED: Ticket Details with Package Info */}
            <div className="space-y-1">
              {formData.selectedTickets.map(ticket => (
                <div key={ticket.ticketTypeId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {ticket.name} × {ticket.quantity}
                      {ticket.packageInfo && (
                        <span className="text-green-600 text-xs block">
                          ({ticket.packageInfo.ticketCount * ticket.quantity} tickets total)
                        </span>
                      )}
                    </span>
                    <span className="font-medium">
                      {pricing.showFree ? 'FREE' : formatPrice(ticket.priceInCents)}
                    </span>
                  </div>
                  
                  {/* Show package savings */}
                  {ticket.packageInfo && ticket.packageInfo.savingsAmount > 0 && (
                    <div className="text-xs text-green-600 flex items-center gap-1 ml-2">
                      <TrendingDown className="h-3 w-3" />
                      Package discount: €{((ticket.packageInfo.savingsAmount * ticket.quantity) / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ✅ ENHANCED: Pricing Breakdown with Tier Savings */}
            {!pricing.showFree && (
              <div className="border-t pt-2 mt-2 space-y-1">
                {/* Show original price if there are tier savings */}
                {pricing.tierSavings > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Regular price:</span>
                    <span className="line-through">{formatPrice(pricing.original)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {pricing.tierSavings > 0 ? 'After volume discounts:' : 'Subtotal:'}
                  </span>
                  <span>{formatPrice(pricing.original - pricing.tierSavings)}</span>
                </div>
                
                {/* Show tier savings */}
                {pricing.tierSavings > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Volume savings:
                    </span>
                    <span className="font-medium">-{formatPrice(pricing.tierSavings)}</span>
                  </div>
                )}
                
                {/* Show coupon discount */}
                {pricing.couponDiscount > 0 && formData.couponCode && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Coupon ({formData.couponCode}):
                    </span>
                    <span className="font-medium">-{formatPrice(pricing.couponDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    {formatPrice(pricing.final)}
                  </span>
                </div>

                {/* ✅ ENHANCED: Combined Savings Highlight */}
                {(pricing.tierSavings > 0 || pricing.couponDiscount > 0) && (
                  <div className="text-center p-2 bg-green-100 border border-green-300 rounded mt-2">
                    <p className="text-sm font-medium text-green-800">
                      🎉 Total saved: {formatPrice(pricing.tierSavings + pricing.couponDiscount)}!
                    </p>
                    {pricing.tierSavings > 0 && pricing.couponDiscount > 0 && (
                      <p className="text-xs text-green-700 mt-1">
                        Volume: €{(pricing.tierSavings / 100).toFixed(2)} + 
                        Coupon: €{(pricing.couponDiscount / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* EMS Customer Total */}
            {pricing.showFree && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-base">
                  <span>Total:</span>
                  <span className="text-green-600">FREE</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-blue-700 mt-2">
            Need to change tickets? Go back to the previous step.
          </p>
        </div>
      )}
    </div>
  )
}