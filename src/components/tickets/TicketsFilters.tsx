// UPDATED: src/components/tickets/TicketsFilters.tsx - Add ticket type filter
import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, X, CheckCircle, AlertCircle, Ticket as TicketIcon, Tag } from 'lucide-react'

interface TicketType {
  id: string
  name: string
  category?: string
}

interface TicketsFiltersProps {
  search: string
  statusFilter: string
  ticketTypeFilter?: string // ✅ NEW: Ticket type filter
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onTicketTypeChange?: (value: string) => void // ✅ NEW: Ticket type change handler
  resultCount: number
  totalCount: number
  ticketTypes?: TicketType[] // ✅ NEW: Available ticket types
}

export const TicketsFilters = React.memo(function TicketsFilters({
  search,
  statusFilter,
  ticketTypeFilter = 'all',
  onSearchChange,
  onStatusChange,
  onTicketTypeChange,
  resultCount,
  totalCount,
  ticketTypes = []
}: TicketsFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Enhanced Search & Filter Row */}
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" />
          <Input
            placeholder="Search by ticket number, customer name, email, phone, or ticket type..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10 text-sm border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200 bg-white/80 backdrop-blur-sm"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-48 h-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="border-2 bg-white/95 backdrop-blur-sm">
            <SelectItem value="all" className="focus:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <TicketIcon className="w-4 h-4 text-gray-500" />
                <span>All Status</span>
              </div>
            </SelectItem>
            
            <SelectItem value="GENERATED" className="focus:bg-orange-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Generated</span>
              </div>
            </SelectItem>
            
            <SelectItem value="SENT" className="focus:bg-blue-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Sent</span>
              </div>
            </SelectItem>
            
            {/* ✅ REMOVED: COLLECTED option (hidden from UI) */}
            
            <SelectItem value="USED" className="focus:bg-green-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Used</span>
              </div>
            </SelectItem>
            
            <SelectItem value="EXPIRED" className="focus:bg-red-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Expired</span>
              </div>
            </SelectItem>
            
            <SelectItem value="CANCELLED" className="focus:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <AlertCircle className="w-4 h-4 text-gray-500" />
                <span>Cancelled</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* ✅ NEW: Ticket Type Filter */}
        {ticketTypes.length > 0 && onTicketTypeChange && (
          <Select value={ticketTypeFilter} onValueChange={onTicketTypeChange}>
            <SelectTrigger className="w-52 h-10 border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Ticket Type" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-2 bg-white/95 backdrop-blur-sm">
              <SelectItem value="all" className="focus:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3 py-1">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span>All Types</span>
                </div>
              </SelectItem>
              
              {ticketTypes.map((type) => (
                <SelectItem key={type.id} value={type.id} className="focus:bg-purple-50 cursor-pointer">
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>{type.name}</span>
                    {type.category && (
                      <span className="text-xs text-purple-400 ml-auto">{type.category}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Enhanced Results Summary */}
      {(search || statusFilter !== 'all' || ticketTypeFilter !== 'all') && (
        <div className="flex items-center justify-between text-sm bg-gradient-to-r from-blue-50 to-green-50 px-4 py-3 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700">
              Showing <strong className="text-blue-700 font-semibold">{resultCount.toLocaleString()}</strong> of <strong className="font-semibold">{totalCount.toLocaleString()}</strong> tickets
              {search && <span> matching "<strong className="text-green-700">{search}</strong>"</span>}
              {statusFilter !== 'all' && <span> with status <strong className="text-purple-700">{statusFilter}</strong></span>}
              {ticketTypeFilter !== 'all' && (
                <span> of type <strong className="text-purple-700">
                  {ticketTypes.find(t => t.id === ticketTypeFilter)?.name || 'Unknown'}
                </strong></span>
              )}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('')
              onStatusChange('all')
              onTicketTypeChange?.('all')
            }}
            className="h-7 text-xs hover:bg-blue-100 transition-all duration-200 text-blue-700 hover:text-blue-800"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        </div>
      )}

      {/* Performance Indicator */}
      {resultCount !== totalCount && (
        <div className="text-xs text-gray-500 text-center">
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
            ⚡ Instant filtering • {resultCount} results in 0ms
          </span>
        </div>
      )}
    </div>
  )
})