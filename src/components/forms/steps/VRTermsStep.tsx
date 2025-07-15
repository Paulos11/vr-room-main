// src/components/forms/steps/VRTermsStep.tsx - VR-specific terms
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FileText, Shield, Gamepad2, AlertTriangle, MapPin, Clock } from 'lucide-react'
import { VRStepProps } from '@/types/vr-registration'

export function VRTermsStep({ formData, onUpdate }: VRStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2 text-[#262624]">
          <FileText className="h-5 w-5 text-[#01AEED]" />
          Terms & Conditions
        </h3>
        <p className="text-sm text-gray-600">Please review and accept to complete your booking</p>
      </div>

      <div className="space-y-4">
        {/* VR Experience Terms */}
        <div className="flex items-start space-x-3 p-4 border border-[#01AEED]/20 rounded-xl bg-[#01AEED]/5">
          <Checkbox
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => onUpdate('acceptTerms', checked)}
            className="mt-1 border-[#01AEED] data-[state=checked]:bg-[#01AEED]"
          />
          <div className="space-y-1">
            <Label className="text-sm font-medium text-[#262624]">
              I accept the VR Experience Terms & Conditions *
            </Label>
            <p className="text-xs text-gray-600">
              By checking this box, I agree to the VR safety guidelines, age requirements, 
              session rules, and understand the physical nature of VR experiences. 
              I acknowledge potential motion sickness and take responsibility for my participation.
            </p>
          </div>
        </div>

        {/* Privacy Policy */}
        <div className="flex items-start space-x-3 p-4 border border-[#262624]/20 rounded-xl bg-[#262624]/5">
          <Checkbox
            checked={formData.acceptPrivacyPolicy}
            onCheckedChange={(checked) => onUpdate('acceptPrivacyPolicy', checked)}
            className="mt-1 border-[#262624] data-[state=checked]:bg-[#262624]"
          />
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-1 text-[#262624]">
              <Shield className="h-3 w-3" />
              I accept the Privacy Policy *
            </Label>
            <p className="text-xs text-gray-600">
              Your information will only be used for booking management, session coordination, 
              and safety purposes. We may capture photos/videos during sessions for promotional use 
              (you can opt-out at the venue).
            </p>
          </div>
        </div>

        {/* VR Room Information */}
        <div className="p-4 bg-gradient-to-r from-[#01AEED]/10 to-[#262624]/10 border border-gray-200 rounded-xl">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#262624]">
            <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
            VR Room Malta - Important Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-[#01AEED]" />
                <span><strong>Location:</strong> 50m from Bugibba Square</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-[#01AEED]" />
                <span><strong>Opening:</strong> 9:00am - 8:00pm</span>
              </div>
            </div>
            <div className="space-y-1">
              <p>• Arrive 10 minutes before your session</p>
              <p>• Sessions are non-refundable but transferable</p>
              <p>• Bring a tickets with you</p>
            </div>
          </div>
        </div>


        {/* Session Policies */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <h4 className="text-sm font-semibold mb-2 text-gray-800">Session Policies:</h4>
          <div className="text-xs text-gray-700 space-y-1">
            <p>• Sessions must be used within 30 days of purchase</p>
            <p>• Late arrivals may result in shortened sessions</p>
            <p>• Group bookings require all participants to arrive together</p>
            <p>• Photography/filming may occur for promotional purposes</p>
            <p>• VR Room Malta reserves the right to refuse service for safety reasons</p>
            <p>• No outside food or drinks allowed in VR areas</p>
          </div>
        </div>

        {/* Booking Confirmation */}
        {formData.selectedTickets.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <h4 className="text-sm font-semibold mb-2 text-green-800 flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Ready to Experience VR?
            </h4>
            <div className="text-xs text-green-700">
              <p className="mb-2">
                You've selected {formData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0)} VR session{formData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0) > 1 ? 's' : ''} 
                at VR Room Malta. After payment, you'll receive:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Email confirmation with booking details</li>
                <li>• QR code for easy check-in</li>
                <li>• Detailed location and parking information</li>
                <li>• Pre-session safety briefing materials</li>
              </ul>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="text-center p-3 bg-[#01AEED]/5 border border-[#01AEED]/20 rounded-lg">
          <p className="text-xs text-gray-600">
            Questions about your booking? Contact us at{' '}
            <span className="font-medium text-[#01AEED]">info@vrroommalta.com</span>{' '}
            or visit us at VR Room Malta, Bugibba
          </p>
        </div>
      </div>
    </div>
  )
}