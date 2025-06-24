// src/app/admin/coupons/page.tsx - Updated with working dialogs
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { CouponsHeader } from '@/components/coupons/CouponsHeader'
import { CouponsFilters } from '@/components/coupons/CouponsFilters'
import { CompactCouponsTable } from '@/components/coupons/CompactCouponsTable'
import { CreateCouponDialog } from '@/components/coupons/CreateCouponDialog'
import { CouponDetailsDialog } from '@/components/coupons/CouponDetailsDialog'
import { EditCouponDialog } from '@/components/coupons/EditCouponDialog'

export interface CouponData {
  id: string
  code: string
  name: string
  description?: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderAmount?: number
  maxUses?: number
  maxUsesPerUser: number
  currentUses: number
  isActive: boolean
  validFrom: string
  validTo?: string
  emsClientsOnly: boolean
  publicOnly: boolean
  createdBy: string
  notes?: string
  createdAt: string
  updatedAt: string
  // Additional computed fields
  actualUses: number
  isExpired: boolean
  isNotYetValid: boolean
  usagePercentage: number
}

export interface CouponStats {
  overview: {
    totalCoupons: number
    activeCoupons: number
    expiredCoupons: number
    totalUses: number
    totalSavings: number
  }
  topCoupons: Array<{
    id: string
    code: string
    name: string
    currentUses: number
    discountType: string
    discountValue: number
  }>
  recentActivity: Array<{
    id: string
    customerName: string
    couponCode: string
    couponName: string
    discountAmount: number
    createdAt: string
  }>
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([])
  const [filteredCoupons, setFilteredCoupons] = useState<CouponData[]>([])
  const [stats, setStats] = useState<CouponStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null)
  const [selectedCoupon, setSelectedCoupon] = useState<CouponData | null>(null)

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/coupons?limit=100', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      const result = await response.json()
      
      if (result.success) {
        setCoupons(result.data.coupons || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch coupons",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error)
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/coupons/stats', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      } else {
        console.error('Stats fetch failed:', result.message)
        // Don't show error toast for stats, just log it
      }
    } catch (error) {
      console.error('Failed to fetch coupon stats:', error)
      // Don't show error toast for stats, just log it
    }
  }, [])

  // Filter coupons locally for instant search
  useEffect(() => {
    let filtered = coupons

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(coupon => 
        coupon.code.toLowerCase().includes(searchLower) ||
        coupon.name.toLowerCase().includes(searchLower) ||
        coupon.description?.toLowerCase().includes(searchLower) ||
        coupon.createdBy.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(coupon => {
        const now = new Date()
        const isExpired = coupon.validTo ? new Date(coupon.validTo) < now : false
        const isNotYetValid = new Date(coupon.validFrom) > now
        
        switch (statusFilter) {
          case 'active':
            return coupon.isActive && !isExpired && !isNotYetValid
          case 'inactive':
            return !coupon.isActive
          case 'expired':
            return isExpired
          case 'scheduled':
            return isNotYetValid
          case 'used':
            return coupon.actualUses > 0
          case 'unused':
            return coupon.actualUses === 0
          default:
            return true
        }
      })
    }

    setFilteredCoupons(filtered)
  }, [coupons, search, statusFilter])

  useEffect(() => {
    fetchCoupons()
    fetchStats()
  }, [fetchCoupons, fetchStats])

  const handleCouponAction = useCallback(async (couponId: string, action: string, data?: any) => {
    setProcessingAction(couponId)
    try {
      let response
      
      switch (action) {
        case 'DELETE':
          response = await fetch(`/api/admin/coupons/${couponId}`, {
            method: 'DELETE',
          })
          break
        case 'TOGGLE_STATUS':
          response = await fetch(`/api/admin/coupons/${couponId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !data.isActive }),
          })
          break
        case 'EDIT':
          // Open edit dialog
          setSelectedCoupon(data)
          setShowEditDialog(true)
          return // Don't proceed with API call
        default:
          throw new Error('Unknown action')
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        
        // Refresh data
        await fetchCoupons()
        await fetchStats()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update coupon",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update coupon",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(null)
    }
  }, [fetchCoupons, fetchStats])

  const handleCreateSuccess = useCallback(() => {
    fetchCoupons()
    fetchStats()
    setShowCreateDialog(false)
  }, [fetchCoupons, fetchStats])

  const handleEditSuccess = useCallback(() => {
    fetchCoupons()
    fetchStats()
    setShowEditDialog(false)
    setSelectedCoupon(null)
  }, [fetchCoupons, fetchStats])

  const handleViewDetails = useCallback((coupon: CouponData) => {
    setSelectedCouponId(coupon.id)
    setShowDetailsDialog(true)
  }, [])

  const refreshData = useCallback(() => {
    fetchCoupons()
    fetchStats()
  }, [fetchCoupons, fetchStats])

  return (
    <div className="space-y-6 p-8">
      <CouponsHeader 
        coupons={coupons}
        stats={stats}
        filteredCount={filteredCoupons.length}
        onRefresh={refreshData}
        onCreateCoupon={() => setShowCreateDialog(true)}
        loading={loading}
      />

      <CouponsFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        resultCount={filteredCoupons.length}
        totalCount={coupons.length}
      />

      <CompactCouponsTable
        coupons={filteredCoupons}
        loading={loading}
        processingAction={processingAction}
        onCouponAction={handleCouponAction}
        onViewDetails={handleViewDetails}
        onCreateCoupon={() => setShowCreateDialog(true)}
      />

      {/* Dialogs */}
      <CreateCouponDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <CouponDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        couponId={selectedCouponId}
      />

      <EditCouponDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        coupon={selectedCoupon}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}