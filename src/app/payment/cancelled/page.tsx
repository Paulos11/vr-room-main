// src/app/payment/cancelled/page.tsx - Updated with real data
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, CreditCard, Home, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface RegistrationData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  finalAmount: number
  originalAmount: number
  discountAmount: number
  appliedCouponCode?: string
  isEmsClient: boolean
  ticketCount: number
  status: string
}

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('id')
  
  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (registrationId) {
      fetchRegistration()
    } else {
      router.push('/register')
    }
  }, [registrationId, router])

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`)
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
          isEmsClient: result.data.isEmsClient,
          ticketCount: result.data.ticketCount || 1,
          status: result.data.status
        })
      } else {
        setError('Registration not found')
      }
    } catch (error) {
      console.error('Error fetching registration:', error)
      setError('Failed to load registration details')
    } finally {
      setLoading(false)
    }
  }

  const handleRetryPayment = () => {
    if (registrationId) {
      router.push(`/payment?id=${registrationId}`)
    }
  }

  const formatPrice = (priceInCents: number) => {
    return `€${(priceInCents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
              <span className="ml-2 text-gray-600">Loading registration details...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card>
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
              <CardTitle className="text-red-700">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{error || 'Registration not found'}</p>
              <Link href="/register">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Registration
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">
              Payment Cancelled
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2 text-sm">Customer Details</h3>
              <div className="text-xs text-gray-700 space-y-1">
                <p><span className="font-medium">Name:</span> {registration.firstName} {registration.lastName}</p>
                <p><span className="font-medium">Email:</span> {registration.email}</p>
                <p><span className="font-medium">Phone:</span> {registration.phone}</p>
                <p><span className="font-medium">Tickets:</span> {registration.ticketCount}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="p-3 border rounded-lg bg-blue-50">
              <h3 className="font-medium mb-2 text-sm">Payment Details</h3>
              <div className="text-xs text-blue-800 space-y-1">
                {registration.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Original Amount:</span>
                      <span>{formatPrice(registration.originalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({registration.appliedCouponCode}):</span>
                      <span>-{formatPrice(registration.discountAmount)}</span>
                    </div>
                    <hr className="border-blue-200" />
                  </>
                )}
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>{formatPrice(registration.finalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Cancellation Message */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Your payment was cancelled and no charges were made to your card.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Registration for {registration.firstName} {registration.lastName} is still pending payment.
              </p>
            </div>

            {/* What Happened */}
            <div className="p-3 border rounded-lg bg-yellow-50">
              <h3 className="font-medium mb-2 text-sm">What happened?</h3>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• You cancelled the payment process</li>
                <li>• Your registration is saved and still valid</li>
                <li>• No payment was processed</li>
                <li>• You can complete payment anytime</li>
              </ul>
            </div>

            {/* Registration Status */}
            <div className="p-3 border rounded-lg bg-blue-50">
              <h3 className="font-medium mb-2 text-sm">Your Registration</h3>
              <p className="text-xs text-blue-800">
                Your registration details are saved. Complete your payment to receive 
                your {registration.isEmsClient ? 'complimentary VIP tickets' : 'tickets'} and secure your access to the trade fair.
              </p>
            </div>

            {/* Benefits */}
            <div className="p-3 border rounded-lg bg-green-50">
              <h3 className="font-medium mb-2 text-sm">
                {registration.isEmsClient ? 'EMS VIP Benefits' : 'Event Access Benefits'}
              </h3>
              <ul className="text-xs text-green-800 space-y-1">
                {registration.isEmsClient ? (
                  <>
                    <li>• Complimentary VIP access</li>
                    <li>• Exclusive networking areas</li>
                    <li>• Priority consultations</li>
                    <li>• Premium refreshments</li>
                  </>
                ) : (
                  <>
                    <li>• Full event access</li>
                    <li>• Networking opportunities</li>
                    <li>• Expert consultations</li>
                    <li>• Digital ticket delivery</li>
                  </>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!registration.isEmsClient && (
                <Button 
                  onClick={handleRetryPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Complete Payment ({formatPrice(registration.finalAmount)})
                </Button>
              )}
              
              <Link href="/" className="block">
                <Button className="w-full" variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Help Text */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Need help? Contact us at info@ems.com.mt or +356 2755 5597
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}