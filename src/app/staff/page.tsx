'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LogIn, LogOut, User, Shield, Clock, CheckCircle, XCircle, Scan, QrCode, Search, Loader2, List
} from 'lucide-react'

// --- Types ---
interface StaffSession {
  staffId: string
  staffName: string
  role: string
  loginTime: Date
  expiresAt: Date
  token: string
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
    status: string
  }
  checkIn?: {
    timestamp: string
    location: string
    checkedInBy: string
  }
}

interface SearchResult {
  ticketNumber: string
  status: string
  registration: {
    firstName: string
    lastName: string
  }
}

// --- Credentials & Daily Code ---
const STAFF_CREDENTIALS = {
  'staff1': { password: 'pass123', name: 'John Staff', role: 'STAFF' },
  'staff2': { password: 'pass456', name: 'Jane Staff', role: 'STAFF' },
  'supervisor1': { password: 'super123', name: 'Mike Supervisor', role: 'SUPERVISOR' },
}
const DAILY_CODE = 'MALTA2025'

// --- Debounce Hook ---
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

export default function StaffScanner() {
  const router = useRouter()
  // --- State Management ---
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '', dailyCode: '' })
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // --- Core Functions ---
  useEffect(() => {
    // Check for existing session on initial load
    const savedSession = localStorage.getItem('staffSession')
    if (savedSession) {
      const session: StaffSession = JSON.parse(savedSession)
      if (new Date() < new Date(session.expiresAt)) {
        setStaffSession(session)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('staffSession')
      }
    }
  }, [])

  useEffect(() => {
    // Trigger search when debounced query changes
    const searchTickets = async () => {
      if (debouncedSearchQuery.length < 4 || !staffSession) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const response = await fetch(`/api/staff/search?query=${debouncedSearchQuery}`, {
          headers: { 'Authorization': `Bearer ${staffSession.token}` },
        })
        if (response.ok) setSearchResults(await response.json())
      } catch (error) { console.error("Search failed:", error) } 
      finally { setIsSearching(false) }
    }
    searchTickets()
  }, [debouncedSearchQuery, staffSession])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')
    try {
      const { username, password, dailyCode } = loginForm
      if (dailyCode !== DAILY_CODE) throw new Error('Invalid daily access code')
      const staff = STAFF_CREDENTIALS[username as keyof typeof STAFF_CREDENTIALS]
      if (!staff || staff.password !== password) throw new Error('Invalid username or password')
      
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000)
      const token = `staff_${username}_${Date.now()}`
      const session: StaffSession = { staffId: username, staffName: staff.name, role: staff.role, loginTime: now, expiresAt, token }

      localStorage.setItem('staffSession', JSON.stringify(session))
      setStaffSession(session)
      setIsAuthenticated(true)
      
      // Handle redirect if coming from QR scan link
      const searchParams = new URLSearchParams(window.location.search)
      const redirectUrl = searchParams.get('redirect_url')
      if (redirectUrl) {
        router.push(redirectUrl)
      }
    } catch (error: any) {
      setLoginError(error.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('staffSession')
    setStaffSession(null)
    setIsAuthenticated(false)
  }

  const verifyTicket = useCallback(async (ticketNumber: string) => {
    if (!staffSession) return
    setSearchQuery('')
    setSearchResults([])
    setIsProcessing(true)
    try {
      const response = await fetch('/api/staff/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffSession.token}`,
        },
        body: JSON.stringify({ ticketNumber, checkedInBy: staffSession.staffName, staffId: staffSession.staffId }),
      })
      const result: VerificationResult = await response.json()
      setVerificationResult(result)
      if (!response.ok) console.error("Verification API Error:", result.message)
      setTimeout(() => setVerificationResult(null), 8000) // Show result for 8 seconds
    } catch (error: any) {
      setVerificationResult({ success: false, canEnter: false, message: error.message })
    } finally {
      setIsProcessing(false)
    }
  }, [staffSession])

  const getTimeRemaining = (): string => {
    if (!staffSession) return ''
    const diff = new Date(staffSession.expiresAt).getTime() - new Date().getTime()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }
  
  // --- Rendering ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-purple-600" />
            <CardTitle className="text-2xl">Staff Scanner Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="text" placeholder="Daily Access Code" value={loginForm.dailyCode} onChange={(e) => setLoginForm(p => ({ ...p, dailyCode: e.target.value.toUpperCase() }))} required />
              <Input type="text" placeholder="Staff ID" value={loginForm.username} onChange={(e) => setLoginForm(p => ({ ...p, username: e.target.value }))} required />
              <Input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm(p => ({ ...p, password: e.target.value }))} required />
              {loginError && <Alert variant="destructive"><AlertDescription>{loginError}</AlertDescription></Alert>}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} Access Scanner
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-2xl">Staff Ticket Scanner</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span><User className="inline h-4 w-4 mr-1"/>{staffSession?.staffName} ({staffSession?.role})</span>
                    <span><Clock className="inline h-4 w-4 mr-1"/>Session: {getTimeRemaining()}</span>
                </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Logout</Button>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Column */}
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Search className="mr-2"/>Manual Search</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Input placeholder="Enter last 4+ chars of ticket..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="font-mono pl-8" />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                  {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                </div>
              </div>
              <div className="h-48 overflow-y-auto space-y-2 rounded-lg bg-gray-50 p-2 border">
                {searchResults.length > 0 ? (
                  searchResults.map((ticket) => (
                    <div key={ticket.ticketNumber} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
                      <div>
                        <p className="font-mono font-semibold">{ticket.ticketNumber}</p>
                        <p className="text-xs text-gray-500">{ticket.registration.firstName} {ticket.registration.lastName} ({ticket.status})</p>
                      </div>
                      <Button size="sm" onClick={() => verifyTicket(ticket.ticketNumber)} disabled={isProcessing}>Verify</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 pt-16">{searchQuery.length > 3 ? 'No results found.' : 'Ready to search.'}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Result Column */}
          <Card className="flex flex-col">
            <CardHeader><CardTitle className="flex items-center"><QrCode className="mr-2"/>Verification Result</CardTitle></CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              {isProcessing ? <Loader2 className="h-12 w-12 animate-spin text-purple-600"/> : 
               verificationResult ? (
                <div className={`text-center p-4 rounded-lg w-full ${verificationResult.canEnter ? 'bg-green-100' : 'bg-red-100'}`}>
                  {verificationResult.canEnter ? <CheckCircle className="h-16 w-16 mx-auto text-green-600"/> : <XCircle className="h-16 w-16 mx-auto text-red-600"/>}
                  <h3 className={`text-2xl font-bold mt-2 ${verificationResult.canEnter ? 'text-green-800' : 'text-red-800'}`}>
                    {verificationResult.canEnter ? 'ENTRY ALLOWED' : 'ENTRY DENIED'}
                  </h3>
                  <p className="font-semibold">{verificationResult.message}</p>
                  {verificationResult.ticket && <p className="text-sm font-mono mt-2">{verificationResult.ticket.ticketNumber}</p>}
                </div>
               ) : (
                <div className="text-center text-gray-500">
                    <Scan className="h-12 w-12 mx-auto mb-2"/>
                    <p>Awaiting verification...</p>
                </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
