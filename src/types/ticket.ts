// src/types/ticket.ts

// Core Ticket Type Interface (based on Prisma TicketType model)
export interface TicketType {
  id: string
  name: string
  description?: string
  category?: string
  
  // Pricing
  priceInCents: number
  currency: string
  
  // Stock Management
  totalStock: number
  reservedStock: number
  soldStock: number
  availableStock: number
  
  // Availability
  isActive: boolean
  availableFrom?: string
  availableUntil?: string
  maxPerOrder: number
  minPerOrder: number
  
  // Target Audience
  emsClientsOnly: boolean
  publicOnly: boolean
  
  // Display & Sorting
  sortOrder: number
  imageUrl?: string
  featured: boolean
  tags?: string
  
  // Admin Info
  createdBy: string
  notes?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

// Simplified version for components that don't need all fields
export interface TicketTypeBase {
  id: string
  name: string
  priceInCents: number
  totalStock: number
  soldStock: number
  availableStock: number
  isActive: boolean
}

// For creating new ticket types (omit auto-generated fields)
export interface CreateTicketTypeData {
  name: string
  description?: string
  category?: string
  priceInCents: number
  currency?: string
  totalStock: number
  maxPerOrder?: number
  minPerOrder?: number
  emsClientsOnly?: boolean
  publicOnly?: boolean
  sortOrder?: number
  imageUrl?: string
  featured?: boolean
  tags?: string
  notes?: string
}

// For updating ticket types (all fields optional except id)
export interface UpdateTicketTypeData {
  id: string
  name?: string
  description?: string
  category?: string
  priceInCents?: number
  currency?: string
  totalStock?: number
  maxPerOrder?: number
  minPerOrder?: number
  emsClientsOnly?: boolean
  publicOnly?: boolean
  isActive?: boolean
  availableFrom?: string
  availableUntil?: string
  sortOrder?: number
  imageUrl?: string
  featured?: boolean
  tags?: string
  notes?: string
}

// API Response types
export interface TicketTypesResponse {
  success: boolean
  data: {
    ticketTypes: TicketType[]
    total: number
  }
  message?: string
}

export interface TicketTypeResponse {
  success: boolean
  data: {
    ticketType: TicketType
  }
  message?: string
}

// Statistics interface for dashboard
export interface TicketTypeStats {
  totalTypes: number
  activeTypes: number
  totalRevenue: number
  totalTicketsSold: number
  topSellingType?: {
    name: string
    soldCount: number
    revenue: number
  }
}

// Form validation types
export interface TicketTypeFormErrors {
  name?: string
  description?: string
  priceInCents?: string
  totalStock?: string
  maxPerOrder?: string
  minPerOrder?: string
  availableFrom?: string
  availableUntil?: string
  general?: string
}

// Filter and search types
export interface TicketTypeFilters {
  category?: string
  isActive?: boolean
  emsClientsOnly?: boolean
  publicOnly?: boolean
  featured?: boolean
  priceRange?: {
    min: number
    max: number
  }
  stockStatus?: 'available' | 'low' | 'out_of_stock'
}

export interface TicketTypeSearchParams {
  search?: string
  filters?: TicketTypeFilters
  sortBy?: 'name' | 'price' | 'stock' | 'sales' | 'created'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Component prop types
export interface TicketTypeCardProps {
  ticket: TicketType
  onEdit: (ticket: TicketType) => void
  onToggleStatus: (id: string, currentStatus: boolean) => void
  onDelete?: (id: string) => void
}

export interface TicketTypeDialogProps {
  ticket?: TicketType | null
  onSave: () => void
  onCancel: () => void
  open?: boolean
}

export interface TicketTypeStatsProps {
  ticketTypes: TicketType[]
}

// Utility types
export type TicketTypeStatus = 'active' | 'inactive' | 'draft'
export type TicketTypeCategory = 'entertainment' | 'sports' | 'shows' | 'activities' | 'other'

// Constants
export const TICKET_TYPE_CATEGORIES: Record<TicketTypeCategory, string> = {
  entertainment: 'Entertainment',
  sports: 'Sports',
  shows: 'Shows',
  activities: 'Activities',
  other: 'Other'
}

export const DEFAULT_CURRENCY = 'EUR'
export const DEFAULT_MAX_PER_ORDER = 10
export const DEFAULT_MIN_PER_ORDER = 1
