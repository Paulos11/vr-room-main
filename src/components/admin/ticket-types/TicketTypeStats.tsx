
// src/components/admin/ticket-types/TicketTypeStats.tsx - Simplified
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket, TrendingUp, Package, Euro } from 'lucide-react'

interface TicketType {
  id: string
  name: string
  priceInCents: number
  totalStock: number
  soldStock: number
  availableStock: number
  isActive: boolean
}

interface TicketTypeStatsProps {
  ticketTypes: TicketType[]
}

export function TicketTypeStats({ ticketTypes }: TicketTypeStatsProps) {
  const stats = {
    totalTypes: ticketTypes.length,
    activeTypes: ticketTypes.filter(t => t.isActive).length,
    totalStock: ticketTypes.reduce((sum, t) => sum + t.totalStock, 0),
    totalSold: ticketTypes.reduce((sum, t) => sum + t.soldStock, 0),
    totalRevenue: ticketTypes.reduce((sum, t) => sum + (t.soldStock * t.priceInCents), 0)
  }

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Types</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeTypes}</div>
          <p className="text-xs text-muted-foreground">
            of {stats.totalTypes} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStock}</div>
          <p className="text-xs text-muted-foreground">
            tickets available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSold}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalStock > 0 ? `${((stats.totalSold / stats.totalStock) * 100).toFixed(1)}% sold` : 'No stock'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            from ticket sales
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
