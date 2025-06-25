// src/components/registration/RegistrationPendingContent.tsx - Separated content component
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, Mail, Phone, AlertCircle, Home, Zap, Copy, Ticket, Download } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

interface RegistrationData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  isEmsClient: boolean
  status: string
  createdAt: string
  customerName?: string
  emsCustomerId?: string
  panelInterest: boolean
  tickets?: Array<{
    ticketNumber: string
    status: string
    qrCode: string
    issuedAt: string
    ticketSequence: number
  }>
}

export function RegistrationPendingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('id')
  
  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    if (registrationId) {
      fetchRegistration()
      // Poll for updates every 30 seconds if still pending
      const interval = setInterval(() => {
        if (registration?.status === 'PENDING') {
          fetchRegistration()
        }
      }, 30000)
      
      return () => clearInterval(interval)
    } else {
      router.push('/register')
    }
  }, [registrationId, router, registration?.status])

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
          isEmsClient: result.data.isEmsClient,
          status: result.data.status,
          createdAt: result.data.createdAt,
          customerName: result.data.customerName || result.data.companyName,
          emsCustomerId: result.data.emsCustomerId,
          panelInterest: result.data.panelInterests && result.data.panelInterests.length > 0,
          tickets: result.data.tickets || []
        })
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

  const downloadTicketPDF = async () => {
    if (!registration || !registration.tickets || registration.tickets.length === 0) {
      toast({
        title: "No tickets available",
        description: "Tickets will be available after admin approval.",
        variant: "destructive",
      })
      return
    }
    
    setDownloadingPdf(true)
    
    try {
      const response = await fetch(`/api/tickets/download?registrationId=${registrationId}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const customerName = `${registration.firstName}_${registration.lastName}`.replace(/[^a-zA-Z0-9]/g, '_')
      const filename = registration.tickets.length === 1 
        ? `EMS_VIP_Ticket_${registration.tickets[0].ticketNumber}.pdf`
        : `EMS_VIP_Tickets_${customerName}_${registration.tickets.length}tickets.pdf`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      toast({
        title: "Download Started!",
        description: `Your ticket${registration.tickets.length > 1 ? 's' : ''} ${registration.tickets.length > 1 ? 'are' : 'is'} downloading...`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'COMPLETED':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'REJECTED':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return <Badge variant="secondary">Generated</Badge>
      case 'SENT':
        return <Badge className="bg-blue-100 text-blue-800">Sent to Email</Badge>
      case 'COLLECTED':
        return <Badge className="bg-green-100 text-green-800">Collected</Badge>
      case 'USED':
        return <Badge className="bg-purple-100 text-purple-800">Used</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card>
            <CardHeader>
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
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
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Registration Not Found</h2>
            <p className="text-gray-600 mb-4">The registration could not be found.</p>
            <Link href="/register">
              <Button>Back to Registration</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              {registration.status === 'COMPLETED' ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : registration.status === 'REJECTED' ? (
                <AlertCircle className="h-6 w-6 text-red-500" />
              ) : (
                <Clock className="h-6 w-6 text-orange-500" />
              )}
              Registration Status
            </CardTitle>
            <CardDescription className="text-center text-sm">
              Your EMS customer registration
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Status Banner */}
            <div className={`p-3 border rounded-lg ${getStatusColor(registration.status)}`}>
              <div className="flex items-center gap-3">
                {registration.status === 'COMPLETED' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : registration.status === 'REJECTED' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
                <div>
                  <h3 className="font-medium text-sm">
                    {registration.status === 'PENDING' && 'Awaiting Admin Approval'}
                    {registration.status === 'COMPLETED' && 'Registration Approved ✅'}
                    {registration.status === 'REJECTED' && 'Registration Rejected'}
                  </h3>
                  <p className="text-xs">
                    {registration.status === 'PENDING' && 'We\'re verifying your EMS customer status'}
                    {registration.status === 'COMPLETED' && 'Your VIP access has been approved!'}
                    {registration.status === 'REJECTED' && 'Unable to verify EMS customer status'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tickets Section - Only show if approved and tickets exist */}
            {registration.status === 'COMPLETED' && registration.tickets && registration.tickets.length > 0 && (
              <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                <h3 className="font-medium mb-3 text-sm flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-green-600" />
                  Your VIP Ticket{registration.tickets.length > 1 ? 's' : ''}
                </h3>
                
                <div className="space-y-2">
                  {registration.tickets.map((ticket, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p className="text-xs text-gray-600">Ticket {ticket.ticketSequence || index + 1}</p>
                        <p className="font-mono text-sm font-bold">{ticket.ticketNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTicketStatusBadge(ticket.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(ticket.ticketNumber, `Ticket ${index + 1}`)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={downloadTicketPDF}
                  disabled={downloadingPdf}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {downloadingPdf ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-bounce" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF Ticket{registration.tickets.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Waiting for Approval - No Tickets Yet */}
            {registration.status === 'PENDING' && (
              <div className="p-3 border rounded-lg bg-blue-50">
                <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Ticket Generation Pending
                </h3>
                <div className="space-y-2 text-xs text-blue-800">
                  <p>✓ Registration submitted successfully</p>
                  <p>⏳ Admin reviewing your EMS customer status</p>
                  <p>🎫 Tickets will be generated after approval</p>
                  <p>📧 You'll receive email notification with tickets</p>
                </div>
              </div>
            )}

            {/* Registration Details */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2 text-sm">Registration Details</h3>
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
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium">{new Date(registration.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Type:</span>
                  <span className="font-medium">EMS Customer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">{registration.id.slice(-8)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(registration.id, 'Registration ID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Interest */}
            {registration.panelInterest && (
              <div className="p-3 border rounded-lg bg-purple-50">
                <h3 className="font-medium mb-1 text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Solar Panel Interest
                </h3>
                <p className="text-xs text-purple-800">
                  Our solar experts will be ready to discuss your energy requirements at the trade fair.
                </p>
              </div>
            )}

            {/* Event Information */}
            <div className="p-3 border rounded-lg bg-indigo-50">
              <h3 className="font-medium mb-2 text-sm">Event Details</h3>
              <div className="space-y-1 text-xs text-indigo-800">
                <p><strong>Dates:</strong> June 26 - July 6, 2025</p>
                <p><strong>Venue:</strong> Malta Fairs and Conventions Centre, Ta' Qali</p>
                <p><strong>EMS Booth:</strong> MFCC Main Hall</p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="p-3 border rounded-lg bg-yellow-50">
              <h3 className="font-medium mb-2 text-sm">
                {registration.status === 'PENDING' ? 'Next Steps' : 'Important Instructions'}
              </h3>
              {registration.status === 'PENDING' ? (
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• We'll verify your EMS customer status within 24 hours</li>
                  <li>• You'll receive email notification when approved</li>
                  <li>• Your free VIP tickets will be generated upon approval</li>
                  <li>• Check this page anytime for status updates</li>
                </ul>
              ) : registration.status === 'COMPLETED' ? (
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• Download and save your PDF tickets</li>
                  <li>• Bring valid ID matching your registration</li>
                  <li>• Arrive 30 minutes early for check-in</li>
                  <li>• Visit EMS booth in MFCC Main Hall</li>
                </ul>
              ) : (
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• Registration could not be verified</li>
                  <li>• Contact support for more information</li>
                  <li>• You may register as general public if eligible</li>
                </ul>
              )}
            </div>

            {/* Contact Information */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2 text-sm">Need Help?</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-600" />
                  <span>info@ems.com.mt</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-600" />
                  <span>+356 2123 4567</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {registration.status === 'COMPLETED' && registration.tickets && registration.tickets.length > 0 && (
                <Button 
                  onClick={downloadTicketPDF}
                  disabled={downloadingPdf}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {downloadingPdf ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-bounce" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Tickets Again
                    </>
                  )}
                </Button>
              )}
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              
              <Link href="/ticket-status" className="block">
                <Button variant="outline" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Check Status Later
                </Button>
              </Link>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                {registration.status === 'PENDING' && 'Keep this page bookmarked to check your approval status'}
                {registration.status === 'COMPLETED' && 'Thank you for choosing EMS! See you at the trade fair.'}
                {registration.status === 'REJECTED' && 'Contact support if you believe this is an error'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}