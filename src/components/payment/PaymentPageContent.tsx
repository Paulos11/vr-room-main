// src/components/payment/PaymentPageContent.tsx - Fixed with real pricing and discount display
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Shield, CheckCircle, Clock, ArrowLeft, Euro, Ticket, Tag } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

interface RegistrationData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  isEmsClient: boolean
  panelInterest: boolean
  quantity: number
  originalAmount: number
  discountAmount: number
  finalAmount: number
  appliedCouponCode?: string
  tickets: Array<{
    id: string
    ticketNumber: string
    ticketType: {
      name: string
      priceInCents: number
    }
  }>
}

export function PaymentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('id')
  
  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

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
        const data = result.data
        
        setRegistration({
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          status: data.status,
          isEmsClient: data.isEmsClient,
          panelInterest: data.panelInterests && data.panelInterests.length > 0,
          quantity: data.tickets ? data.tickets.length : 0,
          originalAmount: data.originalAmount || 0,
          discountAmount: data.discountAmount || 0,
          finalAmount: data.finalAmount || 0,
          appliedCouponCode: data.appliedCouponCode,
          tickets: data.tickets || []
        })

        // Redirect if payment not needed
        if (data.isEmsClient || data.status === 'COMPLETED') {
          router.push(`/register/success?id=${registrationId}`)
        }
      } else {
        toast({
          title: "Registration not found",
          description: "Please register first",
          variant: "destructive",
        })
        router.push('/register')
      }
    } catch (error) {
      console.error('Error fetching registration:', error)
      router.push('/register')
    } finally {
      setLoading(false)
    }
  }

  const handleStripeCheckout = async () => {
    if (!registration) return
    
    setProcessing(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registration.id,
        }),
      })

      const result = await response.json()

      if (result.success && result.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkoutUrl
      } else {
        toast({
          title: "Payment Error",
          description: result.message || "Failed to create checkout session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Payment Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card>
            <CardHeader>
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-bold mb-2">Registration Not Found</h2>
            <p className="text-gray-600 mb-4 text-sm">Please register first.</p>
            <Link href="/register">
              <Button>Go to Registration</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-4">
        {/* Back Button */}
        <Link href="/" className="inline-block mb-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Secure Payment
            </CardTitle>
            <CardDescription className="text-sm">
              Complete your registration with Stripe
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Registration Summary */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2 text-sm">Order Summary</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{registration.firstName} {registration.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium truncate ml-2">{registration.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tickets:</span>
                  <span className="font-medium">{registration.quantity} ticket{registration.quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary" className="text-xs">Payment Required</Badge>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="p-3 border rounded-lg bg-blue-50">
              <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Ticket Details
              </h3>
              <div className="space-y-1">
                {registration.tickets.map((ticket, index) => (
                  <div key={ticket.id} className="flex justify-between text-xs">
                    <span className="text-gray-700">{ticket.ticketType.name}</span>
                    <span className="font-medium">{formatPrice(ticket.ticketType.priceInCents)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatPrice(registration.originalAmount)}</span>
                </div>
                
                {/* Show discount if applied */}
                {registration.discountAmount > 0 && registration.appliedCouponCode && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Discount ({registration.appliedCouponCode}):
                    </span>
                    <span className="font-medium">-{formatPrice(registration.discountAmount)}</span>
                  </div>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total:</span>
                    <span className="font-bold text-2xl text-blue-900">
                      {formatPrice(registration.finalAmount)}
                    </span>
                  </div>
                </div>

                {/* Savings highlight */}
                {registration.discountAmount > 0 && (
                  <div className="text-center p-2 bg-green-100 border border-green-300 rounded mt-2">
                    <p className="text-sm font-medium text-green-800">
                      🎉 You saved {formatPrice(registration.discountAmount)}!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* VIP Benefits */}
            <div className="p-3 border rounded-lg bg-green-50">
              <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                What's Included
              </h3>
              <ul className="space-y-1 text-xs text-green-800">
                <li>• Access to EMS Trade Fair 2025</li>
                <li>• Malta Fairs and Conventions Centre</li>
                <li>• Event dates: June 26 - July 6, 2025</li>
                <li>• Direct consultation with EMS experts</li>
                <li>• Product demonstrations and displays</li>
              </ul>
            </div>

            {/* Panel Interest */}
            {registration.panelInterest && (
              <div className="p-3 border rounded-lg bg-orange-50">
                <h3 className="font-medium mb-1 text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  Solar Panel Consultation
                </h3>
                <p className="text-xs text-orange-800">
                  Our solar experts will have personalized recommendations ready for you.
                </p>
              </div>
            )}

            {/* Security & Trust */}
            <div className="p-3 border rounded-lg bg-gray-50 flex items-start gap-2">
              <Shield className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-700">
                <p className="font-medium">Secure Payment by Stripe</p>
                <p>Bank-level security. We never see your card details.</p>
              </div>
            </div>

            {/* Checkout Button */}
            <Button 
              onClick={handleStripeCheckout}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {processing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Loading Checkout...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {formatPrice(registration.finalAmount)} with Stripe
                </>
              )}
            </Button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3" />
                <span>Instant Delivery</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You'll be redirected to Stripe's secure checkout. 
              Your ticket{registration.quantity > 1 ? 's' : ''} will be emailed immediately after payment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
