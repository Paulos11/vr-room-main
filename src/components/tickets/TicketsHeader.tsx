// src/components/tickets/TicketsHeader.tsx
import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus } from 'lucide-react'
import { TicketData } from '@/app/admin/tickets/page'

interface TicketsHeaderProps {
  tickets: TicketData[]
  onRefresh: () => void
  onGenerateTickets: () => void
  loading: boolean
}

export const TicketsHeader = React.memo(function TicketsHeader({
  tickets,
  onRefresh,
  onGenerateTickets,
  loading
}: TicketsHeaderProps) {
  // Calculate statistics
  const statistics = useMemo(() => {
    return tickets.reduce((acc, ticket) => {
      acc.total = tickets.length
      acc[ticket.status.toLowerCase() as keyof typeof acc] = (acc[ticket.status.toLowerCase() as keyof typeof acc] || 0) + 1
      return acc
    }, {
      total: 0,
      generated: 0,
      sent: 0,
      collected: 0,
      used: 0,
      expired: 0,
      cancelled: 0
    })
  }, [tickets])

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Ticket Management</h2>
        <div className="flex gap-4 text-sm text-gray-600 mt-1">
          <span>Total: <strong>{statistics.total}</strong></span>
          <span>Generated: <strong className="text-orange-600">{statistics.generated}</strong></span>
          <span>Active: <strong className="text-blue-600">{statistics.sent + statistics.collected}</strong></span>
          <span>Used: <strong className="text-green-600">{statistics.used}</strong></span>
          {statistics.cancelled > 0 && (
            <span>Cancelled: <strong className="text-red-600">{statistics.cancelled}</strong></span>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={loading}
          className="hover:bg-blue-50 hover:border-blue-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button 
          onClick={onGenerateTickets}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Generate Tickets
        </Button>
      </div>
    </div>
  )
})