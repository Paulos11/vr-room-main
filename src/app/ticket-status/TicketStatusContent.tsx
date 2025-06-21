// src/app/ticket-status/TicketStatusContent.tsx - Main component without hydration issues
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Mail, CheckCircle, Clock, CreditCard, Download, ArrowLeft, Calendar, MapPin, Building, Phone, AlertCircle } from 'lucide-react'

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

export default function TicketStatusContent() {
  const [searchType, setSearchType] = useState<'email' | 'ticket'>('email')
  const [searchValue, setSearchValue] = useState('')
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle search type change with clearing input
  const handleSearchTypeChange = (type: 'email' | 'ticket') => {
    setSearchType(type)
    setSearchValue('') // Clear input when switching
    setError('') // Clear any errors
  }

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
        return <Badge className="bg-green-500 hover:bg-green-600 text-white font-medium">Completed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium">Pending Approval</Badge>
      case 'PAYMENT_PENDING':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-medium">Payment Required</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium">Rejected</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white font-medium">{status}</Badge>
    }
  }

  const getTicketStatusBadge = (status?: string) => {
    if (!status) return <Badge className="bg-gray-400 hover:bg-gray-500 text-white font-medium">Not Generated</Badge>
    
    switch (status) {
      case 'SENT':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">Sent to Email</Badge>
      case 'GENERATED':
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white font-medium">Generated</Badge>
      case 'COLLECTED':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white font-medium">Collected</Badge>
      case 'USED':
        return <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium">Used</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white font-medium">{status}</Badge>
    }
  }

  return (
    <div className="ticket-status-page min-h-screen bg-white relative overflow-hidden">
      {/* Background Decorations - matching register page */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top decorative circles */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-60"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-40"></div>
        
        {/* Bottom decorative circles */}
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full opacity-50"></div>
        <div className="absolute bottom-32 right-32 w-28 h-28 bg-gradient-to-br from-purple-100 to-green-100 rounded-full opacity-45"></div>
        
        {/* Large central subtle background */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-50 to-blue-50 rounded-full opacity-30 blur-3xl"></div>
        
        {/* Brand accent lines */}
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
              {/* Tab Buttons */}
              <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => handleSearchTypeChange('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    searchType === 'email'
                      ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email Address
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchTypeChange('ticket')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    searchType === 'ticket'
                      ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Ticket Number
                </button>
              </div>

              {/* Input Field */}
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
                      : 'Enter your ticket number (e.g., EMS-2025-001234)'
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  required
                  className="bg-white border border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Check Status
                  </>
                )}
              </Button>
            </form>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4 mt-8">
                <Skeleton className="h-4 w-full bg-gray-200" />
                <Skeleton className="h-16 w-full bg-gray-200" />
                <Skeleton className="h-12 w-full bg-gray-200" />
              </div>
            )}

            {/* Results */}
            {ticketData && !loading && (
              <div className="space-y-6 mt-8">
                {/* Registration Status */}
                <div className="p-5 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="font-semibold mb-4 text-gray-800 text-lg">Registration Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-800">{ticketData.firstName} {ticketData.lastName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-800">{ticketData.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-800">{ticketData.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Customer Type:</span>
                      <span className="font-medium text-gray-800">
                        {ticketData.isEmsClient ? 'EMS Customer' : 'General Public'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Registration Status:</span>
                      {getStatusBadge(ticketData.registrationStatus)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Registered:</span>
                      <span className="text-gray-800">{new Date(ticketData.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Status */}
                <div className="p-5 border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-800 text-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Ticket Status
                  </h3>
                  <div className="space-y-3 text-sm">
                    {ticketData.ticketNumber ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Ticket Number:</span>
                          <span className="font-mono text-xs bg-white px-2 py-1 rounded border">{ticketData.ticketNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Status:</span>
                          {getTicketStatusBadge(ticketData.ticketStatus)}
                        </div>
                        {ticketData.pdfUrl && (
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700">Ticket PDF:</span>
                            <a 
                              href={ticketData.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              <Download className="mr-2 h-3 w-3" />
                              Download
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-orange-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Ticket not yet generated
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Information */}
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

                {/* Panel Interest */}
                {ticketData.panelInterest && (
                  <div className="p-5 border border-yellow-200 rounded-lg bg-yellow-50 shadow-sm">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-800 text-lg">
                      <Building className="h-5 w-5 text-yellow-600" />
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
                  <div className="p-5 border border-orange-200 rounded-lg bg-orange-50 shadow-sm">
                    <h3 className="font-semibold mb-3 text-orange-800 text-lg">Next Steps</h3>
                    <p className="text-sm text-orange-700">
                      Your registration is pending admin approval. We'll email you once your EMS customer status is verified.
                    </p>
                  </div>
                )}

                {ticketData.registrationStatus === 'PAYMENT_PENDING' && (
                  <div className="p-5 border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
                    <h3 className="font-semibold mb-3 text-blue-800 text-lg">Payment Required</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Complete your €50 payment to receive your ticket instantly.
                    </p>
                    <Link href={`/payment?id=${ticketData.id}`} className="inline-block">
                      <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Complete Payment
                      </Button>
                    </Link>
                  </div>
                )}

                {ticketData.registrationStatus === 'COMPLETED' && ticketData.ticketStatus === 'SENT' && (
                  <div className="p-5 border border-green-200 rounded-lg bg-green-50 shadow-sm">
                    <h3 className="font-semibold mb-3 text-green-800 text-lg">Ready for Event</h3>
                    <p className="text-sm text-green-700">
                      Your ticket has been sent to your email. Present it at the event for access.
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div className="p-5 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                  <h3 className="font-semibold mb-4 text-gray-800 text-lg">Need Help?</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span>Email: support@ems-events.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
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
                    className="flex-1 border border-gray-300 hover:bg-gray-50"
                  >
                    Search Again
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full border border-gray-300 hover:bg-gray-50">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}