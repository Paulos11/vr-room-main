// src/components/forms/steps/VRPaymentStep.tsx - Integrated payment step for VR bookings
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Clock, 
  Ticket, 
  Tag, 
  Gift, 
  Gamepad2, 
  MapPin, 
  Users, 
  Download,
  Mail,
  Loader2,
  Euro
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface VRPaymentStepProps {
  registrationData: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    originalAmount: number
    discountAmount: number
    finalAmount: number
    appliedCouponCode?: string
    sessionCount: number
    bookedExperiences?: Array<{
      experienceName: string
      quantity: number
      totalPrice: number
    }>
  }
  onPaymentComplete: () => void
  isFreeOrder: boolean
}

export function VRPaymentStep({ registrationData, onPaymentComplete, isFreeOrder }: VRPaymentStepProps) {
  const [processing, setProcessing] = useState(false)

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`

  const handlePayment = async () => {
    if (!registrationData) return
    
    setProcessing(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registrationData.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (result.isFreeOrder) {
          console.log('🎉 Free VR order completed!')
          toast({
            title: "VR Sessions Confirmed!",
            description: "Your free VR sessions have been booked successfully.",
          })
          
          // Call the completion handler
          onPaymentComplete()
        } else if (result.checkoutUrl) {
          // Redirect to Stripe for paid orders
          window.location.href = result.checkoutUrl
        } else {
          throw new Error('Invalid response from checkout API')
        }
      } else {
        toast({
          title: "Booking Error",
          description: result.message || "Failed to process VR booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('VR payment error:', error)
      toast({
        title: "Booking Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2 text-[#262624]">
          {isFreeOrder ? (
            <>
              <Gift className="h-5 w-5 text-green-600" />
              Free VR Sessions
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 text-[#01AEED]" />
              Secure Payment
            </>
          )}
        </h3>
        <p className="text-sm text-gray-600">
          {isFreeOrder 
            ? 'Complete your free VR session booking' 
            : 'Complete your VR experience with secure payment'}
        </p>
      </div>

      {/* Registration Summary */}
      <div className="p-4 border border-[#01AEED]/20 rounded-xl bg-[#01AEED]/5">
        <h4 className="font-medium mb-3 text-sm">VR Booking Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium">{registrationData.firstName} {registrationData.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium truncate ml-2">{registrationData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sessions:</span>
            <span className="font-medium">{registrationData.sessionCount} VR sessions</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <Badge variant={isFreeOrder ? "default" : "secondary"} className="text-xs">
              {isFreeOrder ? "Ready to Complete" : "Payment Required"}
            </Badge>
          </div>
        </div>
      </div>

      {/* VR Experience Details */}
      {registrationData.bookedExperiences && registrationData.bookedExperiences.length > 0 && (
        <div className="p-4 border border-[#01AEED]/20 rounded-xl bg-gradient-to-r from-[#01AEED]/5 to-cyan-50">
          <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
            Your VR Experiences
          </h4>
          <div className="space-y-2">
            {registrationData.bookedExperiences.map((experience, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">{experience.experienceName} × {experience.quantity}</span>
                <span className="font-medium">
                  {isFreeOrder ? "FREE" : formatPrice(experience.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className={`p-4 border-2 rounded-xl ${
        isFreeOrder ? 'border-green-200 bg-green-50' : 'border-[#01AEED]/20 bg-[#01AEED]/5'
      }`}>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatPrice(registrationData.originalAmount)}</span>
          </div>
          
          {registrationData.discountAmount > 0 && registrationData.appliedCouponCode && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Discount ({registrationData.appliedCouponCode}):
              </span>
              <span className="font-medium">-{formatPrice(registrationData.discountAmount)}</span>
            </div>
          )}
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">Total:</span>
              <span className={`font-bold text-2xl ${
                isFreeOrder ? 'text-green-600' : 'text-[#01AEED]'
              }`}>
                {isFreeOrder ? "FREE" : formatPrice(registrationData.finalAmount)}
              </span>
            </div>
          </div>

          {registrationData.discountAmount > 0 && (
            <div className={`text-center p-3 border rounded-lg ${
              isFreeOrder 
                ? 'bg-green-200 border-green-400' 
                : 'bg-green-100 border-green-300'
            }`}>
              <p className={`text-sm font-medium ${
                isFreeOrder ? 'text-green-900' : 'text-green-800'
              }`}>
                🎉 {isFreeOrder 
                  ? `100% Discount Applied! You saved ${formatPrice(registrationData.discountAmount)}!`
                  : `You saved ${formatPrice(registrationData.discountAmount)}!`
                }
              </p>
            </div>
          )}
        </div>
      </div>


  

      {/* Free Order Special Notice */}
      {isFreeOrder && (
        <div className="p-4 border-2 border-purple-200 rounded-xl bg-purple-50">
          <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
            <Gift className="h-4 w-4 text-purple-600" />
            100% Discount Applied!
          </h4>
          <div className="text-sm text-purple-800 space-y-1">
            {registrationData.appliedCouponCode && (
              <p>✓ Coupon "{registrationData.appliedCouponCode}" - 100% OFF</p>
            )}
            <p>✓ No payment required</p>
            <p>✓ Your VR sessions are completely FREE</p>
            <p>✓ Full VR experience access included</p>
          </div>
        </div>
      )}

      {/* Security & Trust - Only for paid orders */}
      {!isFreeOrder && (
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-start gap-3">
          <Shield className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-medium">Secure Payment by Stripe</p>
            <p>Bank-level security. We never see your card details.</p>
          </div>
        </div>
      )}

      {/* After Payment Info */}
      <div className="p-4 border border-orange-200 rounded-xl bg-orange-50">
        <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
          <Mail className="h-4 w-4 text-orange-600" />
          After {isFreeOrder ? 'Completion' : 'Payment'}
        </h4>
        <div className="space-y-1 text-sm text-orange-800">
          <p>✓ Instant email confirmation with session details</p>
          <p>✓ Downloadable PDF tickets with QR codes</p>
          <p>✓ Instructions for your VR experience</p>
          <p>✓ Direct contact for scheduling</p>
        </div>
      </div>

      {/* Payment Button */}
      <div className="pt-4">
        <Button 
          onClick={handlePayment}
          disabled={processing}
          className={`w-full text-lg py-4 ${
            isFreeOrder 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gradient-to-r from-[#01AEED] to-[#262624] hover:from-[#01AEED]/90 hover:to-[#262624]/90'
          }`}
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {isFreeOrder ? 'Completing Booking...' : 'Loading Secure Checkout...'}
            </>
          ) : isFreeOrder ? (
            <>
              <Gift className="mr-2 h-5 w-5" />
              Confirm Free VR Sessions
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay {formatPrice(registrationData.finalAmount)} Securely
            </>
          )}
        </Button>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 pt-4">
          {!isFreeOrder && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>SSL Secured</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Gamepad2 className="h-4 w-4" />
            <span>Instant Delivery</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4" />
            <span>Satisfaction Guaranteed</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isFreeOrder 
            ? 'Your free VR sessions will be confirmed and we\'ll contact you to schedule your experiences.'
            : 'You\'ll be redirected to Stripe\'s secure checkout. Your session tickets will be emailed immediately after payment.'
          }
        </p>
      </div>
    </div>
  )
}