// src/components/forms/steps/VRTermsStep.tsx - Mobile-optimized VR terms
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FileText, Shield, Gamepad2, MapPin, Clock, ExternalLink, Info, Phone, Mail } from 'lucide-react'
import { VRStepProps } from '@/types/vr-registration'
import Link from 'next/link'

export function VRTermsStep({ formData, onUpdate }: VRStepProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-semibold flex items-center justify-center gap-2 text-[#262624]">
          <FileText className="h-5 w-5 text-[#01AEED]" />
          Terms & Conditions
        </h3>
        <p className="text-sm text-gray-600 mt-1">Please review and accept to complete your booking</p>
      </div>

      <div className="space-y-4">
        {/* VR Experience Terms */}
        <div className="flex items-start space-x-3 p-3 sm:p-4 border border-[#01AEED]/20 rounded-lg sm:rounded-xl bg-[#01AEED]/5">
          <Checkbox
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => onUpdate('acceptTerms', checked)}
            className="mt-1 border-[#01AEED] data-[state=checked]:bg-[#01AEED] flex-shrink-0"
          />
          <div className="space-y-1 min-w-0">
            <Label className="text-sm font-medium text-[#262624] cursor-pointer">
              I accept the VR Experience Terms & Conditions *
            </Label>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              By checking this box, I agree to the VR safety guidelines, age requirements, 
              session rules, and understand the physical nature of VR experiences. 
              I acknowledge potential motion sickness and take responsibility for my participation.
            </p>
          </div>
        </div>

        {/* Privacy Policy */}
        <div className="flex items-start space-x-3 p-3 sm:p-4 border border-[#262624]/20 rounded-lg sm:rounded-xl bg-[#262624]/5">
          <Checkbox
            checked={formData.acceptPrivacyPolicy}
            onCheckedChange={(checked) => onUpdate('acceptPrivacyPolicy', checked)}
            className="mt-1 border-[#262624] data-[state=checked]:bg-[#262624] flex-shrink-0"
          />
          <div className="space-y-1 min-w-0">
            <Label className="text-sm font-medium flex items-center gap-1 text-[#262624] cursor-pointer">
              <Shield className="h-3 w-3" />
              I accept the Privacy Policy *
            </Label>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Your information will only be used for booking management, session coordination, 
              and safety purposes. We may capture photos/videos during sessions for promotional use 
              (you can opt-out at the venue).
            </p>
          </div>
        </div>

        {/* VR Room Information - Mobile Optimized */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-[#01AEED]/10 to-[#262624]/10 border border-gray-200 rounded-lg sm:rounded-xl">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#262624]">
            <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
            VR Room Malta - Important Information
          </h4>
          
          {/* Mobile Layout - Stacked */}
          <div className="block sm:hidden space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-3 w-3 text-[#01AEED] flex-shrink-0" />
                <span><strong>Location:</strong> 50m from Bugibba Square</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-[#01AEED] flex-shrink-0" />
                <span><strong>Hours:</strong> 6:30pm - 11:00pm</span>
              </div>
            </div>
            <div className="text-xs space-y-1 text-gray-700">
              <p>• Arrive 10 minutes before your session</p>
              <p>• Sessions are non-refundable but transferable</p>
              <p>• Bring your booking confirmation</p>
              <p>• Comfortable clothing recommended</p>
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden sm:grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-3 w-3 text-[#01AEED]" />
                <span><strong>Location:</strong> 50m from Bugibba Square</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-[#01AEED]" />
                <span><strong>Opening:</strong> 6:30pm - 11:00pm</span>
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-700">
              <p>• Arrive 10 minutes before your session</p>
              <p>• Sessions are non-refundable but transferable</p>
              <p>• Bring your booking confirmation</p>
              <p>• Comfortable clothing recommended</p>
            </div>
          </div>
        </div>

        {/* Links to Detailed Information - Mobile Optimized */}
        <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl">
          <h4 className="text-sm font-semibold mb-3 text-gray-800">Need More Information?</h4>
          
          {/* Mobile Layout - Stacked Links */}
          <div className="block sm:hidden space-y-3">
            <Link 
              href="/session-policies" 
              className="flex items-center gap-2 text-sm text-[#01AEED] hover:text-[#01AEED]/80 transition-colors p-2 bg-white rounded-lg border border-gray-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">Session Policies & Guidelines</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </Link>
            
            <Link 
              href="/booking-details" 
              className="flex items-center gap-2 text-sm text-[#01AEED] hover:text-[#01AEED]/80 transition-colors p-2 bg-white rounded-lg border border-gray-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Gamepad2 className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">What to Expect After Booking</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </Link>

            <Link 
              href="/contact" 
              className="flex items-center gap-2 text-sm text-[#01AEED] hover:text-[#01AEED]/80 transition-colors p-2 bg-white rounded-lg border border-gray-200"
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">Contact Us for Questions</span>
            </Link>
          </div>

          {/* Desktop Layout - Regular Links */}
          <div className="hidden sm:block space-y-2">
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

    

        {/* Contact Information - Mobile Optimized */}
        <div className="p-3 sm:p-4 bg-[#01AEED]/5 border border-[#01AEED]/20 rounded-lg sm:rounded-xl">
          <h4 className="text-sm font-semibold mb-2 text-[#01AEED] flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Questions About Your Booking?
          </h4>
          
          {/* Mobile Contact Layout */}
          <div className="block sm:hidden space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3 w-3 text-[#01AEED] flex-shrink-0" />
              <a href="mailto:info@vrroommalta.com" className="text-[#01AEED] font-medium break-all">
                info@vrroommalta.com
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-3 w-3 text-[#01AEED] flex-shrink-0" />
              <span className="text-gray-600">VR Room Malta, Bugibba Square Area</span>
            </div>
          </div>

          {/* Desktop Contact Layout */}
          <div className="hidden sm:block">
            <p className="text-xs text-gray-600">
              Contact us at{' '}
              <a href="mailto:info@vrroommalta.com" className="font-medium text-[#01AEED] hover:text-[#01AEED]/80">
                info@vrroommalta.com
              </a>{' '}
              or visit us at VR Room Malta, Bugibba
            </p>
          </div>
        </div>

        {/* Final Booking Notice - Mobile Specific */}
        <div className="block sm:hidden p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-xs text-green-800">
            <p className="font-medium mb-1">🎮 Ready to Experience VR?</p>
            <p>After accepting the terms, you'll proceed to secure payment and receive instant confirmation!</p>
          </div>
        </div>
      </div>
    </div>
  )
}