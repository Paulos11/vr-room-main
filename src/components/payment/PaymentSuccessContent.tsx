// src/components/payment/PaymentSuccessContent.tsx - Integrated VR design style
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Ticket, Mail, Calendar, MapPin, Home, Download, Copy, FileText, Gift, Gamepad2, Clock, Users, ArrowLeft, Star } from 'lucide-react'
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
      fetchPaymentDetails()
    } else if (isFreeOrder && registrationId) {
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
      const response = await fetch(`/api/registrations/details?id=${registrationId}`)
      
      if (!response.ok) {
        throw new Error('Direct endpoint failed')
      }
      
      const result = await response.json()
      
      if (result.success) {
        const registration = result.data
        
        const detectedVRBooking = registration.adminNotes?.includes('VR Booking') || 
                                 registration.adminNotes?.includes('Selected experiences:') ||
                                 (!registration.isEmsClient && registration.allTickets?.length === 0) ||
                                 isVRBooking
        
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
      } else {
        throw new Error(result.message || 'Registration not found')
      }
    } catch (error) {
      console.error('Error fetching free order details:', error)
      
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
      
      toast({
        title: "Data Loading Issue",
        description: "Your order was successful, but we couldn't load all details. Please check your email for confirmation.",
        variant: "default",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadTicketPDF = async () => {
    if (!paymentData) return
    
    setDownloadingPdf(true)
    
    try {
      const downloadUrl = paymentData.isFreeOrder 
        ? `/api/tickets/download?registrationId=${paymentData.registrationId}`
        : `/api/tickets/download?sessionId=${sessionId}`
      
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

  // Theme based on VR vs EMS
  const isVR = paymentData?.isVRBooking
  const theme = isVR ? {
    itemLabel: 'session',
    itemLabelPlural: 'sessions',
    brandName: 'VR Room Malta',
    supportEmail: 'info@vrroom.mt',
    backLink: '/book'
  } : {
    itemLabel: 'ticket',
    itemLabelPlural: 'tickets',
    brandName: 'EMS',
    supportEmail: 'info@ems.com.mt',
    backLink: '/register'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed relative pt-20" 
           style={{ 
             backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(1,174,237,0.8)), url('/vr-background.jpg')`,
           }}>
        <div className="w-full min-h-screen">
          <div className="w-full bg-black/40 backdrop-blur-sm border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">Loading your confirmation...</h1>
                  <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-8">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed relative pt-20" 
           style={{ 
             backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(1,174,237,0.8)), url('/vr-background.jpg')`,
           }}>
        <div className="w-full min-h-screen">
          <div className="w-full bg-black/40 backdrop-blur-sm border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Order Verification Failed</h1>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="space-y-4">
                <Link href="/ticket-status">
                  <Button className="w-full">Check Ticket Status</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">Back to Home</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed relative pt-20" 
         style={{ 
           backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(1,174,237,0.8)), url('/vr-background.jpg')`,
         }}>
      
      {/* Full-width container */}
      <div className="w-full min-h-screen">
        
        {/* Header Section */}
        <div className="w-full bg-black/40 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              {/* Success Title */}
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  {paymentData.isFreeOrder ? (
                    <>
                      <Gift className="h-6 w-6 text-green-400" />
                      Booking Confirmed! 🎉
                    </>
                  ) : isVR ? (
                    <>
                      <Gamepad2 className="h-6 w-6 text-[#01AEED]" />
                      VR Sessions Booked! 🎮
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      Payment Successful! 🎉
                    </>
                  )}
                </h1>
                <p className="text-sm text-gray-300">
                  {paymentData.isFreeOrder ? (
                    `Your FREE ${isVR ? 'VR sessions are' : 'tickets are'} ready for download`
                  ) : (
                    `Your ${isVR ? 'VR experience booking' : 'registration'} is complete`
                  )}
                </p>
              </div>
              
              {/* Success Indicator */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Order Complete</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#01AEED] flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Email Sent</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Ready to Download</span>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="text-right">
                <div className={`font-bold text-lg ${paymentData.isFreeOrder ? 'text-green-400' : 'text-white'}`}>
                  {paymentData.isFreeOrder ? 'FREE' : `€${(paymentData.totalAmount / 100).toFixed(2)}`}
                </div>
                <div className="text-sm text-gray-300">
                  {paymentData.quantity} {paymentData.quantity > 1 ? theme.itemLabelPlural : theme.itemLabel}
                </div>
              </div>
            </div>
            
            {/* Mobile Progress */}
            <div className="mt-4 md:hidden">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                <span>✅ Order Complete</span>
                <span>📧 Email Sent</span>
                <span>📄 Ready to Download</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Back Button */}
          <Link href={theme.backLink} className="inline-block mb-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {isVR ? 'VR Booking' : 'Registration'}
            </Button>
          </Link>
          
          {/* Success Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden">
            
            {/* Content Body */}
            <div className="p-8 space-y-6">
              
              {/* Success Message */}
              <div className="text-center">
                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4" 
                     style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  {paymentData.isFreeOrder ? (
                    <Gift className="h-10 w-10 text-white" />
                  ) : isVR ? (
                    <Gamepad2 className="h-10 w-10 text-white" />
                  ) : (
                    <CheckCircle className="h-10 w-10 text-white" />
                  )}
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {paymentData.isFreeOrder ? (
                    <>
                      Your FREE {isVR ? 'VR session booking' : 'registration'} is complete! 
                      {paymentData.quantity > 1 ? ` All ${paymentData.quantity} ${theme.itemLabelPlural} have` : ` Your ${theme.itemLabel} has`} 
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
                <div className="p-6 border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
                  <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-600" />
                    🎉 100% Discount Applied!
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-purple-800">
                    <div className="space-y-1">
                      {paymentData.appliedCouponCode && (
                        <p>✓ Coupon "{paymentData.appliedCouponCode}" - 100% OFF</p>
                      )}
                      <p>✓ No payment required</p>
                    </div>
                    <div className="space-y-1">
                      <p>✓ Your {theme.itemLabelPlural} are completely FREE</p>
                      <p>✓ Full {isVR ? 'VR experience' : 'VIP'} access included</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Section - Primary CTA */}
              <div className={`p-6 border-2 rounded-xl ${isVR ? 'border-[#01AEED]/20 bg-gradient-to-r from-[#01AEED]/5 to-cyan-50' : 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                <h3 className={`font-semibold mb-4 text-lg flex items-center gap-2`}>
                  <FileText className={`h-5 w-5 ${isVR ? 'text-[#01AEED]' : 'text-green-600'}`} />
                  <Star className="h-4 w-4 text-yellow-500" />
                  Download Your {isVR ? 'Session' : 'Ticket'}{paymentData.quantity > 1 ? 's' : ''}
                </h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className={`text-sm ${isVR ? 'text-[#262624]' : 'text-green-800'}`}>
                    <p>✓ Professional PDF {theme.itemLabel}{paymentData.quantity > 1 ? 's' : ''} ready</p>
                    <p>✓ {paymentData.quantity > 1 ? `Each ${theme.itemLabel} has unique number` : `Unique ${theme.itemLabel} number included`}</p>
                  </div>
                  <div className={`text-sm ${isVR ? 'text-[#262624]' : 'text-green-800'}`}>
                    <p>✓ Print or save to your phone</p>
                    <p>✓ QR codes for easy scanning</p>
                  </div>
                </div>
                
                <Button 
                  onClick={downloadTicketPDF}
                  disabled={downloadingPdf}
                  className={`w-full text-lg py-4 ${isVR ? 'bg-gradient-to-r from-[#01AEED] to-[#262624] hover:from-[#01AEED]/90 hover:to-[#262624]/90' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'}`}
                  size="lg"
                >
                  {downloadingPdf ? (
                    <>
                      <Download className="mr-2 h-5 w-5 animate-bounce" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Download PDF {isVR ? 'Session' : 'Ticket'}{paymentData.quantity > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>

              {/* Two Column Layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Left Column */}
                <div className="space-y-4">
                  
                  {/* Order Summary */}
                  <div className={`p-4 border rounded-xl ${isVR ? 'bg-[#01AEED]/5' : 'bg-blue-50'}`}>
                    <h4 className="font-medium mb-3 text-base">Booking Confirmation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">{paymentData.customerName || 'Valued Customer'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{isVR ? 'Sessions:' : 'Tickets:'}</span>
                        <span className="font-medium">{paymentData.quantity} {paymentData.quantity > 1 ? theme.itemLabelPlural : theme.itemLabel}</span>
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

                  {/* Ticket Numbers */}
                  {paymentData.ticketNumbers && paymentData.ticketNumbers.length > 0 && (
                    <div className="p-4 border border-purple-200 rounded-xl bg-purple-50">
                      <h4 className="font-medium mb-3 text-base flex items-center gap-2">
                        {isVR ? <Gamepad2 className="h-4 w-4 text-purple-600" /> : <Ticket className="h-4 w-4 text-purple-600" />}
                        Your {isVR ? 'Session' : 'Ticket'} Number{paymentData.quantity > 1 ? 's' : ''}
                      </h4>
                      <div className="space-y-2">
                        {paymentData.ticketNumbers.map((ticketNumber, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
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
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  
                  {/* Email Confirmation */}
                  <div className="p-4 border border-orange-200 rounded-xl bg-orange-50">
                    <h4 className="font-medium mb-3 text-base flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-600" />
                      Email Confirmation
                    </h4>
                    <div className="space-y-2 text-sm text-orange-800">
                      {paymentData.email && (
                        <p>✓ Confirmation sent to: <strong>{paymentData.email}</strong></p>
                      )}
                      {!paymentData.isFreeOrder && <p>✓ Payment receipt included</p>}
                      <p>✓ {isVR ? 'Session details and instructions' : 'Event details and instructions'} attached</p>
                      <p className="text-orange-600 mt-2 font-medium">
                        💡 Tip: Download the PDF and save to your phone for easy access!
                      </p>
                    </div>
                  </div>

                  {/* Location Information */}
                  {isVR ? (
                    <div className="p-4 border border-[#01AEED]/20 rounded-xl bg-[#01AEED]/10">
                      <h4 className="font-medium mb-3 text-base flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
                        VR Experience Details
                      </h4>
                      <div className="space-y-2 text-sm text-[#262624]">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span><strong>Location:</strong> VR Room Malta, Bugibba Square</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span><strong>Sessions:</strong> 30 minutes each</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span><strong>Age:</strong> 8+ recommended</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-indigo-200 rounded-xl bg-indigo-50">
                      <h4 className="font-medium mb-3 text-base">Event Details</h4>
                      <div className="space-y-2 text-sm text-indigo-800">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span><strong>Dates:</strong> June 26 - July 6, 2025</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span><strong>Venue:</strong> Malta Fairs and Conventions Centre</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="h-3 w-3" />
                          <span><strong>EMS Booth:</strong> MFCC Main Hall</span>
                        </div>
                      </div>
                    </div>
                  )}

              
                </div>
              </div>

           

              {/* Important Instructions - Only for EMS */}
              {!isVR && (
                <div className="p-4 border border-yellow-200 rounded-xl bg-yellow-50">
                  <h4 className="font-medium mb-3 text-base">Important Instructions</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Present your ticket (digital or printed) at the event</li>
                      <li>• Bring valid ID matching your registration name</li>
                      <li>• Arrive 30 minutes early for smooth check-in</li>
                    </ul>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Visit EMS booth in MFCC Main Hall for VIP access</li>
                      {paymentData.quantity > 1 && (
                        <li>• Each person needs their individual ticket for entry</li>
                      )}
                      <li>• Event runs June 26 - July 6, 2025</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Footer */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                <Button 
                  onClick={downloadTicketPDF}
                  disabled={downloadingPdf}
                  className={`${isVR ? 'bg-[#01AEED] hover:bg-[#01AEED]/90' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {downloadingPdf ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-bounce" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Again
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
                    Manage {isVR ? 'Sessions' : 'Tickets'}
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-6 pt-6 border-t border-gray-200 mt-4">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Instant Delivery</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span>Email Confirmation</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  {isVR ? <Gamepad2 className="h-4 w-4 text-[#01AEED]" /> : <Ticket className="h-4 w-4 text-green-500" />}
                  <span>Ready to Use</span>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  {isVR 
                    ? 'Thank you for choosing VR Room Malta! We look forward to your virtual reality adventure.' 
                    : 'Thank you for choosing EMS! We look forward to seeing you at the trade fair.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}