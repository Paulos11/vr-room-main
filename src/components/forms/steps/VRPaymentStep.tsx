// src/components/forms/steps/VRPaymentStep.tsx - FIXED subtotal display
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  Gift, 
  Gamepad2, 
  Shield, 
  Lock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react'
import { VRPaymentStepProps } from '@/types/vr-registration'
import { toast } from '@/components/ui/use-toast'

export function VRPaymentStep({ 
  registrationData, 
  onPaymentComplete, 
  isFreeOrder 
}: VRPaymentStepProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = useCallback((cents: number) => {
    // Handle undefined, null, or NaN values
    if (cents === undefined || cents === null || isNaN(cents)) {
      return '€0.00'
    }
    return `€${(cents / 100).toFixed(2)}`
  }, [])

  // ✅ FIXED: Calculate subtotal from booked experiences
  const calculateSubtotal = useCallback(() => {
    if (registrationData.bookedExperiences && registrationData.bookedExperiences.length > 0) {
      return registrationData.bookedExperiences.reduce((sum, experience) => 
        sum + (experience.totalPrice || 0), 0
      )
    }
    // Fallback to originalAmount if available
    return registrationData.originalAmount || 0
  }, [registrationData])

  // Handle free order completion using existing API
  const handleFreeOrderComplete = useCallback(async () => {
    setIsProcessing(true)
    try {
      // Use your existing create-checkout-session API for free orders too
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registrationData.id
        })
      })

      const result = await response.json()

      if (result.success) {
        if (result.isFreeOrder) {
          toast({
            title: "Free Booking Confirmed!",
            description: result.message,
          })
          // Use the redirect URL from the API response
          if (result.redirectUrl) {
            window.location.href = result.redirectUrl
          } else {
            onPaymentComplete()
          }
        } else {
          throw new Error('Expected free order but got paid order')
        }
      } else {
        throw new Error(result.message || 'Failed to complete free booking')
      }
    } catch (error) {
      console.error('Free order completion error:', error)
      setError('Failed to complete booking. Please try again.')
      toast({
        title: "Error",
        description: "Failed to complete booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [registrationData.id, onPaymentComplete])

  // Handle Stripe payment using existing API
  const handleStripePayment = useCallback(async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Use your existing create-checkout-session API
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registrationData.id
        })
      })

      const result = await response.json()

      if (result.success) {
        if (result.isFreeOrder) {
          // Handle free order completion
          toast({
            title: "Free Booking Confirmed!",
            description: result.message,
          })
          // Redirect to success page for free orders
          window.location.href = result.redirectUrl
        } else if (result.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = result.checkoutUrl
        } else {
          throw new Error('No checkout URL received')
        }
      } else {
        throw new Error(result.message || 'Failed to create payment session')
      }
    } catch (error) {
      console.error('Payment creation error:', error)
      setError('Failed to initialize payment. Please try again.')
      setIsProcessing(false)
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      })
    }
  }, [registrationData.id])

  if (isFreeOrder) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-semibold flex items-center justify-center gap-2 text-[#262624]">
            <Gift className="h-6 w-6 text-green-500" />
            Complete Your Free VR Booking
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Your VR experience is completely free! Just confirm to complete your booking.
          </p>
        </div>

        {/* Free Booking Summary */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Free VR Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Guest:</span>
                <p className="font-medium text-gray-800">
                  {registrationData.firstName} {registrationData.lastName}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium text-gray-800 break-all">
                  {registrationData.email}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-medium text-gray-800">
                  {registrationData.phone}
                </p>
              </div>
              <div>
                <span className="text-gray-600">VR Sessions:</span>
                <p className="font-medium text-gray-800">
                  {registrationData.sessionCount}
                </p>
              </div>
            </div>

            {/* VR Experiences */}
            {registrationData.bookedExperiences && registrationData.bookedExperiences.length > 0 && (
              <div className="border-t border-green-200 pt-3">
                <span className="text-sm text-gray-600 mb-2 block">VR Experiences:</span>
                <div className="space-y-2">
                  {registrationData.bookedExperiences.map((experience, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {experience.experienceName} × {experience.quantity}
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        FREE
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Free Total */}
            <div className="border-t border-green-200 pt-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-green-800">Total:</span>
                <span className="text-green-600 text-2xl">FREE</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Button */}
        <Button 
          onClick={handleFreeOrderComplete}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Confirming Booking...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Confirm Free VR Booking
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const subtotalAmount = calculateSubtotal()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-semibold flex items-center justify-center gap-2 text-[#262624]">
          <CreditCard className="h-6 w-6 text-[#01AEED]" />
          Secure Payment
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Complete your VR booking with secure payment powered by Stripe
        </p>
      </div>

      {/* Payment Summary */}
      <Card className="border-2 border-[#01AEED]/20 bg-gradient-to-r from-[#01AEED]/5 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-[#262624] flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-[#01AEED]" />
            VR Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Guest:</span>
              <p className="font-medium text-gray-800">
                {registrationData.firstName} {registrationData.lastName}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <p className="font-medium text-gray-800 break-all">
                {registrationData.email}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <p className="font-medium text-gray-800">
                {registrationData.phone}
              </p>
            </div>
            <div>
              <span className="text-gray-600">VR Sessions:</span>
              <p className="font-medium text-gray-800">
                {registrationData.sessionCount}
              </p>
            </div>
          </div>

          {/* VR Experiences */}
          {registrationData.bookedExperiences && registrationData.bookedExperiences.length > 0 && (
            <div className="border-t border-[#01AEED]/20 pt-3">
              <span className="text-sm text-gray-600 mb-2 block">VR Experiences:</span>
              <div className="space-y-2">
                {registrationData.bookedExperiences.map((experience, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      {experience.experienceName} × {experience.quantity}
                    </span>
                    <span className="font-medium text-[#01AEED]">
                      {formatPrice(experience.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ FIXED: Payment Breakdown with correct subtotal */}
          <div className="border-t border-[#01AEED]/20 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-800">{formatPrice(subtotalAmount)}</span>
            </div>
            
            {registrationData.discountAmount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({registrationData.appliedCouponCode}):</span>
                  <span>-{formatPrice(registrationData.discountAmount)}</span>
                </div>
                {/* ✅ NEW: Show coupon applied confirmation */}
                <div className="flex items-center gap-1 text-xs text-green-600 ml-2">
                  <CheckCircle className="h-3 w-3" />
                  <span>Coupon "{registrationData.appliedCouponCode}" applied - You saved {formatPrice(registrationData.discountAmount)}!</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-lg border-t border-[#01AEED]/20 pt-2">
              <span className="text-[#262624]">Total:</span>
              <span className="text-[#01AEED]">{formatPrice(registrationData.finalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-700">Secure Payment</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Lock className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-700">SSL Encrypted</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <CreditCard className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-700">Stripe Powered</span>
        </div>
      </div>

      {/* Payment Button */}
      <Button 
        onClick={handleStripePayment}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-[#01AEED] to-[#0090CC] hover:from-[#01AEED]/90 hover:to-[#0090CC]/90 text-white py-6 text-lg"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay {formatPrice(registrationData.finalAmount)}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* VR Room Info */}
      <div className="p-4 bg-[#01AEED]/5 border border-[#01AEED]/20 rounded-xl">
        <h4 className="text-sm font-semibold mb-2 text-[#262624] flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
          After Payment
        </h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• Instant email confirmation with booking details</li>
          <li>• Visit VR Room Malta in Bugibba Square</li>
          <li>• Arrive 10 minutes before your session</li>
          <li>• Bring your confirmation email or booking reference</li>
        </ul>
      </div>

      {/* Trust Indicators */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-2">
          🔒 Your payment is secured with 256-bit SSL encryption
        </p>
        <p className="text-xs text-gray-400">
          Powered by Stripe • Trusted by millions worldwide
        </p>
      </div>
    </div>
  )
}