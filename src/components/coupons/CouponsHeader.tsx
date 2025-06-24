// src/components/coupons/CouponsHeader.tsx - Fixed stats paths
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plus, Tag, TrendingUp, Users, Euro, Wrench } from 'lucide-react'
import { CouponData, CouponStats } from '@/app/admin/coupons/page'
import { toast } from '@/components/ui/use-toast'

interface CouponsHeaderProps {
  stats: CouponStats | null
  coupons: CouponData[]
  filteredCount: number
  onRefresh: () => void
  onCreateCoupon: () => void
  loading: boolean
}

export function CouponsHeader({ 
  stats, 
  coupons, 
  filteredCount, 
  onRefresh, 
  onCreateCoupon, 
  loading 
}: CouponsHeaderProps) {
  const [fixingUsage, setFixingUsage] = useState(false)

  const handleFixUsage = async () => {
    setFixingUsage(true)
    try {
      const response = await fetch('/api/admin/coupons/fix-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Usage Fixed",
          description: `Fixed ${result.data.fixedCoupons.length} coupons`,
        })
        onRefresh() // Refresh the data
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fix usage",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fix coupon usage",
        variant: "destructive",
      })
    } finally {
      setFixingUsage(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage discount coupons for your events
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleFixUsage}
            disabled={fixingUsage}
            className="hover:bg-orange-50 border-orange-300 text-orange-700"
          >
            <Wrench className={`w-4 h-4 mr-2 ${fixingUsage ? 'animate-spin' : ''}`} />
            Fix Usage
          </Button>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="hover:bg-blue-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={onCreateCoupon}
            className="bg-green-600 hover:bg-green-700 text-white shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Stats Cards - FIXED PATHS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Total Coupons</p>
                <p className="text-2xl font-bold text-green-900">
                  {loading ? '-' : stats?.overview?.totalCoupons || 0}
                </p>
              </div>
              <Tag className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Active Coupons</p>
                <p className="text-2xl font-bold text-blue-900">
                  {loading ? '-' : stats?.overview?.activeCoupons || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Uses</p>
                <p className="text-2xl font-bold text-purple-900">
                  {loading ? '-' : stats?.overview?.totalUses || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Total Savings</p>
                <p className="text-2xl font-bold text-orange-900">
                  €{loading ? '-' : ((stats?.overview?.totalSavings || 0) / 100).toFixed(2)}
                </p>
              </div>
              <Euro className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Showing <strong>{filteredCount}</strong> of <strong>{coupons.length}</strong> coupons
        </span>
        {stats?.overview && (
          <>
            <Badge variant="outline" className="text-green-700 border-green-300">
              {stats.overview.activeCoupons} Active
            </Badge>
            <Badge variant="outline" className="text-red-700 border-red-300">
              {stats.overview.expiredCoupons} Expired
            </Badge>
          </>
        )}
      </div>
    </div>
  )
}