// ENHANCED: src/app/ticket-status/TicketStatusContent.tsx - VR Room Malta support
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Mail, CheckCircle, Clock, CreditCard, Download, ArrowLeft, Calendar, MapPin, Building, Phone, AlertCircle, Users, Gamepad2 } from 'lucide-react'

interface TicketData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  registrationStatus: string
  ticketStatus?: string
  isEmsClient: boolean
  createdAt: string
  ticketNumber?: string
  panelInterest?: boolean
  customerName?: string
  adminNotes?: string
  isVRBooking?: boolean
  ticketsSummary?: {
    total: number
    generated: number
    sent: number
    collected: number
    used: number
    cancelled: number
  }
  allTickets?: Array<{
    id: string
    ticketNumber: string
    status: string
    venue?: string
    ticketType?: { name: string; description?: string }
  }>
  hasMultipleRegistrations?: boolean
}

interface MultipleRegistrationsData {
  multipleRegistrations: boolean
  totalRegistrations: number
  data: Array<{
    id: string
    firstName: string
    lastName: string
    registrationStatus: string
    isEmsClient: boolean
    createdAt: string
    customerName?: string
    ticketCount: number
    adminNotes?: string
    isVRBooking?: boolean
    ticketsSummary: {
      total: number
      generated: number
      sent: number
      collected: number
      used: number
      cancelled: number
    }
    primaryTicket?: {
      ticketNumber: string
      status: string
      ticketType?: string
    }
    totalAmount: number
    hasPanelInterest: boolean
  }>
}

