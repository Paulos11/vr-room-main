// src/components/payment/PaymentPageContent.tsx - Enhanced with VR detection
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Shield, CheckCircle, Clock, ArrowLeft, Euro, Ticket, Tag, Gift, Gamepad2, MapPin, Users } from 'lucide-react'
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
  adminNotes?: string
  tickets: Array<{
    id: string
    ticketNumber: string
    ticketType: {
      name: string
      priceInCents: number
    }
  }>
  // VR-specific fields
  sessionCount?: number
  bookedExperiences?: Array<{
    experienceName: string
    quantity: number
    totalPrice: number
  }>
}

export function PaymentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('id')
  
  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [isVRBooking, setIsVRBooking] = useState(false)

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
        
        // ✅ DETECT VR BOOKING
        const isVR = data.adminNotes?.includes('VR Booking') || 
                    data.adminNotes?.includes('Selected experiences:') ||
                    (!data.isEmsClient && data.tickets?.length === 0)

        setIsVRBooking(isVR)

        // Parse VR experiences if this is a VR booking
        let bookedExperiences = []
        let sessionCount = 0
        
        if (isVR && data.adminNotes) {
          try {
            const match = data.adminNotes.match(/Selected experiences: (\[.*\])/)
            if (match) {
              const selectedTickets = JSON.parse(match[1])
              bookedExperiences = selectedTickets.map((ticket: any) => ({
                experienceName: ticket.name,
                quantity: ticket.quantity,
                totalPrice: ticket.priceInCents
              }))
              sessionCount = selectedTickets.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0)
            }
          } catch (parseError) {
            console.warn('Failed to parse VR experiences:', parseError)
          }
        }
        
        setRegistration({
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          status: data.status,
          isEmsClient: data.isEmsClient,
          panelInterest: data.panelInterests && data.panelInterests.length > 0,
          quantity: isVR ? sessionCount : (data.tickets ? data.tickets.length : 0),
          originalAmount: data.originalAmount || 0,
          discountAmount: data.discountAmount || 0,
          finalAmount: data.finalAmount || 0,
          appliedCouponCode: data.appliedCouponCode,
          adminNotes: data.adminNotes,
          tickets: data.tickets || [],
          sessionCount,
          bookedExperiences
        })

        // Redirect logic
        if (data.isEmsClient || data.status === 'COMPLETED') {
          const successUrl = isVR 
            ? `/payment/success?registration_id=${registrationId}&vr_booking=true`
            : `/register/success?id=${registrationId}`
          router.push(successUrl)
        }
      } else {
        toast({
          title: isVRBooking ? "VR booking not found" : "Registration not found",
          description: isVRBooking ? "Please book your VR experience first" : "Please register first",
          variant: "destructive",
        })
        router.push(isVRBooking ? '/book' : '/register')
      }
    } catch (error) {
      console.error('Error fetching registration:', error)
      router.push(isVRBooking ? '/book' : '/register')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
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

      if (result.success) {
        if (result.isFreeOrder) {
          console.log('🎉 Free order completed!')
          toast({
            title: isVRBooking ? "VR Sessions Confirmed!" : "Order Completed!",
            description: isVRBooking 
              ? "Your free VR sessions have been booked successfully."
              : "Your free tickets have been generated and sent to your email.",
          })
          
          if (result.redirectUrl) {
            window.location.href = result.redirectUrl
          } else {
            const successUrl = isVRBooking
              ? `/payment/success?free_order=true&registration_id=${registration.id}&vr_booking=true`
              : `/payment/success?free_order=true&registration_id=${registration.id}`
            router.push(successUrl)
          }
        } else if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl
        } else {
          throw new Error('Invalid response from checkout API')
        }
      } else {
        toast({
          title: "Checkout Error",
          description: result.message || "Failed to process order",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`
  const isFreeOrder = registration && registration.finalAmount <= 0

  // VR vs EMS theming
  const theme = isVRBooking ? {
    bgGradient: 'from-cyan-50 to-blue-100',
    primaryColor: 'text-[#01AEED]',
    primaryBg: 'bg-[#01AEED]',
    primaryBorder: 'border-[#01AEED]',
    lightBg: 'bg-[#01AEED]/5',
    backLink: '/book',
    brandName: 'VR Room Malta',
    itemLabel: isVRBooking ? 'sessions' : 'tickets',
    locationInfo: {
      venue: 'VR Room Malta',
      location: 'Bugibba Square, Malta',
     
    }
  } : {
    bgGradient: 'from-blue-50 to-indigo-100',
    
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} p-4`}>
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
      <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center p-4`}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-bold mb-2">
              {isVRBooking ? 'VR Booking Not Found' : 'Registration Not Found'}
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              {isVRBooking ? 'Please book your VR experience first.' : 'Please register first.'}
            </p>
           
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} p-4`}>
      <div className="max-w-md mx-auto pt-4">
       

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              {isFreeOrder ? (
                <>
                  <Gift className="h-5 w-5 text-green-600" />
                  {isVRBooking ? 'Free VR Sessions' : 'Free Order Confirmation'}
                </>
              ) : (
                <>
                  {isVRBooking ? (
                    <Gamepad2 className={`h-5 w-5 ${theme.primaryColor}`} />
                  ) : (
                    <Euro className="h-5 w-5" />
                  )}
                  {isVRBooking ? 'VR Payment' : 'Secure Payment'}
                </>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {isFreeOrder 
                ? `Complete your free ${isVRBooking ? 'VR session booking' : 'registration'}` 
                : `Complete your ${isVRBooking ? 'VR experience' : 'registration'} with secure payment`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Registration Summary */}
            <div className={`p-3 border rounded-lg ${theme.lightBg}`}>
              <h3 className="font-medium mb-2 text-sm">
                {isVRBooking ? 'VR Booking Summary' : 'Order Summary'}
              </h3>
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
                  <span className="text-gray-600">
                    {isVRBooking ? 'Sessions:' : 'Tickets:'}
                  </span>
                  <span className="font-medium">
                    {registration.quantity} {theme.itemLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={isFreeOrder ? "default" : "secondary"} className="text-xs">
                    {isFreeOrder ? "Ready to Complete" : "Payment Required"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* VR Experience Details or Ticket Details */}
            {isVRBooking && registration.bookedExperiences && registration.bookedExperiences.length > 0 ? (
              <div className="p-3 border rounded-lg bg-gradient-to-r from-[#01AEED]/5 to-cyan-50">
                <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
                  Your VR Experiences
                </h3>
                <div className="space-y-1">
                  {registration.bookedExperiences.map((experience, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-700">{experience.experienceName} × {experience.quantity}</span>
                      <span className="font-medium">
                        {isFreeOrder ? "FREE" : formatPrice(experience.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`p-3 border rounded-lg ${theme.lightBg}`}>
                <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  {isVRBooking ? 'VR Session Details' : 'Ticket Details'}
                </h3>
                <div className="space-y-1">
                  {registration.tickets.map((ticket, index) => (
                    <div key={ticket.id} className="flex justify-between text-xs">
                      <span className="text-gray-700">{ticket.ticketType.name}</span>
                      <span className="font-medium">
                        {isFreeOrder ? "FREE" : formatPrice(ticket.ticketType.priceInCents)}
                      </span>
                    </div>
                  ))}
                  {registration.tickets.length === 0 && isVRBooking && (
                    <div className="text-xs text-gray-500 italic">
                      VR sessions will be confirmed after payment
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className={`p-4 border-2 rounded-lg ${
              isFreeOrder ? 'border-green-200 bg-green-50' : `${theme.primaryBorder}/20 ${theme.lightBg}`
            }`}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatPrice(registration.originalAmount)}</span>
                </div>
                
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
                    <span className={`font-bold text-2xl ${
                      isFreeOrder ? 'text-green-900' : theme.primaryColor
                    }`}>
                      {isFreeOrder ? "FREE" : formatPrice(registration.finalAmount)}
                    </span>
                  </div>
                </div>

                {registration.discountAmount > 0 && (
                  <div className={`text-center p-2 border rounded mt-2 ${
                    isFreeOrder 
                      ? 'bg-green-200 border-green-400' 
                      : 'bg-green-100 border-green-300'
                  }`}>
                    <p className={`text-sm font-medium ${
                      isFreeOrder ? 'text-green-900' : 'text-green-800'
                    }`}>
                      🎉 {isFreeOrder 
                        ? `100% Discount Applied! You saved ${formatPrice(registration.discountAmount)}!`
                        : `You saved ${formatPrice(registration.discountAmount)}!`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* What's Included */}
            <div className="p-3 border rounded-lg bg-green-50">
              <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                What's Included
              </h3>
              <ul className="space-y-1 text-xs text-green-800">
                {isVRBooking ? (
                  <>
                    <li>• Premium VR experiences with latest technology</li>
                    <li>• Professional guidance and setup</li>
                    <li>• Sanitized equipment for safety</li>
                    <li>• Located at Bugibba Square, Malta</li>
                  </>
                ) : (
                  <>
                    
                  </>
                )}
              </ul>
            </div>

            

            {/* Panel Interest - EMS only */}
            {!isVRBooking && registration.panelInterest && (
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
            {!isFreeOrder && (
              <div className="p-3 border rounded-lg bg-gray-50 flex items-start gap-2">
                <Shield className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-700">
                  <p className="font-medium">Secure Payment by Stripe</p>
                  <p>Bank-level security. We never see your card details.</p>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <Button 
              onClick={handleCheckout}
              disabled={processing}
              className={`w-full ${
                isFreeOrder 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : `${theme.primaryBg} hover:${theme.primaryBg}/90`
              }`}
              size="lg"
            >
              {processing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {isFreeOrder ? 'Completing Order...' : 'Loading Checkout...'}
                </>
              ) : isFreeOrder ? (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  {isVRBooking ? 'Confirm Free Sessions' : 'Complete Free Order'}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {formatPrice(registration.finalAmount)} Securely
                </>
              )}
            </Button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {!isFreeOrder && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Shield className="h-3 w-3" />
                  <span>SSL Secured</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {isVRBooking ? <Gamepad2 className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                <span>Instant Delivery</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              {isFreeOrder 
                ? `Your free ${isVRBooking ? 'VR sessions will be confirmed and we\'ll contact you to schedule' : 'tickets will be generated and emailed to you immediately'}.`
                : `You'll be redirected to Stripe's secure checkout. Your ${isVRBooking ? 'session tickets' : 'tickets'} will be emailed immediately after payment.`
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}