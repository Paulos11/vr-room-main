
// src/components/forms/steps/TermsStep.tsx - Simple terms acceptance
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FileText, Shield } from 'lucide-react'
import { StepProps } from '@/types/registration'

export function TermsStep({ formData, onUpdate }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-base font-semibold flex items-center justify-center gap-2">
          <FileText className="h-4 w-4" />
          Terms & Conditions
        </h3>
        <p className="text-xs text-gray-600">Please review and accept to continue</p>
      </div>

      <div className="space-y-4">
        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3 p-4 border rounded-lg">
          <Checkbox
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => onUpdate('acceptTerms', checked)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              I accept the Terms and Conditions *
            </Label>
            <p className="text-xs text-gray-600">
              By checking this box, you agree to our event terms, including entry requirements,
              behavior guidelines, and liability limitations. Full terms available on our website.
            </p>
          </div>
        </div>

        {/* Privacy Policy */}
        <div className="flex items-start space-x-3 p-4 border rounded-lg">
          <Checkbox
            checked={formData.acceptPrivacyPolicy}
            onCheckedChange={(checked) => onUpdate('acceptPrivacyPolicy', checked)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Shield className="h-3 w-3" />
              I accept the Privacy Policy *
            </Label>
            <p className="text-xs text-gray-600">
              We will use your information solely for event management and communication.
              Your data will not be shared with third parties without consent.
            </p>
          </div>
        </div>

        {/* Event Information */}
        <div className="p-4 bg-gray-50 border rounded-lg">
          <h4 className="text-sm font-medium mb-2">Important Event Information:</h4>
          <div className="text-xs text-gray-700 space-y-1">
            <p>• Bring a valid ID card for entry verification</p>
            <p>• Event runs from June 26 - July 6</p>
            <p>• Located at Malta Fairs and Conventions Centre</p>
            <p>• Tickets are non-refundable but transferable</p>
            <p>• Photography and filming may occur during the event</p>
          </div>
        </div>

        {formData.isEmsClient && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>EMS Customer Notice:</strong> Your registration will be reviewed by our team
              for verification before final approval. You'll receive an email confirmation once approved.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}