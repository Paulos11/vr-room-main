// src/app/admin/registrations/[id]/page.tsx - VR Registration Detail Page
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Gamepad2,
  Euro,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  PlayCircle,
  Users,
  MapPin,
  CreditCard,
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface RegistrationDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  isEmsClient: boolean
  finalAmount: number
  originalAmount: number
  discountAmount: number
  appliedCouponCode?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  
  // VR-specific data
  selectedTickets: Array<{
    name: string
    quantity: number
    price: number
  }>
  sessionCount: number
  vrExperiences: string
  customerType: string
  
  // EMS/VIP data
  customerName?: string
  orderNumber?: string
  applicationNumber?: string
  
  // Payment info
  paymentStatus?: string
  paymentMethod?: string
  
  // Party booking info
  hasPartyBooking: boolean
  partyDetails?: Array<{
    type: string
    notes: string
  }>
}

export default function RegistrationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [registration, setRegistration] = useState<RegistrationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const registrationId = params.id as string

  useEffect(() => {
    fetchRegistrationDetail()
  }, [registrationId])

  const fetchRegistrationDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('VR booking not found')
        } else {
          throw new Error(`Failed to fetch booking details: ${response.status}`)
        }
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        setRegistration(result.data)
      } else {
        throw new Error(result.message || 'Failed to load booking details')
      }
      
    } catch (error: any) {
      console.error('Failed to fetch registration:', error)
      setError(error.message)
      
      // Show mock data for demo
      const mockRegistration: RegistrationDetail = {
        id: registrationId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+356 2123 4567',
        status: 'COMPLETED',
        isEmsClient: false,
        finalAmount: 2500,
        originalAmount: 3000,
        discountAmount: 500,
        appliedCouponCode: 'WELCOME10',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        selectedTickets: [
          { name: 'VR Adventure Package', quantity: 2, price: 1500 },
          { name: 'VR Racing Experience', quantity: 1, price: 1000 }
        ],
        sessionCount: 3,
        vrExperiences: 'VR Adventure Package, VR Racing Experience',
        customerType: 'Regular',
        paymentStatus: 'SUCCEEDED',
        paymentMethod: 'Credit Card',
        hasPartyBooking: false
      }
      setRegistration(mockRegistration)
      
      toast({
        title: "Demo Mode",
        description: "Showing sample data - API endpoint needs to be created",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: PlayCircle, label: 'Ready to Play' },
      'VERIFIED': { color: 'bg-[#01AEED]/10 text-[#01AEED]', icon: CheckCircle, label: 'Verified' },
      'PAYMENT_PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Payment Pending' },
      'PENDING': { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Pending Review' },
      'CANCELLED': { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelled' }
    }
    return configs[status as keyof typeof configs] || configs['PENDING']
  }

  const handleStartVRSession = () => {
    toast({
      title: "🎮 Starting VR Session",
      description: `Preparing VR experience for ${registration?.firstName} ${registration?.lastName}`,
    })
  }

  const handleEditRegistration = () => {
    // Use Next.js navigation instead of opening new tab
    router.push(`/admin/registrations/${registrationId}/edit`)
  }

  const handleBackToBookings = () => {
    // Use proper Next.js navigation
    router.push('/admin/registrations')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToBookings}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error && !registration) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToBookings}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">VR Booking Not Found</h3>
            <p className="text-gray-600 mb-4">The VR booking you're looking for doesn't exist or has been removed.</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleBackToBookings}>
                Go Back
              </Button>
              <Button onClick={fetchRegistrationDetail}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!registration) return null

  const statusConfig = getStatusConfig(registration.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToBookings}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              VR Booking Details
            </h1>
            <p className="text-gray-600">
              {registration.firstName} {registration.lastName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={statusConfig.color}>
            <statusConfig.icon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
          {registration.status === 'COMPLETED' && (
            <Button onClick={handleStartVRSession} className="bg-[#01AEED] hover:bg-[#01AEED]/90">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start VR Session
            </Button>
          )}
          <Button variant="outline" onClick={handleEditRegistration}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#01AEED]" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#01AEED]/10 rounded-full flex items-center justify-center">
                <span className="text-[#01AEED] font-semibold">
                  {registration.firstName[0]}{registration.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold">{registration.firstName} {registration.lastName}</p>
                <Badge variant={registration.isEmsClient ? "default" : "outline"} className={
                  registration.isEmsClient ? "bg-[#01AEED] text-white" : ""
                }>
                  {registration.isEmsClient ? '👑 VIP Client' : '👤 Regular Customer'}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{registration.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{registration.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Booked: {formatDate(registration.createdAt)}</span>
              </div>
            </div>

            {registration.isEmsClient && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">VIP Details</p>
                  {registration.customerName && (
                    <p className="text-sm text-gray-600">Company: {registration.customerName}</p>
                  )}
                  {registration.orderNumber && (
                    <p className="text-sm text-gray-600">Order: {registration.orderNumber}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* VR Experience Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-[#01AEED]" />
              VR Experience Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total VR Sessions</span>
              <Badge variant="outline" className="text-[#01AEED] border-[#01AEED]">
                {registration.sessionCount} sessions
              </Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Selected Experiences</p>
              {registration.selectedTickets.map((ticket, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
                    <span className="text-sm font-medium">{ticket.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">×{ticket.quantity}</p>
                    {!registration.isEmsClient && (
                      <p className="text-xs text-gray-500">{formatCurrency(ticket.price)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#01AEED]" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {registration.isEmsClient ? (
              <div className="text-center py-4">
                <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                  🎉 FREE VIP Experience
                </Badge>
                <p className="text-sm text-gray-600 mt-2">Complimentary VR session for VIP clients</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Original Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(registration.originalAmount)}</span>
                </div>
                {registration.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Discount:</span>
                      <span className="text-sm font-medium">-{formatCurrency(registration.discountAmount)}</span>
                    </div>
                    {registration.appliedCouponCode && (
                      <div className="flex justify-between">
                        <span className="text-sm">Coupon Code:</span>
                        <Badge variant="outline" className="text-xs">{registration.appliedCouponCode}</Badge>
                      </div>
                    )}
                  </>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-[#01AEED]">{formatCurrency(registration.finalAmount)}</span>
                </div>
                
                {registration.paidAt && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Paid on {formatDate(registration.paidAt)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#01AEED]" />
              Booking Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Booking Created</p>
                  <p className="text-xs text-gray-600">{formatDate(registration.createdAt)}</p>
                </div>
              </div>
              
              {registration.paidAt && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Payment Received</p>
                    <p className="text-xs text-gray-600">{formatDate(registration.paidAt)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-gray-600">{formatDate(registration.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}