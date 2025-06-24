// src/components/coupons/CouponsFilters.tsx
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Calendar, Activity, Users, Clock } from 'lucide-react'

interface CouponsFiltersProps {
  search: string
  statusFilter: string
  onSearchChange: (search: string) => void
  onStatusChange: (status: string) => void
  resultCount: number
  totalCount: number
}

export function CouponsFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
  resultCount,
  totalCount
}: CouponsFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'All Coupons', icon: Filter, color: 'text-gray-600' },
    { value: 'active', label: 'Active', icon: Activity, color: 'text-green-600' },
    { value: 'inactive', label: 'Inactive', icon: Users, color: 'text-gray-500' },
    { value: 'expired', label: 'Expired', icon: Calendar, color: 'text-red-600' },
    { value: 'scheduled', label: 'Scheduled', icon: Clock, color: 'text-orange-600' },
    { value: 'used', label: 'Used', icon: Users, color: 'text-blue-600' },
    { value: 'unused', label: 'Unused', icon: Users, color: 'text-purple-600' }
  ]

  const currentStatus = statusOptions.find(option => option.value === statusFilter)

  return (
    <Card className="shadow-sm border-gray-200">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search coupons by code, name, or creator..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="min-w-48">
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500">
                  <div className="flex items-center gap-2">
                    {currentStatus && (
                      <currentStatus.icon className={`h-4 w-4 ${currentStatus.color}`} />
                    )}
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {resultCount === totalCount ? (
                <span>
                  Showing <strong>{totalCount}</strong> coupons
                </span>
              ) : (
                <span>
                  Showing <strong>{resultCount}</strong> of <strong>{totalCount}</strong> coupons
                </span>
              )}
            </div>

            {/* Active Filters */}
            {(search || statusFilter !== 'all') && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Filters:</span>
                {search && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                    onClick={() => onSearchChange('')}
                  >
                    Search: "{search}" ×
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                    onClick={() => onStatusChange('all')}
                  >
                    Status: {currentStatus?.label} ×
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {search || statusFilter !== 'all' ? (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{resultCount} results found</span>
              </div>
              {resultCount < totalCount && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>{totalCount - resultCount} filtered out</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}