// src/components/admin/SearchFilters.tsx - Enhanced with EMS colors and better UX
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

interface SearchFiltersProps {
  search: string
  status: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function SearchFilters({ search, status, onSearchChange, onStatusChange }: SearchFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Enhanced Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, phone, registration ID, or company name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Enhanced Status Filter */}
      <div className="relative">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-48 h-11 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Filter by status" />
            </div>
          </SelectTrigger>
          <SelectContent className="border-2">
            <SelectItem value="all" className="focus:bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                All Registrations
              </div>
            </SelectItem>
            <SelectItem value="PENDING" className="focus:bg-orange-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Pending Review
              </div>
            </SelectItem>
            <SelectItem value="COMPLETED" className="focus:bg-green-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Approved
              </div>
            </SelectItem>
            <SelectItem value="PAYMENT_PENDING" className="focus:bg-blue-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Payment Due
              </div>
            </SelectItem>
            <SelectItem value="REJECTED" className="focus:bg-red-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Rejected
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}