
// src/app/ticket-status/page.tsx - Updated with real API calls
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Mail, CheckCircle, Clock, CreditCard, Download, Home, Calendar, MapPin, Building, Phone, AlertCircle } from 'lucide-react'

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
  qrCode?: string
  pdfUrl?: string
  eventDate: string
  venue: string
  panelInterest?: boolean
  customerName?: string
  emsCustomerId?: string
}

export default function TicketStatusPage() {
  const [searchType, setSearchType] = useState<'email' | 'ticket'>('email')
  const [searchValue, setSearchValue] = useState('')
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchValue.trim()) {
      setError('Please enter your email or ticket number')
      return
    }

    setLoading(true)
    setError('')
    setTicketData(null)

    try {
      const response = await fetch('/api/ticket-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchType,
          searchValue: searchValue.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        setTicketData(result.data)
      } else {
        setError(result.message || 'Unable to find registration. Please check your details and try again.')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending Approval</Badge>
      case 'PAYMENT_PENDING':
        return <Badge variant="outline">Payment Required</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTicketStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Not Generated</Badge>
    
    switch (status) {
      case 'SENT':
        return <Badge className="bg-blue-100 text-blue-800">Sent to Email</Badge>
      case 'GENERATED':
        return <Badge variant="secondary">Generated</Badge>
      case 'COLLECTED':
        return <Badge className="bg-green-100 text-green-800">Collected</Badge>
      case 'USED':
        return <Badge className="bg-purple-100 text-purple-800">Used</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Search className="h-6 w-6" />
              Check Your Registration Status
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address or ticket number to view your registration and ticket status
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={searchType === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchType('email')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={searchType === 'ticket' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchType('ticket')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ticket Number
                </Button>
              </div>

              <div>
                <Label htmlFor="search">
                  {searchType === 'email' ? 'Email Address' : 'Ticket Number'}
                </Label>
                <Input
                  id="search"
                  type={searchType === 'email' ? 'email' : 'text'}
                  placeholder={
                    searchType === 'email' 
                      ? 'Enter your email address' 
                      : 'Enter your ticket number (e.g., EMS-2025-001234)'
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 border rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
            </form>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {/* Results */}
            {ticketData && !loading && (
              <div className="space-y-6 mt-8">
                {/* Registration Status */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-3">Registration Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-medium">{ticketData.firstName} {ticketData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{ticketData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-medium">{ticketData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Type:</span>
                      <span className="font-medium">
                        {ticketData.isEmsClient ? 'EMS Customer' : 'General Public'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Registration Status:</span>
                      {getStatusBadge(ticketData.registrationStatus)}
                    </div>
                    <div className="flex justify-between">
                      <span>Registered:</span>
                      <span>{new Date(ticketData.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Status */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Ticket Status
                  </h3>
                  <div className="space-y-2 text-sm">
                    {ticketData.ticketNumber ? (
                      <>
                        <div className="flex justify-between">
                          <span>Ticket Number:</span>
                          <span className="font-mono text-xs">{ticketData.ticketNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          {getTicketStatusBadge(ticketData.ticketStatus)}
                        </div>
                        {ticketData.pdfUrl && (
                          <div className="flex justify-between">
                            <span>Ticket PDF:</span>
                            <Button size="sm" variant="outline" asChild>
                              <a href={ticketData.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-3 w-3" />
                                Download
                              </a>
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-orange-700">
                        <Clock className="h-4 w-4 inline mr-2" />
                        Ticket not yet generated
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Information */}
                <div className="p-4 border rounded-lg bg-purple-50">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    Event Information
                  </h3>
                  <div className="space-y-2 text-sm text-purple-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span><strong>Dates:</strong> July 26 - August 6, 2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span><strong>Venue:</strong> Malta Fairs and Conventions Centre, Ta' Qali</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span><strong>EMS Booth:</strong> MFCC Main Hall</span>
                    </div>
                  </div>
                </div>

                {/* Panel Interest */}
                {ticketData.panelInterest && (
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Building className="h-4 w-4 text-yellow-600" />
                      Solar Panel Interest
                    </h3>
                    <p className="text-sm text-yellow-800">
                      You've expressed interest in EMS solar panels. Our experts will be ready to discuss 
                      your requirements at our booth during the trade fair.
                    </p>
                  </div>
                )}

                {/* Next Steps Based on Status */}
                {ticketData.registrationStatus === 'PENDING' && (
                  <div className="p-4 border rounded-lg bg-orange-50">
                    <h3 className="font-medium mb-2">Next Steps</h3>
                    <p className="text-sm text-orange-800">
                      Your registration is pending admin approval. We'll email you once your EMS customer status is verified.
                    </p>
                  </div>
                )}

                {ticketData.registrationStatus === 'PAYMENT_PENDING' && (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h3 className="font-medium mb-2">Payment Required</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Complete your €50 payment to receive your ticket instantly.
                    </p>
                    <Button asChild>
                      <Link href={`/payment?id=${ticketData.id}`}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Complete Payment
                      </Link>
                    </Button>
                  </div>
                )}

                {ticketData.registrationStatus === 'COMPLETED' && ticketData.ticketStatus === 'SENT' && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h3 className="font-medium mb-2">Ready for Event</h3>
                    <p className="text-sm text-green-800">
                      Your ticket has been sent to your email. Present it at the event for access.
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-3">Need Help?</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span>Email: support@ems-events.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span>Phone: +356 2123 4567</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTicketData(null)
                      setSearchValue('')
                      setError('')
                    }}
                    className="flex-1"
                  >
                    Search Again
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}