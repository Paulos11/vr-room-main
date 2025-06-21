// src/components/admin/SearchFilters.tsx - Enhanced with better UX and performance
import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, X, Users, Clock, CheckCircle, AlertCircle, CreditCard } from 'lucide-react'

interface SearchFiltersProps {
  search: string
  status: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

// Memoized component for better performance
export const SearchFilters = React.memo(function SearchFilters({ 
  search, 
  status, 
  onSearchChange, 
  onStatusChange 
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Enhanced Search Input with better styling */}
      <div className="flex-1 relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" />
        <Input
          placeholder="Search by name, email, phone, ID, company, or registration ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-12 text-sm border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200 bg-white/80 backdrop-blur-sm"
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
      
      {/* Enhanced Status Filter with icons */}
      <div className="relative">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-56 h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Filter by status" />
            </div>
          </SelectTrigger>
          <SelectContent className="border-2 bg-white/95 backdrop-blur-sm">
            <SelectItem value="all" className="focus:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span>All Registrations</span>
                <span className="text-xs text-gray-400 ml-auto">Show everything</span>
              </div>
            </SelectItem>
            
            <SelectItem value="PENDING" className="focus:bg-orange-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Pending Review</span>
                <span className="text-xs text-orange-400 ml-auto">Needs approval</span>
              </div>
            </SelectItem>
            
            <SelectItem value="COMPLETED" className="focus:bg-green-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Approved</span>
                <span className="text-xs text-green-400 ml-auto">Ready for event</span>
              </div>
            </SelectItem>
            
            <SelectItem value="PAYMENT_PENDING" className="focus:bg-blue-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span>Payment Due</span>
                <span className="text-xs text-blue-400 ml-auto">Awaiting payment</span>
              </div>
            </SelectItem>
            
            <SelectItem value="REJECTED" className="focus:bg-red-50 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>Rejected</span>
                <span className="text-xs text-red-400 ml-auto">Not approved</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})

export default SearchFilters