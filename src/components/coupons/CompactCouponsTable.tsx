import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { 
  Tag, Edit, Trash2, Copy, TrendingUp, Eye, AlertTriangle, RefreshCw,
  Calendar, Building, Globe, Users, Clock
} from 'lucide-react'
import { CouponData } from '@/app/admin/coupons/page'
import { toast } from '@/components/ui/use-toast'

interface CompactCouponsTableProps {
  coupons: CouponData[]
  loading: boolean
  processingAction: string | null
  onCouponAction: (couponId: string, action: string, data?: any) => void
  onViewDetails: (coupon: CouponData) => void
  onCreateCoupon: () => void
}

// Compact Status Badge
const CompactStatusBadge = ({ coupon }: { coupon: CouponData }) => {
  if (!coupon.isActive) {
    return <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs h-5">Inactive</Badge>
  }
  if (coupon.isExpired) {
    return <Badge variant="outline" className="bg-red-50 text-red-600 text-xs h-5">Expired</Badge>
  }
  if (coupon.isNotYetValid) {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 text-xs h-5">Scheduled</Badge>
  }
  return <Badge variant="outline" className="bg-green-50 text-green-600 text-xs h-5">Active</Badge>
}

// Compact Usage Display
const CompactUsage = ({ coupon }: { coupon: CouponData }) => {
  if (!coupon.maxUses) {
    return (
      <div className="text-center">
        <div className="text-sm font-medium">{coupon.actualUses}</div>
        <div className="text-xs text-gray-500">∞</div>
      </div>
    )
  }

  const percentage = (coupon.actualUses / coupon.maxUses) * 100
  const isNearLimit = percentage > 80
  const isAtLimit = coupon.actualUses >= coupon.maxUses

  return (
    <div className="space-y-1 min-w-16">
      <div className="flex justify-center text-xs">
        <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-gray-700'}`}>
          {coupon.actualUses}/{coupon.maxUses}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Compact Audience Badge
const CompactAudience = ({ coupon }: { coupon: CouponData }) => {
  if (coupon.emsClientsOnly) {
    return (
      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 h-5">
        <Building className="h-2.5 w-2.5 mr-1" />
        EMS
      </Badge>
    )
  }
  if (coupon.publicOnly) {
    return (
      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 h-5">
        <Users className="h-2.5 w-2.5 mr-1" />
        Public
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200 h-5">
      <Globe className="h-2.5 w-2.5 mr-1" />
      All
    </Badge>
  )
}

// Confirmation Dialog
const ConfirmationDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description, 
  confirmText 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false) }}>
          {confirmText}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Compact Coupon Row
const CompactCouponRow = React.memo(({ coupon, index, processing, onAction, onViewDetails }: {
  coupon: CouponData
  index: number
  processing: boolean
  onAction: (couponId: string, action: string, data?: any) => void
  onViewDetails: (coupon: CouponData) => void
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code)
    toast({ title: "Copied!", description: "Coupon code copied to clipboard" })
  }

  const formatDiscount = () => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue}%`
    }
    return `€${(coupon.discountValue / 100).toFixed(2)}`
  }

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`

  return (
    <>
      <TableRow className="h-12 hover:bg-blue-50/30 transition-colors group">
        {/* Coupon Code & Name */}
        <TableCell className="py-2 w-48">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                {coupon.code}
              </code>
              <button 
                onClick={copyCode}
                className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="text-xs text-gray-700 truncate font-medium">{coupon.name}</div>
          </div>
        </TableCell>

        {/* Discount */}
        <TableCell className="py-2 w-24 text-center">
          <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            <TrendingUp className="h-2.5 w-2.5" />
            {formatDiscount()}
          </div>
          {coupon.minOrderAmount && (
            <div className="text-xs text-gray-500 mt-0.5">
              Min: {formatPrice(coupon.minOrderAmount)}
            </div>
          )}
        </TableCell>

        {/* Usage */}
        <TableCell className="py-2 w-20">
          <CompactUsage coupon={coupon} />
        </TableCell>

        {/* Audience */}
        <TableCell className="py-2 w-20 text-center">
          <CompactAudience coupon={coupon} />
        </TableCell>

        {/* Validity */}
        <TableCell className="py-2 w-32">
          <div className="space-y-0.5">
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(coupon.validFrom).toLocaleDateString('en-GB')}
            </div>
            {coupon.validTo ? (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {new Date(coupon.validTo).toLocaleDateString('en-GB')}
              </div>
            ) : (
              <div className="text-xs text-green-600 font-medium">No expiry</div>
            )}
          </div>
        </TableCell>

        {/* Status & Toggle */}
        <TableCell className="py-2 w-24">
          <div className="flex flex-col items-center gap-1">
            <CompactStatusBadge coupon={coupon} />
            <Switch
              checked={coupon.isActive}
              onCheckedChange={() => onAction(coupon.id, 'TOGGLE_STATUS', coupon)}
              disabled={processing}
              className="transform scale-75"
            />
          </div>
        </TableCell>

        {/* Actions */}
        <TableCell className="py-2 w-28">
          <div className="flex gap-0.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(coupon)}
              className="h-6 w-6 p-0 text-xs hover:bg-green-50"
              title="View Details"
            >
              <Eye className="h-2.5 w-2.5" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(coupon.id, 'EDIT', coupon)}
              className="h-6 w-6 p-0 text-xs hover:bg-blue-50"
              title="Edit Coupon"
            >
              <Edit className="h-2.5 w-2.5" />
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={processing || coupon.actualUses > 0}
              className="h-6 w-6 p-0 text-xs"
              title={coupon.actualUses > 0 ? "Cannot delete used coupon" : "Delete Coupon"}
            >
              {processing ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5" />}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => onAction(coupon.id, 'DELETE')}
        title="Delete Coupon"
        description={`Are you sure you want to delete coupon "${coupon.code}"? This action cannot be undone.`}
        confirmText="Delete Coupon"
      />
    </>
  )
})

export const CompactCouponsTable = React.memo(function CompactCouponsTable({
  coupons,
  loading,
  processingAction,
  onCouponAction,
  onViewDetails,
  onCreateCoupon
}: CompactCouponsTableProps) {
  return (
    <Card className="overflow-hidden shadow-sm border-green-100">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-b-2 border-green-200">
                <TableHead className="py-3 text-xs font-semibold text-gray-700 w-48">Coupon</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700 w-24 text-center">Discount</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700 w-20 text-center">Usage</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700 w-20 text-center">Audience</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700 w-32">Validity</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700 w-24 text-center">Status</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-700 w-28 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse h-12">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="py-2">
                        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : coupons.length > 0 ? (
                coupons.map((coupon, index) => (
                  <CompactCouponRow
                    key={coupon.id}
                    coupon={coupon}
                    index={index}
                    processing={processingAction === coupon.id}
                    onAction={onCouponAction}
                    onViewDetails={onViewDetails}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-sm">
                        <Tag className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">No coupons found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Create your first coupon to start offering discounts
                        </p>
                        <Button 
                          onClick={onCreateCoupon}
                          variant="outline"
                          className="mt-3 hover:bg-green-50 hover:border-green-300"
                          size="sm"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          Create First Coupon
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
})
