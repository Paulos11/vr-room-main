// src/components/forms/steps/VRTermsStep.tsx - VR-specific terms
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FileText, Shield, Gamepad2, AlertTriangle, MapPin, Clock, ExternalLink } from 'lucide-react'
import { VRStepProps } from '@/types/vr-registration'
import Link from 'next/link'

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
                <span><strong>Opening:</strong> 6:30pm - 11:00pm</span>
              </div>
            </div>
            <div className="space-y-1">
              <p>• Arrive 10 minutes before your session</p>
              <p>• Sessions are non-refundable but transferable</p>
              <p>• Bring a tickets with you</p>
            </div>
          </div>
        </div>

        {/* Links to Detailed Information */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <h4 className="text-sm font-semibold mb-3 text-gray-800">Need More Information?</h4>
          <div className="space-y-2">
            <Link 
              href="/session-policies" 
              className="flex items-center gap-2 text-sm text-[#01AEED] hover:text-[#01AEED]/80 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-4 w-4" />
              View Session Policies & Guidelines
              <ExternalLink className="h-3 w-3" />
            </Link>
            
            <Link 
              href="/booking-details" 
              className="flex items-center gap-2 text-sm text-[#01AEED] hover:text-[#01AEED]/80 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Gamepad2 className="h-4 w-4" />
              What to Expect After Booking
              <ExternalLink className="h-3 w-3" />
            </Link>

            <Link 
              href="/contact" 
              className="flex items-center gap-2 text-sm text-[#01AEED] hover:text-[#01AEED]/80 transition-colors"
            >
              <Shield className="h-4 w-4" />
              Contact Us for Questions
            </Link>
          </div>
        </div>

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