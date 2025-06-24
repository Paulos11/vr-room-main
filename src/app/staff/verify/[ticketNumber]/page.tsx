'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, Shield, ArrowLeft } from 'lucide-react'

// --- Types ---
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
  }
}

export default function StaffVerificationPage() {
  const params = useParams()
  const router = useRouter()
  
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null)

  const ticketNumber = params.ticketNumber as string

  useEffect(() => {
    const handleVerification = async () => {
      let session: StaffSession | null = null;
      try {
        const savedSession = localStorage.getItem('staffSession')
        if (savedSession) {
          const parsedSession: StaffSession = JSON.parse(savedSession)
          if (new Date() < new Date(parsedSession.expiresAt)) {
            session = parsedSession
            setStaffSession(session)
          }
        }
      } catch (e) { console.error("Failed to parse staff session", e) }

      if (!session) {
        console.log("No valid staff session found. Redirecting to login.")
        const redirectUrl = encodeURIComponent(window.location.pathname)
        router.push(`/staff?redirect_url=${redirectUrl}`)
        return
      }

      await verifyTicket(session)
    }
    
    if (ticketNumber) {
        handleVerification()
    }
  }, [ticketNumber]) // Rerun if ticket number changes

  const verifyTicket = async (session: StaffSession) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/staff/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
        body: JSON.stringify({
          ticketNumber,
          checkedInBy: session.staffName,
          staffId: session.staffId,
          location: 'EMS Booth - QR Scan',
        }),
      })
      const verificationResult: VerificationResult = await response.json()
      setResult(verificationResult)
      if (!response.ok) throw new Error(verificationResult.message || 'Verification failed')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-white">
          <Loader2 className="h-24 w-24 animate-spin mx-auto mb-6" />
          <h2 className="text-3xl font-bold">Verifying Ticket</h2>
          <p className="text-lg font-mono bg-white/20 px-3 py-1 rounded-md mt-4">{ticketNumber}</p>
          {staffSession && <p className="mt-4 opacity-80">Authenticated as {staffSession.staffName}</p>}
        </div>
      )
    }

    if (error) {
       return renderResult(false, 'Verification Error', error)
    }

    if (result) {
        return renderResult(result.canEnter, result.canEnter ? 'Entry Allowed' : 'Entry Denied', result.message)
    }

    return null
  }
  
  const renderResult = (isSuccess: boolean, title: string, message: string) => {
     return (
        <div className="text-center text-white w-full max-w-md mx-auto">
            {isSuccess ? <CheckCircle className="h-32 w-32 mx-auto"/> : <XCircle className="h-32 w-32 mx-auto"/>}
            <h1 className="text-5xl font-extrabold mt-6">{title}</h1>
            <p className="text-xl mt-4 opacity-90">{message}</p>
            {result?.ticket && (
                 <div className="bg-white/20 rounded-lg p-4 mt-6 text-left space-y-2">
                    <div className="flex justify-between border-b border-white/30 pb-1"><span>Ticket:</span><span className="font-mono">{result.ticket.ticketNumber}</span></div>
                    <div className="flex justify-between"><span>Name:</span><span className="font-semibold">{result.ticket.customerName}</span></div>
                 </div>
            )}
             <Button onClick={() => router.push('/staff')} className="mt-8 w-full bg-white text-purple-700 hover:bg-gray-200 text-lg py-6">
                <ArrowLeft className="mr-2 h-5 w-5"/> Back to Scanner
            </Button>
        </div>
     )
  }

  return (
    <div className={`min-h-screen p-4 flex items-center justify-center transition-colors duration-500 ${
        loading ? 'bg-purple-600' : result?.canEnter ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {renderContent()}
    </div>
  )
}