export default function TicketStatusContent() {
  const [searchType, setSearchType] = useState<'email' | 'ticket'>('email')
  const [searchValue, setSearchValue] = useState('')
  const [singleData, setSingleData] = useState<TicketData | null>(null)
  const [multipleData, setMultipleData] = useState<MultipleRegistrationsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)

  // Detect if any data is VR related
  const hasVRData = singleData?.isVRBooking || multipleData?.data.some(d => d.isVRBooking)

  // Theme based on VR detection
  const theme = hasVRData ? {
    bg: 'bg-[#192233]',
    cardBg: 'bg-gray-800',
    text: 'text-gray-100',
    textMuted: 'text-gray-300',
    border: 'border-gray-600',
    accent: 'text-[#01AEED]',
    accentBg: 'bg-[#01AEED]',
    buttonPrimary: 'bg-gradient-to-r from-[#01AEED] to-[#262624] hover:from-[#01AEED]/90 hover:to-[#262624]/90',
    brandName: 'VR Room Malta',
    supportEmail: 'info@vrroom.mt'
  } : {
    bg: 'bg-white',
    cardBg: 'bg-white',
    text: 'text-gray-800',
    textMuted: 'text-gray-600',
    border: 'border-gray-200',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-600',
    buttonPrimary: 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600',
    brandName: 'EMS',
    supportEmail: 'info@ems.com.mt'
  }

  const detectVRBooking = (data: any) => {
    return data.adminNotes?.includes('VR Booking') || 
           data.adminNotes?.includes('Selected experiences:') ||
           data.allTickets?.some((ticket: any) => ticket.venue === 'VR Room Malta') ||
           (!data.isEmsClient && data.ticketsSummary?.total === 0)
  }

  const handleSearchTypeChange = (type: 'email' | 'ticket') => {
    setSearchType(type)
    setSearchValue('')
    setError('')
    setSingleData(null)
    setMultipleData(null)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) {
      setError('Please enter your email or ticket number')
      return
    }

    setLoading(true)
    setError('')
    setSingleData(null)
    setMultipleData(null)

    try {
      const response = await fetch('/api/ticket-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchType,
          searchValue: searchValue.trim(),
          includeAllRegistrations: searchType === 'email'
        })
      })

      const result = await response.json()
      if (result.success) {
        if (result.multipleRegistrations && result.totalRegistrations > 1) {
          // Add VR detection to multiple registrations
          const enhancedData = {
            ...result,
            data: result.data.map((reg: any) => ({
              ...reg,
              isVRBooking: detectVRBooking(reg)
            }))
          }
          setMultipleData(enhancedData)
        } else {
          // Add VR detection to single registration
          const enhancedData = {
            ...result.data,
            isVRBooking: detectVRBooking(result.data)
          }
          setSingleData(enhancedData)
        }
      } else {
        setError(result.message || 'Unable to find registration. Please check your details and try again.')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (registrationId: string) => {
    setDownloadLoading(registrationId)
    try {
      const response = await fetch(`/api/tickets/download?registrationId=${registrationId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'tickets.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to download tickets')
      }
    } catch (error) {
      setError('Failed to download tickets. Please try again.')
    } finally {
      setDownloadLoading(null)
    }
  }

  const getStatusBadge = (status: string, isVR = false) => {
    const colors = {
      COMPLETED: 'bg-green-500 hover:bg-green-600',
      PENDING: 'bg-yellow-500 hover:bg-yellow-600',
      PAYMENT_PENDING: 'bg-orange-500 hover:bg-orange-600',
      REJECTED: 'bg-red-500 hover:bg-red-600'
    }
    const color = colors[status as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-600'
    const text = {
      COMPLETED: isVR ? 'Sessions Confirmed' : 'Completed',
      PENDING: isVR ? 'Pending Confirmation' : 'Pending Approval',
      PAYMENT_PENDING: 'Payment Required',
      REJECTED: 'Rejected'
    }[status] || status
    return <Badge className={`${color} text-white font-medium`}>{text}</Badge>
  }

  const getTicketStatusBadge = (status?: string, isVR = false) => {
    const colors = {
      SENT: 'bg-blue-500',
      GENERATED: 'bg-purple-500',
      COLLECTED: 'bg-green-500',
      USED: 'bg-indigo-500',
      CANCELLED: 'bg-red-500'
    }
    const color = colors[status as keyof typeof colors] || 'bg-gray-400'
    const text = {
      SENT: isVR ? 'Ready for Session' : 'Sent to Email',
      GENERATED: isVR ? 'Session Booked' : 'Generated',
      COLLECTED: 'Collected',
      USED: isVR ? 'Session Completed' : 'Used',
      CANCELLED: 'Cancelled'
    }[status || ''] || (isVR ? 'Not Scheduled' : 'Not Generated')
    return <Badge className={`${color} hover:opacity-80 text-white font-medium`}>{text}</Badge>
  }

  const canDownload = (data: any) => {
    return data?.registrationStatus === 'COMPLETED' && 
           data?.ticketsSummary && 
           (data.ticketsSummary.generated > 0 || data.ticketsSummary.sent > 0) &&
           data.ticketsSummary.used < data.ticketsSummary.total
  }

  const TicketSummary = ({ data, showDownload = true }: { data: any, showDownload?: boolean }) => {
    const isVR = data.isVRBooking
    return (
      <div className={`p-5 border rounded-lg shadow-sm ${
        isVR 
          ? 'border-[#01AEED]/30 bg-[#01AEED]/10' 
          : 'border-blue-200 bg-blue-50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold flex items-center gap-2 text-lg ${
            isVR ? 'text-[#01AEED]' : 'text-blue-800'
          }`}>
            {isVR ? <Gamepad2 className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            {isVR ? 'VR Sessions' : 'Tickets'} ({data.ticketsSummary?.total || data.ticketCount || 0})
          </h3>
          {showDownload && canDownload(data) && (
            <Button
              onClick={() => handleDownload(data.id)}
              disabled={downloadLoading === data.id}
              size="sm"
              className={isVR ? theme.accentBg : 'bg-blue-600 hover:bg-blue-700'}
            >
              {downloadLoading === data.id ? (
                <><Clock className="mr-2 h-4 w-4 animate-spin" />Downloading...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" />Download {isVR ? 'Sessions' : 'Tickets'}</>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {['generated', 'sent', 'collected', 'used'].map(key => (
            <div key={key} className="flex justify-between">
              <span className={`capitalize ${isVR ? 'text-gray-300' : 'text-blue-700'}`}>
                {isVR && key === 'generated' ? 'Booked' : 
                 isVR && key === 'sent' ? 'Ready' :
                 isVR && key === 'used' ? 'Completed' : key}:
              </span>
              <span className="font-medium">{data.ticketsSummary?.[key] || 0}</span>
            </div>
          ))}
        </div>

        {data.allTickets?.length > 0 && (
          <div className="space-y-2">
            <h4 className={`font-medium text-sm ${isVR ? 'text-[#01AEED]' : 'text-blue-800'}`}>
              Individual {isVR ? 'Sessions' : 'Tickets'}:
            </h4>
            {data.allTickets.map((ticket: any) => (
              <div key={ticket.id} className={`p-3 rounded border ${
                isVR 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-blue-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-mono text-xs px-2 py-1 rounded ${
                    isVR 
                      ? 'bg-[#01AEED]/20 text-[#01AEED]' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {ticket.ticketNumber}
                  </span>
                  {getTicketStatusBadge(ticket.status, isVR)}
                </div>
                {ticket.ticketType && (
                  <div className={`text-xs ${isVR ? 'text-gray-300' : 'text-blue-700'}`}>
                    {ticket.ticketType.name}
                    {ticket.ticketType.description && (
                      <span className={isVR ? 'text-gray-400' : 'text-blue-600'}> - {ticket.ticketType.description}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const StatusActions = ({ data, isMultiple = false }: { data: any, isMultiple?: boolean }) => {
    const isVR = data.isVRBooking
    return (
      <>
        {data.registrationStatus === 'PENDING' && (
          <div className={`p-5 border rounded-lg shadow-sm ${
            isVR 
              ? 'border-yellow-400/30 bg-yellow-400/10' 
              : 'border-orange-200 bg-orange-50'
          }`}>
            <h3 className={`font-semibold mb-3 text-lg ${
              isVR ? 'text-yellow-300' : 'text-orange-800'
            }`}>Next Steps</h3>
            <p className={`text-sm ${isVR ? 'text-gray-300' : 'text-orange-700'}`}>
              {isVR 
                ? 'Your VR session request is being reviewed. We\'ll contact you to schedule your sessions.'
                : 'Your registration is pending admin approval. We\'ll email you once your EMS customer status is verified.'
              }
            </p>
          </div>
        )}

        {data.registrationStatus === 'PAYMENT_PENDING' && (
          <div className={`p-5 border rounded-lg shadow-sm ${
            isVR 
              ? 'border-[#01AEED]/30 bg-[#01AEED]/10' 
              : 'border-blue-200 bg-blue-50'
          }`}>
            <h3 className={`font-semibold mb-3 text-lg ${
              isVR ? 'text-[#01AEED]' : 'text-blue-800'
            }`}>Payment Required</h3>
            <p className={`text-sm mb-4 ${isVR ? 'text-gray-300' : 'text-blue-700'}`}>
              Complete your payment to {isVR ? 'confirm your VR sessions' : 'receive your ticket'} instantly.
            </p>
            <Link href={`/payment?id=${data.id}`} className="inline-block">
              <Button className={theme.buttonPrimary}>
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Payment
              </Button>
            </Link>
          </div>
        )}

       
      </>
    )
  }

  const EventInfo = ({ isVR = false }: { isVR?: boolean }) => (
    <div className={`p-5 border rounded-lg shadow-sm ${
      isVR 
        ? 'border-purple-400/30 bg-purple-400/10' 
        : 'border-purple-200 bg-purple-50'
    }`}>
  
     
    </div>
  )

  const ContactInfo = ({ isVR = false }: { isVR?: boolean }) => (
    <div className={`p-5 border rounded-lg shadow-sm ${
      isVR 
        ? 'border-gray-600 bg-gray-700/50' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      <h3 className={`font-semibold mb-4 text-lg ${isVR ? 'text-gray-200' : 'text-gray-800'}`}>Need Help?</h3>
      <div className="space-y-3 text-sm">
        <div className={`flex items-center gap-2 ${isVR ? 'text-gray-300' : 'text-gray-700'}`}>
          <Mail className="h-4 w-4 text-gray-600" />
          <span>Email: {theme.supportEmail}</span>
        </div>
        <div className={`flex items-center gap-2 ${isVR ? 'text-gray-300' : 'text-gray-700'}`}>
          <Phone className="h-4 w-4 text-gray-600" />
          <span>Phone: +356 2123 4567</span>
        </div>
      </div>
    </div>
  )

  const resetSearch = () => {
    setSingleData(null)
    setMultipleData(null)
    setSearchValue('')
    setError('')
  }

  return (
    <div className={`ticket-status-page min-h-screen ${theme.bg} relative overflow-hidden`}>
      {/* Background Decorations - Adjusted for VR theme */}
      <div className="absolute inset-0 pointer-events-none">
        {hasVRData ? (
          // VR-themed dark background
          <>
            <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-[#01AEED]/20 to-[#262624]/20 rounded-full opacity-60"></div>
            <div className="absolute top-20 left-20 w-24 h-24 bg-gradient-to-br from-[#262624]/20 to-[#01AEED]/20 rounded-full opacity-40"></div>
            <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-[#01AEED]/15 to-cyan-400/15 rounded-full opacity-50"></div>
            <div className="absolute bottom-32 right-32 w-28 h-28 bg-gradient-to-br from-cyan-400/15 to-[#01AEED]/15 rounded-full opacity-45"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#01AEED]/10 to-cyan-400/10 rounded-full opacity-30 blur-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#01AEED] via-cyan-400 to-[#262624] opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#262624] via-cyan-400 to-[#01AEED] opacity-60"></div>
          </>
        ) : (
          // EMS-themed light background
          <>
            <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-60"></div>
            <div className="absolute top-20 left-20 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-40"></div>
            <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full opacity-50"></div>
            <div className="absolute bottom-32 right-32 w-28 h-28 bg-gradient-to-br from-purple-100 to-green-100 rounded-full opacity-45"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-50 to-blue-50 rounded-full opacity-30 blur-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 opacity-60"></div>
          </>
        )}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-block">
            <Button variant="ghost" className={`mb-4 transition-colors ${
              hasVRData 
                ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                : 'hover:bg-green-50'
            }`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className={`w-full max-w-2xl mx-auto shadow-lg ${theme.cardBg} ${theme.border}`}>
          <CardHeader className={`${theme.cardBg} border-b ${theme.border}`}>
            <CardTitle className={`text-2xl text-center flex items-center justify-center gap-2 font-heading ${theme.text}`}>
              <Search className={`h-6 w-6 ${theme.accent}`} />
              Check Your {hasVRData ? 'VR Session' : 'Registration'} Status
            </CardTitle>
            <CardDescription className={`text-center ${theme.textMuted}`}>
              Enter your email address or {hasVRData ? 'session' : 'ticket'} number to view your status
            </CardDescription>
          </CardHeader>
          
          <CardContent className={`p-6 ${theme.cardBg}`}>
            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-6">
              <div className={`flex border rounded-lg p-1 ${theme.border} ${hasVRData ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {['email', 'ticket'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSearchTypeChange(type as 'email' | 'ticket')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      searchType === type
                        ? hasVRData 
                          ? 'bg-gray-600 text-[#01AEED] shadow-sm border border-[#01AEED]/50'
                          : 'bg-white text-blue-600 shadow-sm border border-blue-200'
                        : hasVRData
                          ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {type === 'email' ? <Mail className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    {type === 'email' ? 'Email Address' : `${hasVRData ? 'Session' : 'Ticket'} Number`}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="search" className={`text-sm font-medium ${theme.text}`}>
                  {searchType === 'email' ? 'Email Address' : `${hasVRData ? 'Session' : 'Ticket'} Number`}
                </Label>
                <Input
                  id="search"
                  type={searchType === 'email' ? 'email' : 'text'}
                  placeholder={
                    searchType === 'email' 
                      ? 'Enter your email address' 
                      : `Enter your ${hasVRData ? 'session' : 'ticket'} number`
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  required
                  className={`${theme.cardBg} ${theme.border} ${theme.text} ${
                    hasVRData 
                      ? 'focus:border-[#01AEED] focus:ring-[#01AEED]' 
                      : 'focus:border-blue-400 focus:ring-blue-400'
                  } rounded-lg`}
                />
              </div>

              {error && (
                <div className={`p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-3 ${
                  hasVRData ? 'bg-red-900/20 border-red-500/30 text-red-300' : ''
                }`}>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

            </form>

            {loading && (
              <div className="space-y-4 mt-8">
                <Skeleton className={`h-4 w-full ${hasVRData ? 'bg-gray-600' : 'bg-gray-200'}`} />
                <Skeleton className={`h-16 w-full ${hasVRData ? 'bg-gray-600' : 'bg-gray-200'}`} />
                <Skeleton className={`h-12 w-full ${hasVRData ? 'bg-gray-600' : 'bg-gray-200'}`} />
              </div>
            )}

            {/* Multiple Registrations */}
            {multipleData && !loading && (
              <div className="space-y-6 mt-8">
                <div className={`p-5 border rounded-lg shadow-sm ${
                  hasVRData 
                    ? 'border-[#01AEED]/30 bg-[#01AEED]/10' 
                    : 'border-blue-200 bg-blue-50'
                }`}>
                  <h3 className={`font-semibold text-lg flex items-center gap-2 mb-2 ${
                    hasVRData ? 'text-[#01AEED]' : 'text-blue-800'
                  }`}>
                    <Users className="h-5 w-5" />
                    Multiple {hasVRData ? 'VR Bookings' : 'Registrations'} Found
                  </h3>
                  <p className={`text-sm ${hasVRData ? 'text-gray-300' : 'text-blue-700'}`}>
                    Found {multipleData.totalRegistrations} {hasVRData ? 'bookings' : 'registrations'} for <strong>{searchValue}</strong>
                  </p>
                </div>

                {multipleData.data.map((reg, index) => (
                  <div key={reg.id} className="space-y-4">
                    <div className={`p-5 border rounded-lg shadow-sm ${theme.cardBg} ${theme.border}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className={`font-semibold text-lg ${theme.text}`}>
                            {reg.isVRBooking ? 'VR Booking' : 'Registration'} #{index + 1}
                          </h4>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {reg.firstName} {reg.lastName} • {reg.isEmsClient ? 'EMS Customer' : reg.isVRBooking ? 'VR Customer' : 'General Public'} • {new Date(reg.createdAt).toLocaleDateString()}
                            {reg.customerName && ` • ${reg.customerName}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(reg.registrationStatus, reg.isVRBooking)}
                          <div className={`text-sm mt-1 ${theme.textMuted}`}>
                            {reg.ticketCount} {reg.isVRBooking ? 'session' : 'ticket'}{reg.ticketCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <TicketSummary data={reg} />
                      <div className="mt-4">
                        <StatusActions data={reg} isMultiple={true} />
                      </div>
                    </div>
                  </div>
                ))}

                <EventInfo isVR={hasVRData} />
                <ContactInfo isVR={hasVRData} />
              </div>
            )}

            {/* Single Registration */}
            {singleData && !loading && (
              <div className="space-y-6 mt-8">
                <div className={`p-5 border rounded-lg shadow-sm ${theme.cardBg} ${theme.border}`}>
                  <h3 className={`font-semibold mb-4 text-lg ${theme.text}`}>
                    {singleData.isVRBooking ? 'VR Booking' : 'Registration'} Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ['Name', `${singleData.firstName} ${singleData.lastName}`],
                      ['Email', singleData.email],
                      ['Phone', singleData.phone],
                      ['Customer Type', singleData.isEmsClient ? 'EMS Customer' : singleData.isVRBooking ? 'VR Customer' : 'General Public'],
                      ['Registered', new Date(singleData.createdAt).toLocaleDateString()]
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className={theme.textMuted}>{label}:</span>
                        <span className={`font-medium ${theme.text}`}>{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center">
                      <span className={theme.textMuted}>{singleData.isVRBooking ? 'Booking' : 'Registration'} Status:</span>
                      {getStatusBadge(singleData.registrationStatus, singleData.isVRBooking)}
                    </div>
                  </div>
                </div>

                {singleData.ticketsSummary && <TicketSummary data={singleData} />}
                
                {singleData.ticketNumber && !singleData.ticketsSummary && (
                  <div className={`p-5 border rounded-lg shadow-sm ${
                    singleData.isVRBooking 
                      ? 'border-[#01AEED]/30 bg-[#01AEED]/10' 
                      : 'border-blue-200 bg-blue-50'
                  }`}>
                    <h3 className={`font-semibold mb-4 flex items-center gap-2 text-lg ${
                      singleData.isVRBooking ? 'text-[#01AEED]' : 'text-blue-800'
                    }`}>
                      {singleData.isVRBooking ? <Gamepad2 className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                      {singleData.isVRBooking ? 'VR Session' : 'Ticket'} Status
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className={singleData.isVRBooking ? 'text-gray-300' : 'text-blue-700'}>
                          {singleData.isVRBooking ? 'Session' : 'Ticket'} Number:
                        </span>
                        <span className={`font-mono text-xs px-2 py-1 rounded border ${
                          singleData.isVRBooking 
                            ? 'bg-gray-700 border-gray-600 text-[#01AEED]' 
                            : 'bg-white border-blue-200'
                        }`}>
                          {singleData.ticketNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={singleData.isVRBooking ? 'text-gray-300' : 'text-blue-700'}>Status:</span>
                        {getTicketStatusBadge(singleData.ticketStatus, singleData.isVRBooking)}
                      </div>
                    </div>
                  </div>
                )}

                <StatusActions data={singleData} />

                {singleData.hasMultipleRegistrations && (
                  <div className={`p-4 border rounded-lg shadow-sm ${
                    singleData.isVRBooking 
                      ? 'border-[#01AEED]/30 bg-[#01AEED]/10' 
                      : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className={`flex items-center gap-2 ${
                      singleData.isVRBooking ? 'text-[#01AEED]' : 'text-blue-800'
                    }`}>
                      <Users className="h-4 w-4" />
                      <span className="font-medium text-sm">Multiple {singleData.isVRBooking ? 'Bookings' : 'Registrations'} Available</span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      singleData.isVRBooking ? 'text-gray-300' : 'text-blue-700'
                    }`}>
                      This email has multiple {singleData.isVRBooking ? 'VR bookings' : 'registrations'}. Search again to see all.
                    </p>
                  </div>
                )}

                <EventInfo isVR={singleData.isVRBooking} />
                <ContactInfo isVR={singleData.isVRBooking} />
              </div>
            )}

            {/* Actions */}
            {(singleData || multipleData) && (
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={resetSearch} 
                  className={`flex-1 ${
                    hasVRData 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Search Again
                </Button>
                <Link href="/" className="flex-1">
                  <Button 
                    variant="outline" 
                    className={`w-full ${
                      hasVRData 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}