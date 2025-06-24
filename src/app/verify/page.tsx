// src/app/verify/[ticketNumber]/page.tsx - Direct ticket verification page
'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User, 
  Mail, 
  Calendar,
  MapPin,
  Crown,
  AlertTriangle,
  ArrowLeft,
  Scan
} from 'lucide-react'

interface TicketData {
  ticketNumber: string
  customerName: string
  email: string
  isEmsClient: boolean
  ticketType: string
  status: string
}

interface VerificationResult {
  success: boolean
  canEnter: boolean
  message: string
  ticket?: TicketData
}

export default function TicketVerificationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const ticketNumber = params.ticketNumber as string
  const token = searchParams.get('token')

  useEffect(() => {
    if (ticketNumber) {
      verifyTicket()
    }
  }, [ticketNumber, token])

  const verifyTicket = async () => {
    setLoading(true)
    setError('')

    try {
      const url = new URL('/api/verify', window.location.origin)
      if (ticketNumber) url.searchParams.set('ticket', ticketNumber)
      if (token) url.searchParams.set('token', token)

      const response = await fetch(url.toString())
      const result: VerificationResult = await response.json()
      
      setVerificationResult(result)
    } catch (err) {
      console.error('Verification error:', err)
      setError('Failed to verify ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Verifying Ticket</h2>
            <p className="text-gray-600">Please wait while we check your ticket...</p>
            <div className="mt-4 text-sm text-gray-500">
              Ticket: <code className="bg-gray-100 px-2 py-1 rounded">{ticketNumber}</code>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-900">Verification Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={verifyTicket} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        
        {/* Back Link */}
        <Link href="/" className="inline-block">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Verification Result Card */}
        <Card className={`border-2 ${verificationResult?.canEnter ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              {verificationResult?.canEnter ? (
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            
            <CardTitle className={`text-2xl ${verificationResult?.canEnter ? 'text-green-900' : 'text-red-900'}`}>
              {verificationResult?.canEnter ? 'VALID TICKET' : 'INVALID TICKET'}
            </CardTitle>
            
            <p className={`text-lg ${verificationResult?.canEnter ? 'text-green-700' : 'text-red-700'}`}>
              {verificationResult?.message}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Ticket Details */}
            {verificationResult?.ticket && (
              <div className="bg-white p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Ticket Number:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {verificationResult.ticket.ticketNumber}
                  </code>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium">{verificationResult.ticket.customerName}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {verificationResult.ticket.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Customer Type:</span>
                  <div className="flex items-center gap-2">
                    {verificationResult.ticket.isEmsClient && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    <Badge variant={verificationResult.ticket.isEmsClient ? "default" : "secondary"}>
                      {verificationResult.ticket.isEmsClient ? 'EMS Customer' : 'General Public'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Access Type:</span>
                  <Badge variant="outline">{verificationResult.ticket.ticketType}</Badge>
                </div>
              </div>
            )}

            {/* Event Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Information
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>June 26 - July 6, 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>Malta Fairs and Conventions Centre</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📍</span>
                  <span>EMS Booth - Main Hall</span>
                </div>
              </div>
            </div>

            {/* Entry Instructions */}
            {verificationResult?.canEnter ? (
              <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Entry Instructions:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✅ Present this screen OR your printed ticket at the entrance</li>
                  <li>✅ Bring a valid photo ID for verification</li>
                  <li>✅ From 6:30 PM Onwards</li>
                </ul>
              </div>
            ) : (
              <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Entry Denied
                </h3>
                <p className="text-sm text-red-800">
                  This ticket cannot be used for entry. Please contact support if you believe this is an error.
                </p>
              </div>
            )}

            {/* Contact Support */}
            <div className="bg-gray-100 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div>📧 support@emstickets.com</div>
                <div>📞 +356 2123 4567</div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="flex gap-2">
              <Button onClick={verifyTicket} variant="outline" className="flex-1">
                <Scan className="mr-2 h-4 w-4" />
                Re-verify
              </Button>
              <Link href="/admin/scanner" className="flex-1">
                <Button variant="outline" className="w-full">
                  Admin Scanner
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}