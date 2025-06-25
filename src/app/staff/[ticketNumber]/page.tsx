// src/app/staff/verify/[ticketNumber]/page.tsx - Staff Verification Page

'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User, 
  Mail, 
  Crown, 
  Shield,
  ArrowLeft,
  Lock,
  Scan,
  Ticket,
  Calendar,
  MapPin,
  Euro
} from 'lucide-react'

interface StaffSession {
  staffId: string
  staffName: string
  role: string
  token: string
  expiresAt: string
}

interface VerificationResult {
  success: boolean
  canEnter: boolean
  message: string
  ticket?: {
    ticketNumber: string
    customerName: string
    email: string
    isEmsClient: boolean
    ticketType: string
    ticketTypeDescription?: string
    ticketTypeCategory?: string
    status: string
    purchasePrice: number
    eventDate: string
    venue: string
    boothLocation: string
  }
  checkIn?: {
    timestamp: string
    location: string
    checkedInBy: string
  }
}

export default function StaffVerificationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [staffPin, setStaffPin] = useState('')

  const ticketNumber = params.ticketNumber as string
  const staffToken = searchParams.get('token')

  useEffect(() => {
    checkStaffAuth()
  }, [])

  const checkStaffAuth = () => {
    // Check for staff token in URL
    if (staffToken) {
      // Validate token format
      if (staffToken.startsWith('staff_')) {
        const parts = staffToken.split('_')
        if (parts.length >= 2) {
          const mockSession: StaffSession = {
            staffId: parts[1],
            staffName: `Staff ${parts[1]}`,
            role: 'STAFF',
            token: staffToken,
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
          }
          setStaffSession(mockSession)
          verifyTicket(mockSession)
          return
        }
      }
    }

    // Check localStorage for existing session
    try {
      const savedSession = localStorage.getItem('staffSession')
      if (savedSession) {
        const session: StaffSession = JSON.parse(savedSession)
        const expiresAt = new Date(session.expiresAt)
        
        if (new Date() < expiresAt) {
          setStaffSession(session)
          verifyTicket(session)
          return
        }
      }
    } catch (error) {
      console.error('Error checking staff session:', error)
    }

    // No valid authentication - require staff PIN
    setNeedsAuth(true)
    setLoading(false)
  }

  const handleStaffAuth = () => {
    // Simple PIN verification (in production, use proper authentication)
    const validPins = ['1234', '5678', '9999'] // Demo PINs
    
    if (validPins.includes(staffPin)) {
      const session: StaffSession = {
        staffId: 'staff_pin',
        staffName: 'Staff Member',
        role: 'STAFF',
        token: `staff_pin_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      }
      
      localStorage.setItem('staffSession', JSON.stringify(session))
      setStaffSession(session)
      setNeedsAuth(false)
      setLoading(true)
      verifyTicket(session)
    } else {
      setError('Invalid staff PIN')
    }
  }

  const verifyTicket = async (session: StaffSession) => {
    setLoading(true)
    setError('')

    try {
      console.log('🎫 Staff verifying ticket:', ticketNumber)

      const response = await fetch('/api/staff/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          ticketNumber,
          checkedInBy: session.staffName,
          staffId: session.staffId,
          location: 'EMS Booth - Main Entrance'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Verification failed: ${response.status}`)
      }

      const verificationResult: VerificationResult = await response.json()
      setResult(verificationResult)
      
      console.log('✅ Staff verification result:', verificationResult.canEnter ? 'ALLOWED' : 'DENIED')

    } catch (err: any) {
      console.error('❌ Staff verification error:', err)
      setError(err.message || 'Failed to verify ticket')
    } finally {
      setLoading(false)
    }
  }

  // Staff PIN entry
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-xl text-purple-900">Staff Authentication Required</CardTitle>
            <p className="text-gray-600">Enter your staff PIN to verify this ticket</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <code className="text-sm font-mono text-gray-700">{ticketNumber}</code>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Staff PIN:
              </label>
              <Input
                type="password"
                placeholder="Enter your 4-digit PIN"
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStaffAuth()}
                className="text-center font-mono text-lg"
                maxLength={4}
              />
            </div>

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleStaffAuth}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={staffPin.length < 4}
            >
              <Shield className="mr-2 h-4 w-4" />
              Verify Ticket
            </Button>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/staff')}
                className="text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Staff Login
              </Button>
            </div>

            {/* Demo Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Demo PINs:</strong> 1234, 5678, 9999
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-purple-600" />
            <h2 className="text-xl font-semibold mb-2">Verifying Ticket</h2>
            <p className="text-gray-600 mb-4">Staff verification in progress...</p>
            <div className="bg-gray-100 p-3 rounded-lg">
              <code className="text-sm font-mono text-gray-700">{ticketNumber}</code>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Staff: {staffSession?.staffName}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-6 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-900">Verification Error</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <Button 
              onClick={() => verifyTicket(staffSession!)} 
              className="w-full mb-4"
            >
              Try Again
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/staff')}
              className="w-full"
            >
              Back to Staff Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main verification result
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/staff')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Staff Scanner
          </Button>
          
          <div className="text-sm text-gray-600">
            {staffSession?.staffName}
          </div>
        </div>

        {/* Main Result Card */}
        <Card className={`border-4 shadow-lg ${
          result?.canEnter 
            ? 'border-green-300 bg-green-50' 
            : 'border-red-300 bg-red-50'
        }`}>
          <CardHeader className="text-center pb-4">
            
            {/* Large Status Icon */}
            <div className="mx-auto mb-4">
              {result?.canEnter ? (
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="h-16 w-16 text-white" />
                </div>
              )}
            </div>
            
            {/* Status Title */}
            <CardTitle className={`text-3xl font-bold ${
              result?.canEnter ? 'text-green-900' : 'text-red-900'
            }`}>
              {result?.canEnter ? 'ENTRY ALLOWED' : 'ENTRY DENIED'}
            </CardTitle>
            
            {/* Status Message */}
            <p className={`text-lg font-medium mt-2 ${
              result?.canEnter ? 'text-green-700' : 'text-red-700'
            }`}>
              {result?.message}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {/* Enhanced Ticket Details */}
            {result?.ticket && (
              <div className="bg-white p-4 rounded-xl border space-y-4">
                
                {/* Ticket Number */}
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">Ticket Number</div>
                  <code className="bg-purple-100 px-3 py-2 rounded-lg text-lg font-mono font-bold text-purple-700">
                    {result.ticket.ticketNumber}
                  </code>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{result.ticket.customerName}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {result.ticket.email}
                    </div>
                  </div>
                </div>

                {/* Enhanced Ticket Type Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Ticket Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-700">Access Type:</span>
                      <Badge variant="outline" className="font-medium text-blue-800 bg-white">
                        {result.ticket.ticketType}
                      </Badge>
                    </div>
                    
                    {result.ticket.ticketTypeCategory && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-700">Category:</span>
                        <Badge variant="secondary" className="text-blue-700">
                          {result.ticket.ticketTypeCategory}
                        </Badge>
                      </div>
                    )}
                    
                    {result.ticket.ticketTypeDescription && (
                      <div className="text-sm text-blue-600 italic p-2 bg-blue-100 rounded">
                        {result.ticket.ticketTypeDescription}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-700">Price Paid:</span>
                      <span className="font-semibold text-blue-800 flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {result.ticket.isEmsClient ? 'FREE' : `€${(result.ticket.purchasePrice / 100).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Type & Status */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Customer Type:</span>
                    <div className="flex items-center gap-2">
                      {result.ticket.isEmsClient && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <Badge variant={result.ticket.isEmsClient ? "default" : "secondary"}>
                        {result.ticket.isEmsClient ? 'EMS Customer' : 'General Public'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Ticket Status:</span>
                    <Badge 
                      variant={result.ticket.status === 'USED' ? 'secondary' : 'outline'} 
                      className="font-medium"
                    >
                      {result.ticket.status}
                    </Badge>
                  </div>
                </div>

                {/* Event Details */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Event Details
                  </h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(result.ticket.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{result.ticket.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">📍</span>
                      <span>{result.ticket.boothLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Check-in Info */}
                {result.checkIn && (
                  <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>✅ Check-in Successful</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>Time: {new Date(result.checkIn.timestamp).toLocaleString()}</div>
                      <div>Location: {result.checkIn.location}</div>
                      <div>Staff: {result.checkIn.checkedInBy}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Staff Actions */}
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/staff')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Scan className="mr-2 h-4 w-4" />
                Verify Another Ticket
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Re-verify This Ticket
              </Button>
            </div>

            {/* Staff Info Footer */}
            <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
              <div>Verified by {staffSession?.staffName}</div>
              <div>{new Date().toLocaleString()}</div>
              <div>EMS Staff Verification System</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}