// src/app/payment/cancelled/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, CreditCard, Home } from 'lucide-react'
import Link from 'next/link'

interface RegistrationData {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('id')
  
  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(true)

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
        })
      }
    } catch (error) {
      console.error('Error fetching registration:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetryPayment = () => {
    if (registrationId) {
      router.push(`/payment?id=${registrationId}`)
    }
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
            {/* Cancellation Message */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Your payment was cancelled and no charges were made to your card.
              </p>
              {registration && (
                <p className="text-gray-500 text-xs mt-2">
                  Registration for {registration.firstName} {registration.lastName} is still pending payment.
                </p>
              )}
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
                your VIP ticket and secure your access to the trade fair.
              </p>
            </div>

            {/* Reminder of Benefits */}
            <div className="p-3 border rounded-lg bg-green-50">
              <h3 className="font-medium mb-2 text-sm">VIP Access Benefits</h3>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• Exclusive VIP areas & networking</li>
                <li>• Complimentary refreshments</li>
                <li>• Priority expert consultations</li>
                <li>• Instant ticket delivery</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handleRetryPayment}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Payment (€50.00)
              </Button>
              
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
                Need help? Contact us at support@ems-events.com or +356 2123 4567
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
