// src/components/coupons/CouponDetailsDialog.tsx
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Tag, Users, Calendar, Euro, Percent, Building, Globe, 
  TrendingUp, Clock, Mail, User, Copy, RefreshCw 
} from 'lucide-react'
import { CouponData } from '@/app/admin/coupons/page'
import { toast } from '@/components/ui/use-toast'

interface CouponDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  couponId: string | null
}

interface CouponDetails extends CouponData {
  registrations: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    createdAt: string
    finalAmount: number
  }>
  _count: {
    registrations: number
  }
}

export function CouponDetailsDialog({ open, onOpenChange, couponId }: CouponDetailsDialogProps) {
  const [coupon, setCoupon] = useState<CouponDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && couponId) {
      fetchCouponDetails()
    }
  }, [open, couponId])

  const fetchCouponDetails = async () => {
    if (!couponId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`)
      const result = await response.json()
      
      if (result.success) {
        setCoupon(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load coupon details",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load coupon details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code)
      toast({ title: "Copied!", description: "Coupon code copied to clipboard" })
    }
  }

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`

  const formatDiscount = () => {
    if (!coupon) return ''
    return coupon.discountType === 'PERCENTAGE' 
      ? `${coupon.discountValue}%` 
      : formatPrice(coupon.discountValue)
  }

  const getStatusBadge = () => {
    if (!coupon) return null
    
    if (!coupon.isActive) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700">Inactive</Badge>
    }
    if (coupon.isExpired) {
      return <Badge variant="outline" className="bg-red-50 text-red-700">Expired</Badge>
    }
    if (coupon.isNotYetValid) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Scheduled</Badge>
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
  }

  const getUsageProgress = () => {
    if (!coupon) return { percentage: 0, color: 'bg-green-500' }
    
    if (!coupon.maxUses) return { percentage: 0, color: 'bg-green-500' }
    
    const percentage = (coupon.actualUses / coupon.maxUses) * 100
    const color = percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-orange-500' : 'bg-green-500'
    
    return { percentage: Math.min(percentage, 100), color }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            Coupon Details
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading coupon details...</span>
          </div>
        ) : coupon ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Basic Information</span>
                  {getStatusBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Coupon Code</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-blue-100 text-blue-900 px-3 py-2 rounded font-mono font-bold">
                        {coupon.code}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyCode}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Display Name</label>
                    <p className="mt-1 font-medium">{coupon.name}</p>
                  </div>
                </div>
                
                {coupon.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="mt-1 text-gray-700">{coupon.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discount Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Discount Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Discount Type</label>
                    <div className="flex items-center gap-2 mt-1">
                      {coupon.discountType === 'PERCENTAGE' ? (
                        <>
                          <Percent className="h-4 w-4 text-green-600" />
                          <span>Percentage</span>
                        </>
                      ) : (
                        <>
                          <Euro className="h-4 w-4 text-green-600" />
                          <span>Fixed Amount</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Discount Value</label>
                    <p className="mt-1 text-xl font-bold text-green-600">{formatDiscount()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Minimum Order</label>
                    <p className="mt-1">
                      {coupon.minOrderAmount ? formatPrice(coupon.minOrderAmount) : 'No minimum'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Usage</label>
                    <p className="text-2xl font-bold text-blue-600">
                      {coupon.actualUses}
                      {coupon.maxUses && <span className="text-lg text-gray-500">/{coupon.maxUses}</span>}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Max Uses Per User</label>
                    <p className="text-xl font-medium">{coupon.maxUsesPerUser}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Unique Users</label>
                    <p className="text-xl font-medium">{coupon._count?.registrations || 0}</p>
                  </div>
                </div>

                {coupon.maxUses && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Usage Progress</label>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${getUsageProgress().color}`}
                        style={{ width: `${getUsageProgress().percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getUsageProgress().percentage.toFixed(1)}% used
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Validity Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="mt-1">{new Date(coupon.validFrom).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="mt-1">
                      {coupon.validTo 
                        ? new Date(coupon.validTo).toLocaleDateString() 
                        : 'No expiry date'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target Audience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {coupon.emsClientsOnly && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Building className="h-3 w-3 mr-1" />
                      EMS Clients Only
                    </Badge>
                  )}
                  {coupon.publicOnly && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Globe className="h-3 w-3 mr-1" />
                      Public Only
                    </Badge>
                  )}
                  {!coupon.emsClientsOnly && !coupon.publicOnly && (
                    <Badge className="bg-gray-100 text-gray-800">
                      <Globe className="h-3 w-3 mr-1" />
                      All Customers
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Usage */}
            {coupon.registrations && coupon.registrations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Recent Usage ({coupon.registrations.length} total)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {coupon.registrations.map((reg, index) => (
                      <div key={reg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-700">
                              {reg.firstName.charAt(0)}{reg.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{reg.firstName} {reg.lastName}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {reg.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(reg.finalAmount)}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(reg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Notes */}
            {coupon.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{coupon.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Created By</label>
                    <p className="font-medium">{coupon.createdBy}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Created At</label>
                    <p className="font-medium">{new Date(coupon.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Last Updated</label>
                    <p className="font-medium">{new Date(coupon.updatedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Coupon ID</label>
                    <p className="font-mono text-xs bg-gray-100 p-1 rounded">{coupon.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Coupon not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}