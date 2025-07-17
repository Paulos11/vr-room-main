// src/components/payment/PaymentSuccessContent.tsx - Compact VR-optimized design
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download, Home, Copy, Gamepad2, Gift, Mail, MapPin, Clock } from 'lucide-react'
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
  
  // Check URL parameters
  const sessionId = searchParams.get('session_id')
  const isFreeOrder = searchParams.get('free_order') === 'true'
  const registrationId = searchParams.get('registration_id')
  const isVRBooking = searchParams.get('vr_booking') === 'true'
  
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const formatPrice = useCallback((cents: number) => {
    if (!cents || isNaN(cents)) return '€0.00'
    return `€${(cents / 100).toFixed(2)}`
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (sessionId) {
          // Paid order - verify payment
          const response = await fetch(`/api/payment/verify?session_id=${sessionId}`)
          const result = await response.json()
          
          if (result.success) {
            // Check if it's VR booking by looking at registration
            const regResponse = await fetch(`/api/registrations/${result.data.registrationId}`)
            const regResult = await regResponse.json()
            
            const detectedVR = regResult.success && (
              regResult.data.adminNotes?.includes('VR Booking') ||
              regResult.data.adminNotes?.includes('Selected experiences:') ||
              isVRBooking
            )
            
            setPaymentData({
              ...result.data,
              isVRBooking: detectedVR
            })
          }
        } else if (isFreeOrder && registrationId) {
          // Free order - get registration details
          const response = await fetch(`/api/registrations/details?id=${registrationId}`)
          const result = await response.json()
          
          if (result.success) {
            const reg = result.data
            const detectedVR = reg.adminNotes?.includes('VR Booking') || 
                              reg.adminNotes?.includes('Selected experiences:') ||
                              isVRBooking
            
            setPaymentData({
              registrationId: reg.id,
              customerName: `${reg.firstName} ${reg.lastName}`,
              email: reg.email,
              quantity: reg.allTickets?.length || 0,
              totalAmount: reg.finalAmount || 0,
              currency: 'eur',
              paidAt: reg.payment?.paidAt || reg.createdAt || new Date().toISOString(),
              ticketNumbers: reg.allTickets?.map((t: any) => t.ticketNumber) || [],
              isFreeOrder: true,
              appliedCouponCode: reg.appliedCouponCode,
              isVRBooking: detectedVR
            })
          } else {
            // Fallback for missing data
            setPaymentData({
              registrationId: registrationId || '',
              customerName: 'VR Guest',
              email: '',
              quantity: 1,
              totalAmount: 0,
              currency: 'eur',
              paidAt: new Date().toISOString(),
              ticketNumbers: [],
              isFreeOrder: true,
              isVRBooking: isVRBooking
            })
          }
        }
      } catch (error) {
        console.error('Error fetching payment data:', error)
        // Set minimal fallback data
        setPaymentData({
          registrationId: registrationId || '',
          customerName: 'VR Guest',
          email: '',
          quantity: isVRBooking ? 1 : 0,
          totalAmount: 0,
          currency: 'eur',
          paidAt: new Date().toISOString(),
          ticketNumbers: [],
          isFreeOrder: isFreeOrder,
          isVRBooking: isVRBooking
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId, isFreeOrder, registrationId, isVRBooking])

  const downloadTicketPDF = useCallback(async () => {
    if (!paymentData) return
    
    setDownloadingPdf(true)
    try {
      const downloadUrl = paymentData.isFreeOrder 
        ? `/api/tickets/download?registrationId=${paymentData.registrationId}`
        : `/api/tickets/download?sessionId=${sessionId}`
      
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const prefix = paymentData.isVRBooking ? 'VR_Sessions' : 'EMS_Tickets'
      const filename = `${prefix}_${paymentData.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      toast({
        title: "Download Started!",
        description: `Your ${paymentData.isVRBooking ? 'VR sessions' : 'tickets'} are downloading...`,
      })
      
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPdf(false)
    }
  }, [paymentData, sessionId])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "Copied to clipboard" })
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-30"
          style={{ backgroundImage: "url('/vr-background.jpg')" }}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#01AEED] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading confirmation...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isVR = paymentData?.isVRBooking
  const sessionCount = isVR ? (paymentData?.quantity || 1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-30"
        style={{ backgroundImage: "url('/vr-background.jpg')" }}
      />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 max-w-2xl w-full">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {paymentData?.isFreeOrder ? (
                <Gift className="h-8 w-8 text-green-600" />
              ) : isVR ? (
                <Gamepad2 className="h-8 w-8 text-[#01AEED]" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {paymentData?.isFreeOrder ? 'Booking Confirmed!' : 
               isVR ? 'VR Sessions Booked!' : 'Payment Successful!'}
            </h1>
            
            <p className="text-gray-600">
              {paymentData?.isFreeOrder ? 'Your FREE booking is ready' : 
               isVR ? 'Your virtual reality adventure awaits' : 'Your registration is complete'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* Order Summary */}
            <div className={`p-4 rounded-lg ${isVR ? 'bg-[#01AEED]/10 border border-[#01AEED]/20' : 'bg-green-50 border border-green-200'}`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <p className="font-medium">{paymentData?.customerName || 'Guest'}</p>
                </div>
                <div>
                  <span className="text-gray-600">{isVR ? 'VR Sessions:' : 'Tickets:'}</span>
                  <p className="font-medium">{isVR ? sessionCount : paymentData?.quantity || 0}</p>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <p className="font-medium">
                    {paymentData?.isFreeOrder ? (
                      <span className="text-green-600 font-bold">FREE</span>
                    ) : (
                      formatPrice(paymentData?.totalAmount || 0)
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <p className="font-medium">
                    {paymentData?.paidAt ? new Date(paymentData.paidAt).toLocaleDateString() : 'Today'}
                  </p>
                </div>
              </div>
            </div>

            {/* VR Location Info */}
            {isVR && (
              <div className="p-4 bg-[#01AEED]/5 border border-[#01AEED]/20 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
                  VR Room Malta
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>50m From Bugibba Square, Malta
</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>6:30pm - 11:00pm daily</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Numbers */}
            {paymentData?.ticketNumbers && paymentData.ticketNumbers.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800">
                  Your {isVR ? 'Session' : 'Ticket'} Number{paymentData.ticketNumbers.length > 1 ? 's' : ''}:
                </h3>
                {paymentData.ticketNumbers.map((ticketNumber, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <span className="font-mono text-sm font-bold">{ticketNumber}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(ticketNumber)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Email Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">
                  Confirmation email sent to: <strong>{paymentData?.email || 'your email'}</strong>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Download PDF
                  </>
                )}
              </Button>
              
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Thank You Message */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {isVR 
                  ? '🎮 Thank you for choosing VR Room Malta! Get ready for an amazing virtual reality experience.'
                  : '🎉 Thank you for your registration! We look forward to seeing you at the event.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}