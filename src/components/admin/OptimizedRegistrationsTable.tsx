// src/components/admin/OptimizedRegistrationsTable.tsx - VR Room Malta themed
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { 
  Search, 
  RefreshCw, 
  Gamepad2, 
  Users, 
  Calendar,
  Euro,
  PlayCircle,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Headphones,
  AlertCircle,
  Database,
  Send
} from 'lucide-react'

interface VRBooking {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  isEmsClient: boolean
  finalAmount: number
  selectedTickets: Array<{
    name: string
    quantity: number
  }>
  sessionCount: number
  createdAt: string
  paidAt?: string
}

export function OptimizedRegistrationsTable() {
  const router = useRouter()
  const [bookings, setBookings] = useState<VRBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<VRBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all')

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try multiple API endpoints
      const endpoints = [
        '/api/admin/registrations?limit=50',
        '/api/dashboard/stats', // Fallback to dashboard data
      ]
      
      let response
      let result
      
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            headers: { 'Cache-Control': 'no-cache' }
          })
          
          if (response.ok) {
            result = await response.json()
            if (result.success) {
              // Handle different API response structures
              if (endpoint.includes('registrations')) {
                setBookings(result.data.registrations || [])
              } else if (endpoint.includes('dashboard')) {
                // Convert dashboard data to bookings format
                const dashboardBookings = (result.data.recentRegistrations || []).map((reg: any) => ({
                  id: reg.id,
                  firstName: reg.firstName,
                  lastName: reg.lastName,
                  email: reg.email,
                  phone: reg.phone || 'N/A',
                  status: reg.status,
                  isEmsClient: reg.isEmsClient,
                  finalAmount: 0, // Not available in dashboard data
                  selectedTickets: [{ name: 'VR Session', quantity: reg.ticketCount || 1 }],
                  sessionCount: reg.ticketCount || 1,
                  createdAt: reg.createdAt,
                  paidAt: reg.status === 'COMPLETED' ? reg.createdAt : undefined
                }))
                setBookings(dashboardBookings)
              }
              break
            }
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed, trying next...`)
          continue
        }
      }
      
      if (!result?.success) {
        throw new Error('All API endpoints failed')
      }
      
    } catch (error: any) {
      console.error('Failed to fetch VR bookings:', error)
      setError(error.message)
      
      // Set mock data for demo purposes
      const mockBookings: VRBooking[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@email.com',
          phone: '+356 2123 4567',
          status: 'COMPLETED',
          isEmsClient: false,
          finalAmount: 2500,
          selectedTickets: [{ name: 'VR Adventure Package', quantity: 2 }],
          sessionCount: 2,
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString()
        },
        {
          id: '2',
          firstName: 'Maria',
          lastName: 'Garcia',
          email: 'maria.garcia@email.com',
          phone: '+356 2987 6543',
          status: 'PAYMENT_PENDING',
          isEmsClient: true,
          finalAmount: 0,
          selectedTickets: [{ name: 'VIP VR Experience', quantity: 1 }],
          sessionCount: 1,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]
      setBookings(mockBookings)
      
      toast({
        title: "API Connection Issue",
        description: "Showing demo data. Please check API endpoints.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter bookings locally
  useEffect(() => {
    let filtered = bookings

    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.firstName.toLowerCase().includes(searchLower) ||
        booking.lastName.toLowerCase().includes(searchLower) ||
        booking.email.toLowerCase().includes(searchLower) ||
        booking.phone.includes(search) ||
        booking.selectedTickets.some(ticket => 
          ticket.name.toLowerCase().includes(searchLower)
        )
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    if (customerTypeFilter !== 'all') {
      const isEms = customerTypeFilter === 'ems'
      filtered = filtered.filter(booking => booking.isEmsClient === isEms)
    }

    setFilteredBookings(filtered)
  }, [bookings, search, statusFilter, customerTypeFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', icon: '🎮', label: 'Ready to Play' },
      'PAYMENT_PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Payment Pending' },
      'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Cancelled' },
      'VERIFIED': { bg: 'bg-[#01AEED]/10', text: 'text-[#01AEED]', icon: '✅', label: 'Verified' },
      'PENDING': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '⌛', label: 'Pending' }
    }

    const config = configs[status as keyof typeof configs] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      icon: '❓', 
      label: status 
    }

    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'COMPLETED', label: 'Ready to Play' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
    { value: 'PENDING', label: 'Pending Review' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ]

  const customerTypeOptions = [
    { value: 'all', label: 'All Customers' },
    { value: 'ems', label: 'VIP Clients' },
    { value: 'public', label: 'Regular Customers' }
  ]

  const handleViewBooking = (bookingId: string) => {
    // Use Next.js router for proper navigation
    router.push(`/admin/registrations/${bookingId}`)
  }

  const handleEditBooking = (bookingId: string) => {
    // Use Next.js router for proper navigation
    router.push(`/admin/registrations/${bookingId}/edit`)
  }

  const handleDeleteBooking = async (bookingId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete the VR booking for ${customerName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/registrations/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "✅ Booking Deleted",
          description: `VR booking for ${customerName} has been removed successfully`,
        })
        // Refresh the bookings list
        fetchBookings()
      } else {
        throw new Error(result.message || 'Failed to delete booking')
      }
    } catch (error: any) {
      console.error('Delete booking error:', error)
      toast({
        title: "❌ Delete Failed",
        description: error.message || 'Could not delete the VR booking',
        variant: "destructive"
      })
    }
  }

  const handleResendTickets = async (bookingId: string, customerName: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${bookingId}/resend-tickets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' 
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "🎫 Tickets Resent",
          description: `VR tickets sent to ${email} successfully`,
        })
      } else {
        throw new Error(result.message || 'Failed to resend tickets')
      }
    } catch (error: any) {
      console.error('Resend tickets error:', error)
      toast({
        title: "❌ Resend Failed",
        description: error.message || 'Could not resend VR tickets',
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#01AEED]/10 via-blue-50/50 to-[#01AEED]/10 backdrop-blur-sm p-6 rounded-xl border border-[#01AEED]/20 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#01AEED] to-blue-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">VR Bookings Management</h2>
                <p className="text-gray-600 text-sm">Manage customer VR session bookings and payments</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {error && (
              <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">API Issue</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBookings}
              disabled={loading}
              className="hover:bg-[#01AEED]/10 hover:border-[#01AEED]/30 text-[#01AEED]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg border border-gray-200/50">
            <Database className="h-3 w-3 text-[#01AEED]" />
            <span className="text-gray-700">Total: <strong>{bookings.length}</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg border border-gray-200/50">
            <PlayCircle className="h-3 w-3 text-green-500" />
            <span className="text-gray-700">Ready: <strong>{bookings.filter(b => b.status === 'COMPLETED').length}</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg border border-gray-200/50">
            <Clock className="h-3 w-3 text-yellow-500" />
            <span className="text-gray-700">Pending: <strong>{bookings.filter(b => b.status === 'PAYMENT_PENDING' || b.status === 'PENDING').length}</strong></span>
          </div>
          {filteredBookings.length !== bookings.length && (
            <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg border border-gray-200/50">
              <Search className="h-3 w-3 text-blue-500" />
              <span className="text-gray-700">Filtered: <strong>{filteredBookings.length}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers or VR experiences..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-200 focus:border-[#01AEED] focus:ring-[#01AEED]/20"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-gray-200 focus:border-[#01AEED]">
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
              <SelectTrigger className="w-48 border-gray-200 focus:border-[#01AEED]">
                <SelectValue placeholder="Customer Type" />
              </SelectTrigger>
              <SelectContent>
                {customerTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="overflow-hidden shadow-sm border border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-[#01AEED]/5 to-blue-50/50 border-b border-gray-200">
                <TableHead className="py-3 text-xs font-semibold text-gray-700">Customer</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700">VR Sessions</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700">Status</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700">Amount</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700">Booked</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className="py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking, index) => {
                  const isEven = index % 2 === 0
                  const rowBg = isEven ? 'bg-white' : 'bg-gray-50/50'

                  return (
                    <TableRow key={booking.id} className={`${rowBg} hover:bg-[#01AEED]/5 transition-colors`}>
                      {/* Customer */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{booking.firstName} {booking.lastName}</p>
                            <Badge variant={booking.isEmsClient ? "default" : "outline"} className={
                              booking.isEmsClient 
                                ? "bg-[#01AEED] text-white text-xs" 
                                : "border-gray-300 text-gray-700 text-xs"
                            }>
                              {booking.isEmsClient ? '👑 VIP' : '👤 Regular'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-32">{booking.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{booking.phone}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* VR Sessions */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Headphones className="h-4 w-4 text-[#01AEED]" />
                            <span className="font-medium text-sm">{booking.sessionCount} sessions</span>
                          </div>
                          <div className="space-y-1">
                            {booking.selectedTickets.slice(0, 2).map((ticket, idx) => (
                              <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                <Gamepad2 className="h-3 w-3 text-blue-500" />
                                <span>{ticket.name} × {ticket.quantity}</span>
                              </div>
                            ))}
                            {booking.selectedTickets.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{booking.selectedTickets.length - 2} more...
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        {getStatusBadge(booking.status)}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-3">
                        <div className="text-sm">
                          {booking.isEmsClient ? (
                            <Badge className="bg-green-100 text-green-800">FREE VIP</Badge>
                          ) : (
                            <span className="font-medium">{formatCurrency(booking.finalAmount)}</span>
                          )}
                        </div>
                        {booking.paidAt && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Paid
                          </div>
                        )}
                      </TableCell>

                      {/* Booked Date */}
                      <TableCell className="py-3">
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(booking.createdAt)}</span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewBooking(booking.id)}
                            className="h-7 px-2 text-xs hover:bg-[#01AEED]/10 hover:border-[#01AEED]/30"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBooking(booking.id)}
                            className="h-7 px-2 text-xs hover:bg-green-50 hover:border-green-300 text-green-600"
                            title="Edit Booking"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          {(booking.status === 'COMPLETED' || booking.status === 'VERIFIED') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendTickets(booking.id, `${booking.firstName} ${booking.lastName}`, booking.email)}
                              className="h-7 px-2 text-xs hover:bg-blue-50 hover:border-blue-300 text-blue-600"
                              title="Resend VR Tickets"
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBooking(booking.id, `${booking.firstName} ${booking.lastName}`)}
                            className="h-7 px-2 text-xs hover:bg-red-50 hover:border-red-300 text-red-600"
                            title="Delete Booking"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          
                          {booking.status === 'COMPLETED' && (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-[#01AEED] hover:bg-[#01AEED]/90 text-white"
                              title="Start VR Session"
                            >
                              <PlayCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#01AEED]/10 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
                        <Gamepad2 className="w-10 h-10 text-[#01AEED]" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-lg">No VR bookings found</p>
                        <p className="text-gray-400 text-sm mt-2">
                          {search || statusFilter !== 'all' || customerTypeFilter !== 'all' 
                            ? 'Try adjusting your filters to see more results'
                            : 'VR session bookings will appear here once customers start booking'
                          }
                        </p>
                        <Button 
                          variant="outline"
                          className="mt-4 hover:bg-[#01AEED]/10 hover:border-[#01AEED]/30 text-[#01AEED]"
                          onClick={() => window.open('/book', '_blank')}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Book VR Session
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer Stats */}
      {filteredBookings.length > 0 && (
        <Card className="bg-gradient-to-r from-[#01AEED]/5 to-blue-50/50 border border-[#01AEED]/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
                <span className="text-gray-700">
                  Total VR Sessions: <strong>{filteredBookings.reduce((sum, b) => sum + b.sessionCount, 0)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">
                  Total Revenue: <strong>
                    {formatCurrency(filteredBookings.reduce((sum, b) => sum + b.finalAmount, 0))}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#01AEED]" />
                <span className="text-gray-700">
                  VIP Clients: <strong>{filteredBookings.filter(b => b.isEmsClient).length}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">
                  Ready to Play: <strong>{filteredBookings.filter(b => b.status === 'COMPLETED').length}</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}