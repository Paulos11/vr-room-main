// src/app/payment/cancelled/page.tsx - VR Room Malta styled
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, CreditCard, Home, Loader2, Gamepad2, AlertTriangle, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface VRRegistrationData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  finalAmount: number
  originalAmount: number
  discountAmount: number
  appliedCouponCode?: string
  sessionCount: number
  status: string
  bookedExperiences?: Array<{
    experienceName: string
    quantity: number
    totalPrice: number
  }>
}

export default function VRPaymentCancelledPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('id')
  const isVRBooking = searchParams.get('vr_booking') === 'true'
  
  const [registration, setRegistration] = useState<VRRegistrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (registrationId) {
      fetchRegistration()
    } else {
      router.push('/book')
    }
  }, [registrationId, router])

  const fetchRegistration = useCallback(async () => {
    if (!registrationId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/vr-registrations/${registrationId}`)
      const result = await response.json()
      
      if (result.success) {
        setRegistration({
          id: result.data.id,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          phone: result.data.phone,
          finalAmount: result.data.finalAmount,
          originalAmount: result.data.originalAmount,
          discountAmount: result.data.discountAmount,
          appliedCouponCode: result.data.appliedCouponCode,
          sessionCount: result.data.sessionCount || 1,
          status: result.data.status,
          bookedExperiences: result.data.bookedExperiences || []
        })
      } else {
        setError('VR booking not found')
      }
    } catch (error) {
      console.error('Error fetching VR registration:', error)
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }, [registrationId])

  const handleRetryPayment = useCallback(() => {
    if (registrationId) {
      router.push(`/payment?id=${registrationId}&vr_booking=true`)
    }
  }, [registrationId, router])

  const formatPrice = useCallback((priceInCents: number) => {
    return `€${(priceInCents / 100).toFixed(2)}`
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-30"
          style={{ backgroundImage: "url('/vr-background.jpg')" }}
        />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-[#01AEED] mb-4" />
              <span className="text-gray-600 text-lg">Loading booking details...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-30"
          style={{ backgroundImage: "url('/vr-background.jpg')" }}
        />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20">
            <CardHeader className="text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-xl text-red-700">Booking Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{error || 'VR booking not found'}</p>
              <Link href="/book">
                <Button className="w-full bg-[#01AEED] hover:bg-[#01AEED]/90">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to VR Booking
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isFreeBooking = registration.finalAmount === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-30"
        style={{ backgroundImage: "url('/vr-background.jpg')" }}
      />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700 mb-2">
              Payment Cancelled
            </CardTitle>
            <p className="text-gray-600">
              Your VR booking payment was cancelled
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* VR Booking Info */}
            <div className="p-4 border border-[#01AEED]/20 rounded-xl bg-gradient-to-r from-[#01AEED]/5 to-blue-50">
              <h3 className="font-semibold mb-3 text-[#262624] flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-[#01AEED]" />
                VR Booking Details
              </h3>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Guest:</span>
                  <span>{registration.firstName} {registration.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="text-xs break-all">{registration.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{registration.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">VR Sessions:</span>
                  <span>{registration.sessionCount}</span>
                </div>
              </div>
            </div>

            {/* VR Experiences */}
            {registration.bookedExperiences && registration.bookedExperiences.length > 0 && (
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                <h3 className="font-semibold mb-3 text-[#262624]">Selected VR Experiences</h3>
                <div className="space-y-2">
                  {registration.bookedExperiences.map((experience, index) => (
                    <div key={index} className="flex justify-between text-sm">
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

            {/* Payment Summary */}
            {!isFreeBooking && (
              <div className="p-4 border border-[#01AEED]/20 rounded-xl bg-[#01AEED]/5">
                <h3 className="font-semibold mb-3 text-[#262624]">Payment Summary</h3>
                <div className="text-sm space-y-2">
                  {registration.discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-gray-700">
                        <span>Original Amount:</span>
                        <span>{formatPrice(registration.originalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({registration.appliedCouponCode}):</span>
                        <span>-{formatPrice(registration.discountAmount)}</span>
                      </div>
                      <hr className="border-[#01AEED]/20" />
                    </>
                  )}
                  <div className="flex justify-between font-semibold text-base">
                    <span className="text-[#262624]">Total Amount:</span>
                    <span className="text-[#01AEED]">{formatPrice(registration.finalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Message */}
            <div className="p-4 border border-yellow-200 rounded-xl bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Payment Cancelled</h4>
                  <p className="text-sm text-yellow-700">
                    Your payment was cancelled and no charges were made. 
                    Your VR booking is still reserved and you can complete payment anytime.
                  </p>
                </div>
              </div>
            </div>

            

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isFreeBooking && (
                <Button 
                  onClick={handleRetryPayment}
                  className="w-full bg-gradient-to-r from-[#01AEED] to-[#0090CC] hover:from-[#01AEED]/90 hover:to-[#0090CC]/90 text-white"
                  size="lg"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Complete Payment ({formatPrice(registration.finalAmount)})
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <Link href="/book">
                  <Button className="w-full" variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    New Booking
                  </Button>
                </Link>
                
                <Link href="/">
                  <Button className="w-full" variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div className="text-center p-3 bg-[#01AEED]/5 border border-[#01AEED]/20 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Need Help?</strong>
              </p>
              <p className="text-xs text-gray-600">
                Contact VR Room Malta at{' '}
                <span className="font-medium text-[#01AEED]">info@vrroommalta.com</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
               50meters from Bugibba Square, Malta
              </p>
            </div>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔒 Secure payment powered by Stripe • No charges were made to your card
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}