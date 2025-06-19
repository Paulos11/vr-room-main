
// Payment Page Component
// src/app/payment/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, Shield, CheckCircle, Clock } from 'lucide-react'

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('id')
  
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (registrationId) {
      fetchRegistration()
    }
  }, [registrationId])

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`)
      const result = await response.json()
      
      if (result.success) {
        setRegistration(result.data)
      } else {
        router.push('/register')
      }
    } catch (error) {
      console.error('Error fetching registration:', error)
      router.push('/register')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setProcessing(true)
    
    try {
      // Create Stripe payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          amount: 5000, // €50.00 in cents
          currency: 'eur'
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to Stripe Checkout or handle payment
        window.location.href = result.checkoutUrl
      }
    } catch (error) {
      console.error('Payment error:', error)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Registration Not Found</h2>
            <p className="text-gray-600 mb-4">The registration could not be found.</p>
            <Button onClick={() => router.push('/register')}>
              Back to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <CreditCard className="h-6 w-6" />
              Complete Your VIP Registration
            </CardTitle>
            <CardDescription className="text-center">
              Secure payment to confirm your VIP access
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Registration Summary */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Registration Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium">{registration.firstName} {registration.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{registration.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Registration ID:</span>
                  <span className="font-mono text-xs">{registration.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="secondary">Payment Pending</Badge>
                </div>
              </div>
            </div>

            {/* VIP Benefits */}
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Your VIP Access Includes
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Access to exclusive VIP areas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Complimentary refreshments and snacks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Priority access to product demonstrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Direct consultation with EMS experts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  VIP networking opportunities
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Instant ticket delivery via email
                </li>
              </ul>
            </div>

            {/* Payment Summary */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-3">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>VIP Access Fee</span>
                  <span>€50.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee</span>
                  <span>€0.00</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>€50.00</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 border rounded-lg bg-green-50 flex items-start gap-2">
              <Shield className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Secure Payment</p>
                <p>Your payment is processed securely through Stripe. We don't store your card details.</p>
              </div>
            </div>

            {/* Payment Button */}
            <Button 
              onClick={handlePayment}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay €50.00 - Get Instant VIP Access
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By proceeding with payment, you agree to our terms and conditions.
              Your VIP ticket will be emailed to you immediately after successful payment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}