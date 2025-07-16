// src/components/payment/PaymentSuccessContent.tsx - Enhanced with VR detection
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Ticket, Mail, Calendar, MapPin, Home, Download, Copy, FileText, Gift, Gamepad2, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

interface PaymentSuccessData {
  registrationId: string
  customerName: string
  email: string
  quantity: number
  totalAmount: number
  currency: string
  paidAt: string
  sessionId?: string
  ticketNumbers: string[]
  isFreeOrder?: boolean
  appliedCouponCode?: string
  isVRBooking?: boolean
}

export function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Check if this is a free order, paid order, or VR booking
  const sessionId = searchParams.get('session_id')
  const isFreeOrder = searchParams.get('free_order') === 'true'
  const registrationId = searchParams.get('registration_id')
  const isVRBooking = searchParams.get('vr_booking') === 'true'
  
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    if (sessionId) {
      // Paid order - verify with Stripe session
      fetchPaymentDetails()
    } else if (isFreeOrder && registrationId) {
      // Free order - get registration details directly
      fetchFreeOrderDetails()
    } else {
      setError('No session ID or registration ID provided')
      setLoading(false)
    }
  }, [sessionId, isFreeOrder, registrationId])

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payment/verify?session_id=${sessionId}`)
      const result = await response.json()
      
      if (result.success) {
        // Auto-detect if this is a VR booking from the registration
        const registrationResponse = await fetch(`/api/registrations/${result.data.registrationId}`)
        const registrationResult = await registrationResponse.json()
        
        let detectedVRBooking = false
        if (registrationResult.success) {
          const data = registrationResult.data
          detectedVRBooking = data.adminNotes?.includes('VR Booking') || 
                            data.adminNotes?.includes('Selected experiences:') ||
                            (!data.isEmsClient && data.tickets?.length === 0)
        }
        
        setPaymentData({
          ...result.data,
          isVRBooking: detectedVRBooking || isVRBooking
        })
      } else {
        setError(result.message || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Error fetching payment details:', error)
      setError('Failed to verify payment')
    } finally {
      setLoading(false)
    }
  }

  const fetchFreeOrderDetails = async () => {
    try {
      console.log('Fetching free order details for registration:', registrationId)
      
      // Try the direct registration details endpoint first
      const response = await fetch(`/api/registrations/details?id=${registrationId}`)
      
      if (!response.ok) {
        console.log('Direct endpoint failed, trying fallback method')
        throw new Error('Direct endpoint failed')
      }
      
      const result = await response.json()
      
      if (result.success) {
        const registration = result.data
        
        // Auto-detect VR booking
        const detectedVRBooking = registration.adminNotes?.includes('VR Booking') || 
                                 registration.adminNotes?.includes('Selected experiences:') ||
                                 (!registration.isEmsClient && registration.allTickets?.length === 0) ||
                                 isVRBooking
        
        // Map the registration data to PaymentSuccessData format
        setPaymentData({
          registrationId: registration.id,
          customerName: `${registration.firstName} ${registration.lastName}`,
          email: registration.email,
          quantity: registration.allTickets?.length || 0,
          totalAmount: registration.finalAmount || 0,
          currency: 'eur',
          paidAt: registration.payment?.paidAt || registration.createdAt || new Date().toISOString(),
          ticketNumbers: registration.allTickets?.map((t: any) => t.ticketNumber) || [],
          isFreeOrder: true,
          appliedCouponCode: registration.appliedCouponCode,
          isVRBooking: detectedVRBooking
        })
        
        console.log('Free order data loaded successfully:', {
          registrationId: registration.id,
          quantity: registration.allTickets?.length || 0,
          status: registration.registrationStatus,
          isVRBooking: detectedVRBooking
        })
      } else {
        throw new Error(result.message || 'Registration not found')
      }
    } catch (error) {
      console.error('Error fetching free order details:', error)
      
      // Fallback: Try to get minimal data for the success page
      try {
        console.log('Attempting fallback data fetch...')
        
        // Set minimal data so the page doesn't fail completely
        setPaymentData({
          registrationId: registrationId || '',
          customerName: 'Valued Customer',
          email: '',
          quantity: 0,
          totalAmount: 0,
          currency: 'eur',
          paidAt: new Date().toISOString(),
          ticketNumbers: [],
          isFreeOrder: true,
          appliedCouponCode: '',
          isVRBooking: isVRBooking
        })
        
        // But still show a warning
        toast({
          title: "Data Loading Issue",
          description: "Your order was successful, but we couldn't load all details. Please check your email for confirmation.",
          variant: "default",
        })
        
      } catch (fallbackError) {
        setError('Failed to fetch order details. Your order was successful - please check your email for confirmation.')
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadTicketPDF = async () => {
    if (!paymentData) return
    
    setDownloadingPdf(true)
    
    try {
      // For free orders, use registration ID; for paid orders, use session ID
      const downloadUrl = paymentData.isFreeOrder 
        ? `/api/tickets/download?registrationId=${paymentData.registrationId}`
        : `/api/tickets/download?sessionId=${sessionId}`
      
      console.log('Downloading PDF from:', downloadUrl)
      
      const response = await fetch(downloadUrl)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const customerName = paymentData.customerName.replace(/[^a-zA-Z0-9]/g, '_')
      const prefix = paymentData.isVRBooking ? 'VR_Sessions' : 'EMS_Tickets'
      const filename = paymentData.quantity === 1 
        ? `${prefix}_${paymentData.ticketNumbers[0] || 'FREE'}.pdf`
        : `${prefix}_${customerName}_${paymentData.quantity}${paymentData.isVRBooking ? 'sessions' : 'tickets'}.pdf`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      toast({
        title: "Download Started!",
        description: `Your ${paymentData.isVRBooking ? 'session' : 'ticket'}${paymentData.quantity > 1 ? 's' : ''} ${paymentData.quantity > 1 ? 'are' : 'is'} downloading...`,
      })
      
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Download Failed",
        description: "Unable to download PDF. Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPdf(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    })
  }

  // Theme and content based on VR vs EMS
  const isVR = paymentData?.isVRBooking
  const theme = isVR ? {
    bgGradient: 'from-cyan-50 to-blue-100',
    primaryColor: 'text-[#01AEED]',
    itemLabel: 'session',
    itemLabelPlural: 'sessions',
    itemName: 'VR Experience',
    brandName: 'VR Room Malta',
    supportEmail: 'info@vrroom.mt',
    thankYouMessage: 'Thank you for choosing VR Room Malta! We look forward to your virtual reality adventure.'
  } : {
    bgGradient: 'from-green-50 to-blue-100',
    primaryColor: 'text-blue-600',
    itemLabel: 'ticket',
    itemLabelPlural: 'tickets',
    itemName: 'VIP Ticket',
    brandName: 'EMS',
    supportEmail: 'info@ems.com.mt',
    thankYouMessage: 'Thank you for choosing EMS! We look forward to seeing you at the trade fair.'
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} p-4`}>
        <div className="max-w-md mx-auto pt-8">
          <Card>
            <CardHeader>
              <div className="animate-pulse space-y-2">
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
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

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-700">Order Verification Failed</h2>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <div className="space-y-2">
              <Link href="/ticket-status">
                <Button className="w-full">Check Ticket Status</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} p-4`}>
      <div className="max-w-md mx-auto pt-8">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              {paymentData.isFreeOrder ? (
                <Gift className="h-8 w-8 text-green-600" />
              ) : isVR ? (
                <Gamepad2 className="h-8 w-8 text-[#01AEED]" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
            <CardTitle className={`text-xl ${isVR ? 'text-[#01AEED]' : 'text-green-700'}`}>
              {paymentData.isFreeOrder ? 'Booking Confirmed! 🎉' : isVR ? 'VR Sessions Booked! 🎮' : 'Payment Successful! 🎉'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Success Message */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                {paymentData.isFreeOrder ? (
                  <>
                    Your FREE {isVR ? 'VR session booking' : 'registration'} is complete! 
                    {paymentData.quantity > 1 ? ` All ${paymentData.quantity} ${theme.itemLabelPlural} have` : paymentData.quantity === 1 ? ` Your ${theme.itemLabel} has` : ` Your ${theme.itemLabelPlural} have`} 
                    been {isVR ? 'confirmed' : 'generated'} at no cost.
                  </>
                ) : (
                  <>
                    Your {isVR ? 'VR experience booking' : 'registration'} is complete! 
                    {paymentData.quantity > 1 ? ` All ${paymentData.quantity} ${theme.itemLabelPlural} have` : ` Your ${theme.itemLabel} has`} 
                    been {isVR ? 'confirmed' : 'generated'}.
                  </>
                )}
              </p>
            </div>

            {/* Free Order Special Notice */}
            {paymentData.isFreeOrder && (
              <div className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                  <Gift className="h-4 w-4 text-purple-600" />
                  100% Discount Applied!
                </h3>
                <div className="text-xs text-purple-800">
                  {paymentData.appliedCouponCode && (
                    <p>✓ Coupon "{paymentData.appliedCouponCode}" - 100% OFF</p>
                  )}
                  <p>✓ No payment required</p>
                  <p>✓ Your {theme.itemLabelPlural} are completely FREE</p>
                  <p>✓ Full {isVR ? 'VR experience' : 'VIP'} access included</p>
                </div>
              </div>
            )}

            {/* PDF Download Section */}
            <div className={`p-4 border-2 rounded-lg ${isVR ? 'border-[#01AEED]/20 bg-[#01AEED]/5' : 'border-green-200 bg-green-50'}`}>
              <h3 className={`font-medium mb-3 text-sm flex items-center gap-2`}>
                <FileText className={`h-4 w-4 ${isVR ? 'text-[#01AEED]' : 'text-green-600'}`} />
                Download Your {isVR ? 'Session' : 'Ticket'}{paymentData.quantity > 1 ? 's' : ''}
              </h3>
              <div className="space-y-3">
                <div className={`text-xs ${isVR ? 'text-[#262624]' : 'text-green-800'}`}>
                  <p>✓ Professional PDF {theme.itemLabel}{paymentData.quantity > 1 ? 's' : ''} ready for download</p>
                  <p>✓ {paymentData.quantity > 1 ? `Each ${theme.itemLabel} has a unique number` : `Unique ${theme.itemLabel} number included`}</p>
                  <p>✓ Print or save to your phone for easy access</p>
                </div>
                
                <Button 
                  onClick={downloadTicketPDF}
                  disabled={downloadingPdf}
                  className={`w-full ${isVR ? 'bg-[#01AEED] hover:bg-[#01AEED]/90' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {downloadingPdf ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-bounce" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF {isVR ? 'Session' : 'Ticket'}{paymentData.quantity > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className={`p-3 border rounded-lg ${isVR ? 'bg-[#01AEED]/5' : 'bg-blue-50'}`}>
              <h3 className="font-medium mb-2 text-sm">Booking Confirmation</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{paymentData.customerName || 'Valued Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isVR ? 'Sessions:' : 'Tickets:'}</span>
                  <span className="font-medium">{paymentData.quantity} {theme.itemName}{paymentData.quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {paymentData.isFreeOrder ? 'Total Value:' : 'Amount Paid:'}
                  </span>
                  <span className="font-medium">
                    {paymentData.isFreeOrder ? (
                      <span className="text-green-600 font-bold">FREE</span>
                    ) : (
                      `€${(paymentData.totalAmount / 100).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date(paymentData.paidAt).toLocaleDateString()}</span>
                </div>
                {paymentData.appliedCouponCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coupon:</span>
                    <span className="font-medium text-purple-600">{paymentData.appliedCouponCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket/Session Numbers */}
            {paymentData.ticketNumbers && paymentData.ticketNumbers.length > 0 && (
              <div className="p-3 border rounded-lg bg-purple-50">
                <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                  {isVR ? <Gamepad2 className="h-4 w-4 text-purple-600" /> : <Ticket className="h-4 w-4 text-purple-600" />}
                  Your {isVR ? 'Session' : 'Ticket'} Number{paymentData.quantity > 1 ? 's' : ''}
                </h3>
                <div className="space-y-2">
                  {paymentData.ticketNumbers.map((ticketNumber, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="font-mono text-sm font-bold">{ticketNumber}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(ticketNumber, `${isVR ? 'Session' : 'Ticket'} ${index + 1}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Confirmation */}
            <div className="p-3 border rounded-lg bg-orange-50">
              <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-600" />
                Email Confirmation
              </h3>
              <div className="space-y-1 text-xs text-orange-800">
                {paymentData.email && (
                  <p>✓ Confirmation sent to: <strong>{paymentData.email}</strong></p>
                )}
                {!paymentData.isFreeOrder && <p>✓ Payment receipt included</p>}
                <p>✓ {isVR ? 'Session details and instructions' : 'Event details and instructions'} attached</p>
                <p className="text-orange-600 mt-2">
                  <strong>Tip:</strong> Download the PDF and save to your phone for easy access!
                </p>
              </div>
            </div>

            {/* VR vs EMS Event Information */}
            {isVR ? (
              <div className="p-3 border rounded-lg bg-[#01AEED]/10">
                <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
                  VR Experience Details
                </h3>
                <div className="space-y-2 text-xs text-[#262624]">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span><strong>Location:</strong> VR Room Malta, Bugibba Square</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span><strong>Sessions:</strong> 30 minutes each</span>
                  </div>
                
                </div>
              </div>
            ) : (
              <div className="p-3 border rounded-lg bg-indigo-50">
                <h3 className="font-medium mb-2 text-sm">Event Details</h3>
                <div className="space-y-2 text-xs text-indigo-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span><strong>Dates:</strong> June 26 - July 6, 2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span><strong>Venue:</strong> Malta Fairs and Conventions Centre, Ta' Qali</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-3 w-3" />
                    <span><strong>EMS Booth:</strong> MFCC Main Hall</span>
                  </div>
                </div>
              </div>
            )}

            {/* Important Instructions - Only for EMS */}
            {!isVR && (
              <div className="p-3 border rounded-lg bg-yellow-50">
                <h3 className="font-medium mb-2 text-sm">Important Instructions</h3>
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• Present your ticket (digital or printed) at the event</li>
                  <li>• Bring valid ID matching your registration name</li>
                  <li>• Arrive 30 minutes early for smooth check-in</li>
                  <li>• Visit EMS booth in MFCC Main Hall for VIP access</li>
                  {paymentData.quantity > 1 && (
                    <li>• Each person needs their individual ticket for entry</li>
                  )}
                </ul>
              </div>
            )}

           

            {/* Contact Information */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2 text-sm">Need Help?</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-600" />
                  <span>{theme.supportEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">📞</span>
                  <span>+356 2123 4567</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={downloadTicketPDF}
                disabled={downloadingPdf}
                className={`w-full ${isVR ? 'bg-[#01AEED] hover:bg-[#01AEED]/90' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {downloadingPdf ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-bounce" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF Again
                  </>
                )}
              </Button>
              
              <Link href="/" className="block">
                <Button className="w-full" variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              
              <Link href="/ticket-status" className="block">
                <Button className="w-full" variant="outline">
                  {isVR ? <Gamepad2 className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />}
                  Manage Your {isVR ? 'Sessions' : 'Tickets'}
                </Button>
              </Link>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                {theme.thankYouMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}