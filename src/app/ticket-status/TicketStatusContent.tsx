// COMPRESSED: src/app/ticket-status/TicketStatusContent.tsx - Reduced file size, same functionality
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Mail, CheckCircle, Clock, CreditCard, Download, ArrowLeft, Calendar, MapPin, Building, Phone, AlertCircle, Users } from 'lucide-react'

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
          setMultipleData(result)
        } else {
          setSingleData(result.data)
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

  const getStatusBadge = (status: string) => {
    const colors = {
      COMPLETED: 'bg-green-500 hover:bg-green-600',
      PENDING: 'bg-yellow-500 hover:bg-yellow-600',
      PAYMENT_PENDING: 'bg-orange-500 hover:bg-orange-600',
      REJECTED: 'bg-red-500 hover:bg-red-600'
    }
    const color = colors[status as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-600'
    const text = {
      COMPLETED: 'Completed',
      PENDING: 'Pending Approval',
      PAYMENT_PENDING: 'Payment Required',
      REJECTED: 'Rejected'
    }[status] || status
    return <Badge className={`${color} text-white font-medium`}>{text}</Badge>
  }

  const getTicketStatusBadge = (status?: string) => {
    const colors = {
      SENT: 'bg-blue-500',
      GENERATED: 'bg-purple-500',
      COLLECTED: 'bg-green-500',
      USED: 'bg-indigo-500',
      CANCELLED: 'bg-red-500'
    }
    const color = colors[status as keyof typeof colors] || 'bg-gray-400'
    const text = {
      SENT: 'Sent to Email',
      GENERATED: 'Generated',
      COLLECTED: 'Collected',
      USED: 'Used',
      CANCELLED: 'Cancelled'
    }[status || ''] || 'Not Generated'
    return <Badge className={`${color} hover:opacity-80 text-white font-medium`}>{text}</Badge>
  }

  const canDownload = (data: any) => {
    return data?.registrationStatus === 'COMPLETED' && 
           data?.ticketsSummary && 
           (data.ticketsSummary.generated > 0 || data.ticketsSummary.sent > 0) &&
           data.ticketsSummary.used < data.ticketsSummary.total
  }

  const TicketSummary = ({ data, showDownload = true }: { data: any, showDownload?: boolean }) => (
    <div className="p-5 border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2 text-blue-800 text-lg">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          Tickets ({data.ticketsSummary?.total || data.ticketCount || 0})
        </h3>
        {showDownload && canDownload(data) && (
          <Button
            onClick={() => handleDownload(data.id)}
            disabled={downloadLoading === data.id}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {downloadLoading === data.id ? (
              <><Clock className="mr-2 h-4 w-4 animate-spin" />Downloading...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" />Download Tickets</>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        {['generated', 'sent', 'collected', 'used'].map(key => (
          <div key={key} className="flex justify-between">
            <span className="text-blue-700 capitalize">{key}:</span>
            <span className="font-medium">{data.ticketsSummary?.[key] || 0}</span>
          </div>
        ))}
      </div>

      {data.allTickets?.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-blue-800 text-sm">Individual Tickets:</h4>
          {data.allTickets.map((ticket: any) => (
            <div key={ticket.id} className="bg-white p-3 rounded border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                  {ticket.ticketNumber}
                </span>
                {getTicketStatusBadge(ticket.status)}
              </div>
              {ticket.ticketType && (
                <div className="text-xs text-blue-700">
                  {ticket.ticketType.name}
                  {ticket.ticketType.description && (
                    <span className="text-blue-600"> - {ticket.ticketType.description}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.primaryTicket && !data.allTickets && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
              {data.primaryTicket.ticketNumber}
            </span>
            <div className="flex items-center gap-2">
              {getTicketStatusBadge(data.primaryTicket.status)}
              {data.primaryTicket.ticketType && (
                <span className="text-sm text-gray-600">{data.primaryTicket.ticketType}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const StatusActions = ({ data, isMultiple = false }: { data: any, isMultiple?: boolean }) => (
    <>
      {data.registrationStatus === 'PENDING' && (
        <div className="p-5 border border-orange-200 rounded-lg bg-orange-50 shadow-sm">
          <h3 className="font-semibold mb-3 text-orange-800 text-lg">Next Steps</h3>
          <p className="text-sm text-orange-700">
            Your registration is pending admin approval. We'll email you once your EMS customer status is verified.
          </p>
        </div>
      )}

      {data.registrationStatus === 'PAYMENT_PENDING' && (
        <div className="p-5 border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
          <h3 className="font-semibold mb-3 text-blue-800 text-lg">Payment Required</h3>
          <p className="text-sm text-blue-700 mb-4">Complete your payment to receive your ticket instantly.</p>
          <Link href={`/payment?id=${data.id}`} className="inline-block">
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white">
              <CreditCard className="mr-2 h-4 w-4" />
              Complete Payment
            </Button>
          </Link>
        </div>
      )}

      {data.registrationStatus === 'COMPLETED' && data.ticketsSummary?.sent > 0 && (
        <div className="p-5 border border-green-200 rounded-lg bg-green-50 shadow-sm">
          <h3 className="font-semibold mb-3 text-green-800 text-lg">Ready for Event</h3>
          <p className="text-sm text-green-700">
            Your {data.ticketsSummary.total > 1 ? 'tickets have' : 'ticket has'} been generated and are ready for download.
          </p>
        </div>
      )}

      {data.registrationStatus === 'REJECTED' && (
        <div className="p-5 border border-red-200 rounded-lg bg-red-50 shadow-sm">
          <h3 className="font-semibold mb-3 text-red-800 text-lg">Registration Rejected</h3>
          <p className="text-sm text-red-700">
            Unfortunately, we were unable to verify your EMS customer status. Please contact support.
          </p>
        </div>
      )}

      {(data.panelInterest || data.hasPanelInterest) && (
        <div className="p-5 border border-yellow-200 rounded-lg bg-yellow-50 shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-800 text-lg">
            <Building className="h-5 w-5 text-yellow-600" />
            Solar Panel Interest
          </h3>
          <p className="text-sm text-yellow-800">
            {isMultiple ? 'Solar panel interest registered' : 
             'You\'ve expressed interest in EMS solar panels. Our experts will be ready to discuss your requirements at our booth.'}
          </p>
        </div>
      )}
    </>
  )

  const EventInfo = () => (
    <div className="p-5 border border-purple-200 rounded-lg bg-purple-50 shadow-sm">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-purple-800 text-lg">
        <Calendar className="h-5 w-5 text-purple-600" />
        Event Information
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-purple-700">
          <Calendar className="h-4 w-4" />
          <span><strong>Dates:</strong> June 26 - July 6, 2025</span>
        </div>
        <div className="flex items-center gap-2 text-purple-700">
          <MapPin className="h-4 w-4" />
          <span><strong>Venue:</strong> Malta Fairs and Conventions Centre, Ta' Qali</span>
        </div>
        <div className="flex items-center gap-2 text-purple-700">
          <Building className="h-4 w-4" />
          <span><strong>EMS Booth:</strong> MFCC Main Hall</span>
        </div>
      </div>
    </div>
  )

  const ContactInfo = () => (
    <div className="p-5 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
      <h3 className="font-semibold mb-4 text-gray-800 text-lg">Need Help?</h3>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Mail className="h-4 w-4 text-gray-600" />
          <span>Email: info@ems.com.mt</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
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
    <div className="ticket-status-page min-h-screen bg-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-60"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full opacity-50"></div>
        <div className="absolute bottom-32 right-32 w-28 h-28 bg-gradient-to-br from-purple-100 to-green-100 rounded-full opacity-45"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-50 to-blue-50 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 opacity-60"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-block">
            <Button variant="ghost" className="mb-4 hover:bg-green-50 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="w-full max-w-2xl mx-auto bg-white shadow-lg border border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2 font-heading text-gray-800">
              <Search className="h-6 w-6 text-blue-600" />
              Check Your Registration Status
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your email address or ticket number to view your registration and ticket status
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 bg-white">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50">
                {['email', 'ticket'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSearchTypeChange(type as 'email' | 'ticket')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      searchType === type
                        ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {type === 'email' ? <Mail className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    {type === 'email' ? 'Email Address' : 'Ticket Number'}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                  {searchType === 'email' ? 'Email Address' : 'Ticket Number'}
                </Label>
                <Input
                  id="search"
                  type={searchType === 'email' ? 'email' : 'text'}
                  placeholder={
                    searchType === 'email' 
                      ? 'Enter your email address' 
                      : 'Enter your ticket number (e.g., TKT-123456-ABCDEF)'
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  required
                  className="bg-white border border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                />
              </div>

              {error && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
              >
                {loading ? (
                  <><Clock className="mr-2 h-5 w-5 animate-spin" />Searching...</>
                ) : (
                  <><Search className="mr-2 h-5 w-5" />Check Status</>
                )}
              </Button>
            </form>

            {loading && (
              <div className="space-y-4 mt-8">
                <Skeleton className="h-4 w-full bg-gray-200" />
                <Skeleton className="h-16 w-full bg-gray-200" />
                <Skeleton className="h-12 w-full bg-gray-200" />
              </div>
            )}

            {/* Multiple Registrations */}
            {multipleData && !loading && (
              <div className="space-y-6 mt-8">
                <div className="p-5 border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
                  <h3 className="font-semibold text-lg text-blue-800 flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5" />
                    Multiple Registrations Found
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Found {multipleData.totalRegistrations} registrations for <strong>{searchValue}</strong>
                  </p>
                </div>

                {multipleData.data.map((reg, index) => (
                  <div key={reg.id} className="space-y-4">
                    <div className="p-5 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 text-lg">Registration #{index + 1}</h4>
                          <p className="text-sm text-gray-600">
                            {reg.firstName} {reg.lastName} • {reg.isEmsClient ? 'EMS Customer' : 'General Public'} • {new Date(reg.createdAt).toLocaleDateString()}
                            {reg.customerName && ` • ${reg.customerName}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(reg.registrationStatus)}
                          <div className="text-sm text-gray-600 mt-1">
                            {reg.ticketCount} ticket{reg.ticketCount !== 1 ? 's' : ''}
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

                <EventInfo />
                <ContactInfo />
              </div>
            )}

            {/* Single Registration */}
            {singleData && !loading && (
              <div className="space-y-6 mt-8">
                <div className="p-5 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="font-semibold mb-4 text-gray-800 text-lg">Registration Details</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ['Name', `${singleData.firstName} ${singleData.lastName}`],
                      ['Email', singleData.email],
                      ['Phone', singleData.phone],
                      ['Customer Type', singleData.isEmsClient ? 'EMS Customer' : 'General Public'],
                      ['Registered', new Date(singleData.createdAt).toLocaleDateString()]
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-gray-600">{label}:</span>
                        <span className="font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Registration Status:</span>
                      {getStatusBadge(singleData.registrationStatus)}
                    </div>
                  </div>
                </div>

                {singleData.ticketsSummary && <TicketSummary data={singleData} />}
                
                {singleData.ticketNumber && !singleData.ticketsSummary && (
                  <div className="p-5 border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-800 text-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      Ticket Status
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Ticket Number:</span>
                        <span className="font-mono text-xs bg-white px-2 py-1 rounded border">{singleData.ticketNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Status:</span>
                        {getTicketStatusBadge(singleData.ticketStatus)}
                      </div>
                    </div>
                  </div>
                )}

                <StatusActions data={singleData} />

                {singleData.hasMultipleRegistrations && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Users className="h-4 w-4" />
                      <span className="font-medium text-sm">Multiple Registrations Available</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">This email has multiple registrations. Search again to see all.</p>
                  </div>
                )}

                <EventInfo />
                <ContactInfo />
              </div>
            )}

            {/* Actions */}
            {(singleData || multipleData) && (
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={resetSearch} className="flex-1 border border-gray-300 hover:bg-gray-50">
                  Search Again
                </Button>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full border border-gray-300 hover:bg-gray-50">
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