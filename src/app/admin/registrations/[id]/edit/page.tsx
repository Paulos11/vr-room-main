// src/app/admin/registrations/[id]/edit/page.tsx - VR Registration Edit Page
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  ArrowLeft, 
  Save, 
  RefreshCw,
  User, 
  Mail, 
  Phone, 
  Calendar,
  Gamepad2,
  Euro,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Send,
  Eye,
  Settings
} from 'lucide-react'

interface EditRegistration {
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
  adminNotes?: string
  verifiedBy?: string
  rejectedReason?: string
  
  // VIP data
  customerName?: string
  orderNumber?: string
  applicationNumber?: string
  
  // Payment info
  paymentStatus?: string
  paidAt?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export default function EditRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const [registration, setRegistration] = useState<EditRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: '',
    adminNotes: '',
    verifiedBy: '',
    rejectedReason: '',
    finalAmount: 0,
    originalAmount: 0,
    discountAmount: 0,
    appliedCouponCode: '',
    customerName: '',
    orderNumber: '',
    applicationNumber: ''
  })

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
        throw new Error(`Failed to fetch booking: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setRegistration(result.data)
        setFormData({
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          status: result.data.status || '',
          adminNotes: result.data.adminNotes || '',
          verifiedBy: result.data.verifiedBy || '',
          rejectedReason: result.data.rejectedReason || '',
          finalAmount: result.data.finalAmount || 0,
          originalAmount: result.data.originalAmount || 0,
          discountAmount: result.data.discountAmount || 0,
          appliedCouponCode: result.data.appliedCouponCode || '',
          customerName: result.data.customerName || '',
          orderNumber: result.data.orderNumber || '',
          applicationNumber: result.data.applicationNumber || ''
        })
      } else {
        throw new Error(result.message || 'Failed to load booking')
      }
      
    } catch (error: any) {
      console.error('Failed to fetch registration:', error)
      setError(error.message)
      
      // Mock data for demo
      const mockData = {
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
        adminNotes: 'Customer prefers afternoon sessions',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setRegistration(mockData)
      setFormData({
        firstName: mockData.firstName,
        lastName: mockData.lastName,
        email: mockData.email,
        phone: mockData.phone,
        status: mockData.status,
        adminNotes: mockData.adminNotes || '',
        verifiedBy: '',
        rejectedReason: '',
        finalAmount: mockData.finalAmount,
        originalAmount: mockData.originalAmount,
        discountAmount: mockData.discountAmount,
        appliedCouponCode: '',
        customerName: '',
        orderNumber: '',
        applicationNumber: ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "✅ Booking Updated",
          description: "VR booking has been updated successfully",
        })
        router.push(`/admin/registrations/${registrationId}`)
      } else {
        throw new Error(result.message || 'Failed to update booking')
      }
      
    } catch (error: any) {
      console.error('Save error:', error)
      toast({
        title: "❌ Update Failed",
        description: error.message || 'Could not update VR booking',
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResendTickets = async () => {
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/resend-tickets`, {
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "🎫 Tickets Resent",
          description: `VR tickets sent to ${formData.email} successfully`,
        })
      } else {
        throw new Error(result.message || 'Failed to resend tickets')
      }
    } catch (error: any) {
      toast({
        title: "❌ Resend Failed",
        description: error.message || 'Could not resend VR tickets',
        variant: "destructive"
      })
    }
  }

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const statusOptions = [
    { value: 'PENDING', label: 'Pending Review', color: 'bg-orange-100 text-orange-800' },
    { value: 'VERIFIED', label: 'Verified', color: 'bg-[#01AEED]/10 text-[#01AEED]' },
    { value: 'COMPLETED', label: 'Ready to Play', color: 'bg-green-100 text-green-800' },
    { value: 'PAYMENT_PENDING', label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
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
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-10 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!registration) return null

  const currentStatus = statusOptions.find(s => s.value === formData.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/admin/registrations/${registrationId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit VR Booking</h1>
            <p className="text-gray-600">{formData.firstName} {formData.lastName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentStatus && (
            <Badge className={currentStatus.color}>
              {currentStatus.label}
            </Badge>
          )}
          <Button onClick={handleResendTickets} variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Resend Tickets
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#01AEED] hover:bg-[#01AEED]/90">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {registration.isEmsClient && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">VIP Client Details</Label>
                  <div>
                    <Label htmlFor="customerName">Company Name</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="orderNumber">Order Number</Label>
                      <Input
                        id="orderNumber"
                        value={formData.orderNumber}
                        onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="applicationNumber">Application Number</Label>
                      <Input
                        id="applicationNumber"
                        value={formData.applicationNumber}
                        onChange={(e) => handleInputChange('applicationNumber', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Booking Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#01AEED]" />
              Booking Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Booking Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="verifiedBy">Verified By</Label>
              <Input
                id="verifiedBy"
                value={formData.verifiedBy}
                onChange={(e) => handleInputChange('verifiedBy', e.target.value)}
                placeholder="Admin name"
                className="mt-1"
              />
            </div>

            {formData.status === 'REJECTED' && (
              <div>
                <Label htmlFor="rejectedReason">Rejection Reason</Label>
                <Textarea
                  id="rejectedReason"
                  value={formData.rejectedReason}
                  onChange={(e) => handleInputChange('rejectedReason', e.target.value)}
                  placeholder="Reason for rejection"
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={formData.adminNotes}
                onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                placeholder="Internal notes about this booking"
                className="mt-1"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        {!registration.isEmsClient && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#01AEED]" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="originalAmount">Original Amount (cents)</Label>
                <Input
                  id="originalAmount"
                  type="number"
                  value={formData.originalAmount}
                  onChange={(e) => handleInputChange('originalAmount', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display: {formatCurrency(formData.originalAmount)}
                </p>
              </div>

              <div>
                <Label htmlFor="discountAmount">Discount Amount (cents)</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) => handleInputChange('discountAmount', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display: {formatCurrency(formData.discountAmount)}
                </p>
              </div>

              <div>
                <Label htmlFor="appliedCouponCode">Coupon Code</Label>
                <Input
                  id="appliedCouponCode"
                  value={formData.appliedCouponCode}
                  onChange={(e) => handleInputChange('appliedCouponCode', e.target.value)}
                  placeholder="Enter coupon code"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="finalAmount">Final Amount (cents)</Label>
                <Input
                  id="finalAmount"
                  type="number"
                  value={formData.finalAmount}
                  onChange={(e) => handleInputChange('finalAmount', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display: {formatCurrency(formData.finalAmount)}
                </p>
              </div>

              <Separator />
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Original Amount:</span>
                    <span>{formatCurrency(formData.originalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(formData.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Final Amount:</span>
                    <span className="text-[#01AEED]">{formatCurrency(formData.finalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIP Free Experience */}
        {registration.isEmsClient && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                VIP Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Badge className="bg-green-100 text-green-800 text-lg px-6 py-3">
                  🎉 Complimentary VR Experience
                </Badge>
                <p className="text-gray-600 mt-4">
                  This VIP client receives free VR sessions as part of their premium package.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-[#01AEED]" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/admin/registrations/${registrationId}`)}
                className="hover:bg-[#01AEED]/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleResendTickets}
                className="hover:bg-blue-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Resend Tickets
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Booking Information</Label>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Booking ID:</strong> {registration.id}</p>
                <p><strong>Created:</strong> {new Date(registration.createdAt).toLocaleDateString()}</p>
                <p><strong>Last Updated:</strong> {new Date(registration.updatedAt).toLocaleDateString()}</p>
                <p><strong>Customer Type:</strong> 
                  <Badge variant={registration.isEmsClient ? "default" : "outline"} className="ml-2">
                    {registration.isEmsClient ? 'VIP Client' : 'Regular Customer'}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Bar */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Remember to save your changes
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/admin/registrations/${registrationId}`)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-[#01AEED] hover:bg-[#01AEED]/90"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}