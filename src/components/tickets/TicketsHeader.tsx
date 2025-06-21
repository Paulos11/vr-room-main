// src/components/tickets/TicketsHeader.tsx - Optimized with enhanced stats
import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, Ticket, Clock, CheckCircle, Users, AlertCircle } from 'lucide-react'
import { TicketData } from '@/app/admin/tickets/page'

interface TicketsHeaderProps {
  tickets: TicketData[]
  filteredCount: number
  onRefresh: () => void
  onGenerateTickets: () => void
  loading: boolean
}

export const TicketsHeader = React.memo(function TicketsHeader({
  tickets,
  filteredCount,
  onRefresh,
  onGenerateTickets,
  loading
}: TicketsHeaderProps) {
  // Calculate statistics efficiently
  const statistics = useMemo(() => {
    return tickets.reduce((acc, ticket) => {
      acc.total = tickets.length
      const status = ticket.status.toLowerCase()
      acc[status as keyof typeof acc] = (acc[status as keyof typeof acc] || 0) + 1
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
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
            Ticket Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage event tickets, delivery status, and customer access
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
            className="hover:bg-green-50 hover:border-green-300 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            onClick={onGenerateTickets}
            size="sm"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Tickets
          </Button>
        </div>
      </div>
      
      {/* Enhanced Stats Display */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full shadow-sm"></div>
          <span className="text-gray-700">Total: <strong className="text-gray-900">{statistics.total}</strong></span>
        </div>
        
        {filteredCount !== statistics.total && (
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-500" />
            <span className="text-gray-700">Filtered: <strong className="text-blue-600">{filteredCount}</strong></span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-orange-500" />
          <span className="text-gray-700">Generated: <strong className="text-orange-600">{statistics.generated}</strong></span>
        </div>
        
        <div className="flex items-center gap-2">
          <Ticket className="w-3 h-3 text-blue-500" />
          <span className="text-gray-700">Active: <strong className="text-blue-600">{statistics.sent + statistics.collected}</strong></span>
        </div>
        
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-gray-700">Used: <strong className="text-green-600">{statistics.used}</strong></span>
        </div>
        
        {statistics.cancelled > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span className="text-gray-700">Cancelled: <strong className="text-red-600">{statistics.cancelled}</strong></span>
          </div>
        )}
      </div>
    </div>
  )
})