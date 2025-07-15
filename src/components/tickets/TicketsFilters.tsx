// src/components/tickets/TicketsFilters.tsx - VR Room Malta themed filters
import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Gamepad2, Filter, Users } from 'lucide-react'

interface TicketType {
  id: string
  name: string
  category?: string
}

interface TicketsFiltersProps {
  search: string
  statusFilter: string
  ticketTypeFilter: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onTicketTypeChange: (value: string) => void
  resultCount: number
  totalCount: number
  ticketTypes: TicketType[]
}

export const TicketsFilters = React.memo(function TicketsFilters({
  search,
  statusFilter,
  ticketTypeFilter,
  onSearchChange,
  onStatusChange,
  onTicketTypeChange,
  resultCount,
  totalCount,
  ticketTypes
}: TicketsFiltersProps) {
  
  const statusOptions = [
    { value: 'all', label: 'All Sessions', icon: '🎮' },
    { value: 'GENERATED', label: 'Ready to Play', icon: '⚡' },
    { value: 'SENT', label: 'Sent to Customer', icon: '📧' },
    { value: 'USED', label: 'Completed', icon: '✅' },
    { value: 'CANCELLED', label: 'Cancelled', icon: '❌' },
    { value: 'EXPIRED', label: 'Expired', icon: '⏰' }
  ]

  return (
    <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 border-purple-200">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search VR sessions, customers, or experiences..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-purple-600" />
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-40 bg-white border-purple-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VR Experience Filter */}
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-blue-600" />
            <Select value={ticketTypeFilter} onValueChange={onTicketTypeChange}>
              <SelectTrigger className="w-48 bg-white border-blue-200">
                <SelectValue placeholder="VR Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span>🎮</span>
                    <span>All Experiences</span>
                  </div>
                </SelectItem>
                {ticketTypes.map((ticketType) => (
                  <SelectItem key={ticketType.id} value={ticketType.id}>
                    <div className="flex items-center gap-2">
                      <span>{getExperienceIcon(ticketType.category)}</span>
                      <span className="truncate">{ticketType.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Counter */}
          <div className="flex items-center gap-2 ml-auto">
            <Users className="h-4 w-4 text-gray-600" />
            <div className="text-sm">
              {resultCount === totalCount ? (
                <span className="text-gray-700">
                  <strong>{totalCount}</strong> total sessions
                </span>
              ) : (
                <span className="text-gray-700">
                  <strong>{resultCount}</strong> of <strong>{totalCount}</strong> sessions
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(search || statusFilter !== 'all' || ticketTypeFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-purple-200">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Active filters:
            </span>
            
            {search && (
              <Badge 
                variant="outline" 
                className="bg-white border-purple-300 text-purple-700"
              >
                Search: "{search}"
              </Badge>
            )}
            
            {statusFilter !== 'all' && (
              <Badge 
                variant="outline" 
                className="bg-white border-blue-300 text-blue-700"
              >
                Status: {statusOptions.find(s => s.value === statusFilter)?.label}
              </Badge>
            )}
            
            {ticketTypeFilter !== 'all' && (
              <Badge 
                variant="outline" 
                className="bg-white border-green-300 text-green-700"
              >
                Experience: {ticketTypes.find(t => t.id === ticketTypeFilter)?.name}
              </Badge>
            )}
            
            <button
              onClick={() => {
                onSearchChange('')
                onStatusChange('all')
                onTicketTypeChange('all')
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-gray-600">Quick filters:</span>
          
          <button
            onClick={() => onStatusChange('GENERATED')}
            className={`px-2 py-1 rounded-full text-xs transition-colors ${
              statusFilter === 'GENERATED' 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            ⚡ Ready to Play
          </button>
          
          <button
            onClick={() => onStatusChange('USED')}
            className={`px-2 py-1 rounded-full text-xs transition-colors ${
              statusFilter === 'USED' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            ✅ Completed Sessions
          </button>
          
          <button
            onClick={() => onSearchChange('today')}
            className={`px-2 py-1 rounded-full text-xs transition-colors ${
              search.includes('today') 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            📅 Today's Sessions
          </button>
        </div>
      </CardContent>
    </Card>
  )
})

// Helper function to get VR experience icons
function getExperienceIcon(category?: string): string {
  if (!category) return '🎮'
  
  const categoryIcons: Record<string, string> = {
    'VR_EXPERIENCE': '🥽',
    'ADVENTURE': '🗡️',
    'SPACE': '🚀', 
    'HORROR': '👻',
    'RACING': '🏎️',
    'PUZZLE': '🧩',
    'SHOOTER': '🔫',
    'FANTASY': '🐉',
    'SCI_FI': '🛸',
    'SURVIVAL': '🏕️'
  }
  
  return categoryIcons[category.toUpperCase()] || '🎮'
}