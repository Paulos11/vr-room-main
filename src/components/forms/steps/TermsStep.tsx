// src/components/forms/steps/TermsStep.tsx - Updated with quantity display
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'
import { StepProps } from '@/types/registration'

export function TermsStep({ formData, onUpdate }: StepProps) {
  const getQuantityText = () => {
    if (formData.isEmsClient) return '1 Free VIP Ticket'
    const quantity = formData.quantity || 1
    const total = quantity * 50
    return `${quantity} VIP Ticket${quantity > 1 ? 's' : ''} - €${total.toFixed(2)}`
  }

  const getTicketDetails = () => {
    if (formData.isEmsClient) return 'Free VIP access pending admin verification'
    const quantity = formData.quantity || 1
    if (quantity === 1) return 'Single VIP ticket with unique number'
    return `${quantity} VIP tickets, each with unique number, all under your name`
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-base font-semibold flex items-center justify-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Review & Confirm
        </h3>
        <p className="text-xs text-gray-600">Final step - review your order</p>
      </div>

      {/* Registration Summary */}
      <div className="p-3 border rounded-lg bg-gray-50">
        <h4 className="font-medium mb-2 text-sm">Order Summary</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer Type:</span>
            <span className="font-medium">
              {formData.isEmsClient ? 'EMS Customer' : 'General Public'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Order:</span>
            <span className="font-medium">{getQuantityText()}</span>
          </div>
          {formData.panelInterest && (
            <div className="flex justify-between">
              <span className="text-gray-600">Solar Interest:</span>
              <span className="font-medium text-green-600">Yes</span>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Information */}
      <div className="p-3 border rounded-lg bg-blue-50">
        <h4 className="font-medium mb-1 text-sm">Ticket Details</h4>
        <p className="text-xs text-blue-800">{getTicketDetails()}</p>
        {!formData.isEmsClient && (formData.quantity || 1) > 1 && (
          <p className="text-xs text-blue-700 mt-1">
            Perfect for families, friends, or colleagues attending together.
          </p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <Checkbox 
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => onUpdate('acceptTerms', checked as boolean)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              I accept the Terms and Conditions *
            </Label>
            <p className="text-xs text-gray-600">
              By registering, you agree to our event policies and terms of service
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox 
            checked={formData.acceptPrivacyPolicy}
            onCheckedChange={(checked) => onUpdate('acceptPrivacyPolicy', checked as boolean)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              I accept the Privacy Policy *
            </Label>
            <p className="text-xs text-gray-600">
              We'll use your information to process registration and send event updates
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="p-3 border rounded-lg bg-yellow-50">
        <h4 className="font-medium mb-1 text-sm">Important</h4>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Bring valid ID matching your registration name</li>
          <li>• Each ticket holder must present their individual ticket</li>
          <li>• All tickets are non-transferable and non-refundable</li>
          {!formData.isEmsClient && (
            <li>• Payment is required to complete registration</li>
          )}
        </ul>
      </div>
    </div>
  )
}
