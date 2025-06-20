// src/components/admin/StatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, UserCheck, AlertCircle, CreditCard } from 'lucide-react'

interface StatsData {
  total: number
  pending: number
  completed: number
  rejected: number
  paymentPending: number
}

interface StatsCardsProps {
  stats: StatsData
  loading?: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-8"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">Total</CardTitle>
          <Users className="h-3 w-3 text-blue-600" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">Pending</CardTitle>
          <Clock className="h-3 w-3 text-orange-600" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl font-bold text-orange-600">{stats.pending}</div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">Approved</CardTitle>
          <UserCheck className="h-3 w-3 text-green-600" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl font-bold text-green-600">{stats.completed}</div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">Payment Due</CardTitle>
          <CreditCard className="h-3 w-3 text-blue-600" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl font-bold text-blue-600">{stats.paymentPending}</div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">Rejected</CardTitle>
          <AlertCircle className="h-3 w-3 text-red-600" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl font-bold text-red-600">{stats.rejected}</div>
        </CardContent>
      </Card>
    </div>
  )
}
