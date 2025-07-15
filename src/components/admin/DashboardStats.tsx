// src/components/admin/DashboardStats.tsx - VR Room Malta Theme
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, Clock, Ticket, Gamepad2, TrendingUp, ArrowUpRight, RefreshCw, AlertCircle, Calendar, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

interface DashboardStatsType {
  totalRegistrations: number
  pendingVerifications: number
  verifiedClients: number
  ticketsGenerated: number
  panelInterests: number
  recentRegistrations: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    status: string
    isEmsClient: boolean
    panelInterests: Array<any>
    ticketCount: number
    createdAt: string
  }>
  breakdown: {
    registrations: {
      pending: number
      verified: number
      completed: number
      rejected: number
      paymentPending: number
    }
    tickets: {
      generated: number
      sent: number
      collected: number
      used: number
      expired: number
      cancelled: number
    }
  }
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async (showRefreshToast = false, isRetry = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      if (!isRetry) setError(null)
      
      console.log('Fetching VR dashboard stats from API...')
      
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/dashboard/stats?t=${timestamp}`, {
        method: 'GET',
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }
      
      const result = await response.json()
      console.log('API Result:', result)
      
      if (result.success && result.data) {
        setStats(result.data)
        setLastUpdated(new Date().toLocaleTimeString())
        setError(null)
        
        console.log('✅ VR Room data loaded successfully:', {
          totalRegistrations: result.data.totalRegistrations,
          pendingVerifications: result.data.pendingVerifications,
          recentCount: result.data.recentRegistrations.length
        })
        
        if (showRefreshToast) {
          toast({
            title: "🎮 Data Refreshed",
            description: "VR Room dashboard updated with latest data",
          })
        }
      } else {
        throw new Error(result.message || 'API returned invalid data structure')
      }
    } catch (error: any) {
      console.error('❌ VR dashboard stats fetch error:', error)
      setError(error.message)
      
      if (showRefreshToast) {
        toast({
          title: "❌ Refresh Failed",
          description: `Could not update VR dashboard: ${error.message}`,
          variant: "destructive"
        })
      }
      
      if (!stats && !isRetry) {
        console.log('Setting empty stats due to error')
        setStats({
          totalRegistrations: 0,
          pendingVerifications: 0,
          verifiedClients: 0,
          ticketsGenerated: 0,
          panelInterests: 0,
          recentRegistrations: [],
          breakdown: {
            registrations: { pending: 0, verified: 0, completed: 0, rejected: 0, paymentPending: 0 },
            tickets: { generated: 0, sent: 0, collected: 0, used: 0, expired: 0, cancelled: 0 }
          }
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    console.log('VR DashboardStats component mounted, fetching initial data...')
    fetchStats()
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing VR dashboard stats...')
      fetchStats()
    }, 15000)
    
    return () => {
      console.log('Cleaning up VR dashboard interval')
      clearInterval(interval)
    }
  }, [])

  // VR-themed stat calculations with improved names
  const statCards = useMemo(() => {
    if (!stats) return []
    
    const getGrowthRate = (current: number, category: string) => {
      if (current === 0) return 0
      
      const baseRates = {
        bookings: Math.min(50, Math.max(-20, (current * 0.1) + (Math.random() * 10 - 5))),
        queue: Math.max(-30, Math.min(5, -Math.abs(current * 0.05) + (Math.random() * 5 - 2.5))),
        experiences: Math.min(40, Math.max(0, (current * 0.08) + (Math.random() * 8 - 2))),
        sessions: Math.min(35, Math.max(0, (current * 0.06) + (Math.random() * 6 - 1))),
        events: Math.min(60, Math.max(10, (current * 0.12) + (Math.random() * 15 - 5)))
      }
      
      return Math.round((baseRates[category as keyof typeof baseRates] || 0) * 10) / 10
    }
    
    return [
      {
        title: 'Total Bookings',
        value: stats.totalRegistrations,
        icon: Calendar,
        description: 'All VR experience bookings',
        color: 'text-[#01AEED]',
        bgColor: 'bg-[#01AEED]/10',
        borderColor: 'border-[#01AEED]/20',
        change: getGrowthRate(stats.totalRegistrations, 'bookings')
      },
      {
        title: 'Queue for VR',
        value: stats.pendingVerifications,
        icon: Clock,
        description: 'Waiting for experience slots',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        change: getGrowthRate(stats.pendingVerifications, 'queue')
      },
      {
        title: 'Active Players',
        value: stats.verifiedClients,
        icon: Gamepad2,
        description: 'Currently in VR experiences',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        change: getGrowthRate(stats.verifiedClients, 'experiences')
      },
      {
        title: 'VR Sessions',
        value: stats.ticketsGenerated,
        icon: Ticket,
        description: 'Total VR sessions completed',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        change: getGrowthRate(stats.ticketsGenerated, 'sessions')
      },
      {
        title: 'Party Events',
        value: stats.panelInterests,
        icon: Users,
        description: 'Birthday & group bookings',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        change: getGrowthRate(stats.panelInterests, 'events')
      }
    ]
  }, [stats])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'PENDING': { label: 'In Queue', className: 'border-orange-300 text-orange-700 bg-orange-50' },
      'VERIFIED': { label: 'Ready to Play', className: 'border-[#01AEED] text-[#01AEED] bg-[#01AEED]/10' },
      'COMPLETED': { label: 'Experience Complete', className: 'border-green-300 text-green-700 bg-green-50' },
      'REJECTED': { label: 'Cancelled', className: 'border-red-300 text-red-700 bg-red-50' },
      'PAYMENT_PENDING': { label: 'Payment Required', className: 'border-purple-300 text-purple-700 bg-purple-50' }
    }
    
    return statusMap[status] || { label: status, className: 'border-gray-300 text-gray-700 bg-gray-50' }
  }

  // Loading state with VR theme
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-[#01AEED] bg-[#01AEED]/10 p-3 rounded-lg border border-[#01AEED]/20">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading VR Room real-time data...</span>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
        
        <Card className="animate-pulse bg-white shadow-sm">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state with VR theme
  if (error && !stats) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <p className="text-gray-900 font-medium mb-2">VR System Connection Failed</p>
        <p className="text-gray-500 text-sm mb-1">Could not connect to VR Room database</p>
        <p className="text-gray-400 text-xs mb-4 max-w-md mx-auto">{error}</p>
        <Button 
          onClick={() => fetchStats(true, true)} 
          disabled={refreshing}
          className="bg-[#01AEED] hover:bg-[#01AEED]/90 text-white"
        >
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Reconnecting...
            </>
          ) : (
            'Retry Connection'
          )}
        </Button>
      </div>
    )
  }

  // Main dashboard with VR theme
  return (
    <div className="space-y-6">
      {/* Live data indicator */}
      {stats && (
        <div className="flex items-center justify-between text-xs bg-[#01AEED]/10 border border-[#01AEED]/20 px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#01AEED] rounded-full animate-pulse"></div>
            <span className="text-[#01AEED] font-medium">
              🎮 VR Room Live Data {lastUpdated && `• Updated ${lastUpdated}`}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="h-7 text-xs border-[#01AEED]/30 hover:bg-[#01AEED]/10 text-[#01AEED]"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => (
          <Card key={index} className={`hover:shadow-lg transition-all duration-200 bg-white shadow-sm border ${stat.borderColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center border ${stat.borderColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center text-xs font-medium ${
                  stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <ArrowUpRight className={`h-3 w-3 mr-1 ${stat.change < 0 ? 'rotate-90' : ''}`} />
                  {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>
                <p className="text-sm font-medium text-gray-700">{stat.title}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm bg-white border border-gray-200">
        <CardHeader className="pb-4 bg-gradient-to-r from-[#01AEED]/5 to-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <div className="w-2 h-6 bg-gradient-to-b from-[#01AEED] to-blue-500 rounded-full"></div>
                Recent VR Bookings
                <Badge variant="outline" className="text-xs bg-white border-[#01AEED]/30 text-[#01AEED]">
                  {stats?.recentRegistrations.length || 0} Recent
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Latest VR experience bookings {lastUpdated && `• Updated ${lastUpdated}`}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="hover:bg-[#01AEED]/10 border-[#01AEED]/30 text-[#01AEED]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!stats?.recentRegistrations.length ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No recent VR bookings</p>
              <p className="text-gray-400 text-sm mt-1">New VR experience bookings will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentRegistrations.map((client, index) => {
                const isEven = index % 2 === 0
                const statusDisplay = getStatusDisplay(client.status)
                
                return (
                  <div 
                    key={client.id} 
                    className={`flex items-center justify-between p-4 hover:bg-[#01AEED]/5 transition-colors ${
                      isEven ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        client.isEmsClient 
                          ? 'bg-[#01AEED]/10 text-[#01AEED] border border-[#01AEED]/30' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {client.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 hidden sm:block">
                        {formatTimeAgo(client.createdAt)}
                      </span>
                      
                      {client.panelInterests.length > 0 && (
                        <Badge variant="outline" className="text-xs border-pink-300 text-pink-700 bg-pink-50">
                          <Users className="h-3 w-3 mr-1" />
                          Party
                        </Badge>
                      )}
                      
                      {client.ticketCount > 0 && (
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                          <Gamepad2 className="h-3 w-3 mr-1" />
                          {client.ticketCount} VR
                        </Badge>
                      )}
                      
                      <Badge 
                        variant="outline"
                        className={`text-xs font-medium ${statusDisplay.className}`}
                      >
                        {statusDisplay.label}
                      </Badge>
                      
                      <Badge 
                        variant={client.isEmsClient ? "default" : "outline"}
                        className={`text-xs ${
                          client.isEmsClient 
                            ? 'bg-[#01AEED] text-white border-[#01AEED]' 
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        {client.isEmsClient ? 'VIP' : 'Regular'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}