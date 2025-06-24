// src/app/scanner/page.tsx - Protected Scanner with Staff Login

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LogIn, 
  LogOut, 
  User, 
  Lock, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  Scan
} from 'lucide-react'

// Types
interface StaffSession {
  staffId: string
  staffName: string
  role: string
  loginTime: Date
  expiresAt: Date
}

interface VerificationResult {
  success: boolean
  canEnter: boolean
  message: string
  ticket?: any
}

// Staff credentials (in production, use database)
const STAFF_CREDENTIALS = {
  'staff1': { password: 'pass123', name: 'John Doe', role: 'STAFF' },
  'staff2': { password: 'pass456', name: 'Jane Smith', role: 'STAFF' },
  'manager1': { password: 'manager123', name: 'Mike Manager', role: 'MANAGER' },
  'admin1': { password: 'admin123', name: 'Admin User', role: 'ADMIN' }
}

// Daily access code (changes daily)
const DAILY_CODE = 'MALTA2025'

export default function ProtectedScanner() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '', dailyCode: '' })
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Scanner state
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [manualTicket, setManualTicket] = useState('')

  // Check existing session on load
  useEffect(() => {
    checkExistingSession()
  }, [])

  // Check if there's a valid session in localStorage
  const checkExistingSession = () => {
    try {
      const savedSession = localStorage.getItem('staffSession')
      if (savedSession) {
        const session: StaffSession = JSON.parse(savedSession)
        const now = new Date()
        const expiresAt = new Date(session.expiresAt)
        
        if (now < expiresAt) {
          console.log('✅ Valid session found')
          setStaffSession(session)
          setIsAuthenticated(true)
        } else {
          console.log('⏰ Session expired')
          localStorage.removeItem('staffSession')
        }
      }
    } catch (error) {
      console.error('Error checking session:', error)
      localStorage.removeItem('staffSession')
    }
  }

  // Handle staff login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')

    try {
      const { username, password, dailyCode } = loginForm

      // Validate daily code
      if (dailyCode !== DAILY_CODE) {
        throw new Error('Invalid daily access code')
      }

      // Validate staff credentials
      const staff = STAFF_CREDENTIALS[username as keyof typeof STAFF_CREDENTIALS]
      if (!staff || staff.password !== password) {
        throw new Error('Invalid username or password')
      }

      // Create session (8 hours)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000) // 8 hours

      const session: StaffSession = {
        staffId: username,
        staffName: staff.name,
        role: staff.role,
        loginTime: now,
        expiresAt
      }

      // Save session
      localStorage.setItem('staffSession', JSON.stringify(session))
      setStaffSession(session)
      setIsAuthenticated(true)
      setLoginForm({ username: '', password: '', dailyCode: '' })

      console.log('✅ Staff logged in:', staff.name)

    } catch (error: any) {
      setLoginError(error.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('staffSession')
    setStaffSession(null)
    setIsAuthenticated(false)
    setVerificationResult(null)
    setScanCount(0)
    console.log('👋 Staff logged out')
  }

  // Verify ticket
  const verifyTicket = useCallback(async (ticketNumber: string) => {
    if (!isAuthenticated || !staffSession) {
      setLoginError('Please log in to verify tickets')
      return
    }

    setIsProcessing(true)

    try {
      console.log('🎫 Verifying ticket:', ticketNumber, 'by:', staffSession.staffName)

      // Call your existing API
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber,
          checkedInBy: staffSession.staffName,
          staffId: staffSession.staffId,
          location: 'EMS Booth - Main Entrance'
        })
      })

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`)
      }

      const result: VerificationResult = await response.json()
      setVerificationResult(result)
      setScanCount(prev => prev + 1)

      // Auto-clear after 4 seconds
      setTimeout(() => {
        setVerificationResult(null)
      }, 4000)

    } catch (error: any) {
      console.error('❌ Verification error:', error)
      setVerificationResult({
        success: false,
        canEnter: false,
        message: error.message || 'Verification failed'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [isAuthenticated, staffSession])

  // Handle manual ticket entry
  const handleManualVerify = () => {
    if (manualTicket.trim()) {
      verifyTicket(manualTicket.trim())
      setManualTicket('')
    }
  }

  // Extract ticket from QR URL
  const extractTicketFromUrl = (url: string): string | null => {
    try {
      // Handle URLs like: https://yourapp.com/verify/TKT-2025-ABC123
      const match = url.match(/\/verify\/([^?]+)/)
      if (match) return match[1]
      
      // Handle direct ticket numbers
      if (url.startsWith('TKT-')) return url
      
      return null
    } catch {
      return null
    }
  }

  // Format time remaining
  const getTimeRemaining = (): string => {
    if (!staffSession) return ''
    
    const now = new Date()
    const expiresAt = new Date(staffSession.expiresAt)
    const diff = expiresAt.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m remaining`
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Staff Login Required</CardTitle>
            <p className="text-gray-600">Enter your credentials to access the scanner</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Daily Code */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Daily Access Code:
                </label>
                <Input
                  type="text"
                  placeholder="Enter today's code"
                  value={loginForm.dailyCode}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, dailyCode: e.target.value.toUpperCase() }))}
                  className="font-mono"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Username:
                </label>
                <Input
                  type="text"
                  placeholder="staff1, manager1, etc."
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Password:
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              {/* Error */}
              {loginError && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    {loginError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Logging in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Login to Scanner
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Demo Credentials:</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div><strong>Daily Code:</strong> MALTA2025</div>
                <div><strong>Staff:</strong> staff1 / pass123</div>
                <div><strong>Manager:</strong> manager1 / manager123</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main scanner interface (authenticated)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header with staff info */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Shield className="h-8 w-8" />
                  Secure Ticket Scanner
                </CardTitle>
                <div className="mt-2 space-y-1 text-green-100">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Logged in as: <strong>{staffSession?.staffName}</strong> ({staffSession?.role})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Session: {getTimeRemaining()}</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Manual Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Ticket Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Instructions */}
              <Alert className="bg-blue-50 border-blue-200">
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  <strong>How to scan:</strong> Use any QR scanner app → Copy the ticket number → Paste below
                </AlertDescription>
              </Alert>

              {/* Manual Entry */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ticket Number or QR URL:
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="TKT-2025-XXXXXX or paste QR URL"
                    value={manualTicket}
                    onChange={(e) => {
                      const value = e.target.value
                      // Try to extract ticket number from URL
                      const extracted = extractTicketFromUrl(value)
                      setManualTicket(extracted || value)
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualVerify()}
                    className="flex-1 font-mono"
                    disabled={isProcessing}
                  />
                  <Button 
                    onClick={handleManualVerify}
                    disabled={!manualTicket.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </div>

              {/* Scan Count */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{scanCount}</div>
                <div className="text-sm text-gray-600">Scans by {staffSession?.staffName}</div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Verification Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Verifying ticket...</p>
                </div>
              ) : verificationResult ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="text-center">
                    {verificationResult.canEnter ? (
                      <div className="inline-flex items-center gap-3 bg-green-100 text-green-800 px-6 py-3 rounded-2xl text-xl font-bold">
                        <CheckCircle className="h-8 w-8" />
                        ENTRY ALLOWED
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-3 bg-red-100 text-red-800 px-6 py-3 rounded-2xl text-xl font-bold">
                        <XCircle className="h-8 w-8" />
                        ENTRY DENIED
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div className="text-center">
                    <p className={`text-lg font-medium ${verificationResult.canEnter ? 'text-green-700' : 'text-red-700'}`}>
                      {verificationResult.message}
                    </p>
                  </div>

                  {/* Ticket Details */}
                  {verificationResult.ticket && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div><strong>Customer:</strong> {verificationResult.ticket.customerName}</div>
                        <div><strong>Email:</strong> {verificationResult.ticket.email}</div>
                        <div><strong>Type:</strong> {verificationResult.ticket.ticketType}</div>
                      </div>
                    </div>
                  )}

                  {/* Staff Info */}
                  <div className="text-center text-xs text-gray-500 pt-2 border-t">
                    Verified by {staffSession?.staffName} at {new Date().toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Ready to verify tickets</p>
                  <p className="text-sm mt-2">Enter ticket number above</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}