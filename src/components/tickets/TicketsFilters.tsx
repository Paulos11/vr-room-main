// src/components/tickets/TicketsFilters.tsx
import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, X } from 'lucide-react'

interface TicketsFiltersProps {
  search: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  resultCount: number
  totalCount: number
}

export const TicketsFilters = React.memo(function TicketsFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
  resultCount,
  totalCount
}: TicketsFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search & Filter Row */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by ticket number, customer name, or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 border-2 border-gray-200 focus:border-green-400 transition-colors"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-40 h-9 border-2 border-gray-200 focus:border-blue-400">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="GENERATED">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Generated
              </div>
            </SelectItem>
            <SelectItem value="SENT">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Sent
              </div>
            </SelectItem>
            <SelectItem value="COLLECTED">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Collected
              </div>
            </SelectItem>
            <SelectItem value="USED">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Used
              </div>
            </SelectItem>
            <SelectItem value="EXPIRED">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Expired
              </div>
            </SelectItem>
            <SelectItem value="CANCELLED">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Cancelled
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      {(search || statusFilter !== 'all') && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
          <span>
            Showing <strong className="text-blue-700">{resultCount}</strong> of <strong>{totalCount}</strong> tickets
            {search && <span> matching "<strong>{search}</strong>"</span>}
            {statusFilter !== 'all' && <span> with status <strong>{statusFilter}</strong></span>}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('')
              onStatusChange('all')
            }}
            className="h-6 text-xs hover:bg-blue-100"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
})