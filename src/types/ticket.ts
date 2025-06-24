// STEP 2: Updated src/types/ticket.ts - Extended with tiered pricing

// ✅ NEW: PricingTier interface
export interface PricingTier {
  id: string
  ticketTypeId: string
  name: string // "Single", "Double Pack", "Mega Pack"
  description?: string
  priceInCents: number // €10 = 1000 cents
  ticketCount: number // Number of tickets you get
  pricePerTicket: number // Calculated: priceInCents / ticketCount
  savingsAmount: number // Calculated savings in cents
  savingsPercent: number // Calculated savings percentage
  sortOrder: number
  isPopular: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ✅ UPDATED: Core Ticket Type Interface with tiered pricing
export interface TicketType {
  id: string
  name: string
  description?: string
  category?: string
  
  // ✅ NEW: Pricing System
  pricingType: 'FIXED' | 'TIERED'
  
  // For FIXED pricing (existing)
  priceInCents: number
  
  // For TIERED pricing (new)
  hasTieredPricing: boolean
  basePrice?: number // Base price for calculating savings
  pricingTiers?: PricingTier[] // Available tiers
  
  currency: string
  
  // Stock Management (keep existing)
  totalStock: number
  reservedStock: number
  soldStock: number
  availableStock: number
  
  // Availability (keep existing)
  isActive: boolean
  availableFrom?: string
  availableUntil?: string
  maxPerOrder: number
  minPerOrder: number
  
  // Target Audience (keep existing)
  emsClientsOnly: boolean
  publicOnly: boolean
  
  // Display & Sorting (keep existing)
  sortOrder: number
  imageUrl?: string
  featured: boolean
  tags?: string
  
  // Admin Info (keep existing)
  createdBy: string
  notes?: string
  
  // Timestamps (keep existing)
  createdAt: string
  updatedAt: string
}

// ✅ NEW: For creating tiered pricing
export interface CreatePricingTierData {
  name: string
  description?: string
  priceInCents: number
  ticketCount: number
  isPopular?: boolean
  sortOrder?: number
}

export interface CreateTieredTicketTypeData {
  name: string
  description?: string
  category?: string
  pricingType: 'FIXED' | 'TIERED'
  
  // For FIXED pricing
  priceInCents?: number
  
  // For TIERED pricing
  basePrice?: number
  pricingTiers?: CreatePricingTierData[]
  
  totalStock: number
  maxPerOrder?: number
  minPerOrder?: number
  emsClientsOnly?: boolean
  publicOnly?: boolean
  featured?: boolean
  tags?: string
  notes?: string
}

// ✅ UPDATED: For creating new ticket types
export interface CreateTicketTypeData {
  name: string
  description?: string
  category?: string
  pricingType?: 'FIXED' | 'TIERED'
  priceInCents?: number
  basePrice?: number // For tiered pricing
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
  pricingTiers?: CreatePricingTierData[]
}

// ✅ NEW: Tier selection interface for frontend
export interface SelectedTier {
  tierId: string
  tierName: string
  priceInCents: number
  ticketCount: number
  savingsAmount: number
  savingsPercent: number
}

// ✅ UPDATED: Selected ticket interface
export interface SelectedTicket {
  ticketTypeId: string
  name: string
  pricingType: 'FIXED' | 'TIERED'
  
  // For FIXED pricing
  priceInCents: number
  quantity: number
  
  // For TIERED pricing
  selectedTier?: SelectedTier
  
  maxPerOrder: number
  minPerOrder: number
}

// ✅ NEW: Utility functions type
export interface PricingCalculations {
  calculateSavings: (tier: PricingTier, basePrice: number) => {
    savingsAmount: number
    savingsPercent: number
    pricePerTicket: number
  }
  formatPrice: (cents: number) => string
  formatSavings: (savings: number) => string
  formatPercent: (percent: number) => string
}

// ✅ NEW: Admin form data for tiered tickets
export interface TieredTicketFormData {
  // Basic info
  name: string
  description: string
  category: string
  pricingType: 'FIXED' | 'TIERED'
  
  // Fixed pricing
  priceInCents: number
  
  // Tiered pricing
  basePrice: number
  tiers: Array<{
    id?: string // For editing existing tiers
    name: string
    description: string
    priceInCents: number
    ticketCount: number
    isPopular: boolean
    sortOrder: number
  }>
  
  // Stock and settings
  totalStock: number
  maxPerOrder: number
  minPerOrder: number
  emsClientsOnly: boolean
  publicOnly: boolean
  featured: boolean
  tags: string[]
  notes: string
}

// Keep all existing interfaces...
export interface TicketTypeBase {
  id: string
  name: string
  priceInCents: number
  totalStock: number
  soldStock: number
  availableStock: number
  isActive: boolean
}

export interface UpdateTicketTypeData {
  id: string
  name?: string
  description?: string
  category?: string
  pricingType?: 'FIXED' | 'TIERED'
  priceInCents?: number
  basePrice?: number
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

export interface TicketTypeStats {
  totalTypes: number
  activeTypes: number
  tieredTypes: number // ✅ NEW
  totalRevenue: number
  totalTicketsSold: number
  averageSavingsPercent: number // ✅ NEW
  topSellingType?: {
    name: string
    soldCount: number
    revenue: number
  }
}

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

export type TicketTypeStatus = 'active' | 'inactive' | 'draft'
export type TicketTypeCategory = 'entertainment' | 'sports' | 'shows' | 'activities' | 'other'

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

// ✅ NEW: Pricing calculation utilities
export const PricingUtils = {
  calculateSavings: (priceInCents: number, ticketCount: number, basePrice: number) => {
    const regularPrice = basePrice * ticketCount
    const savingsAmount = regularPrice - priceInCents
    const savingsPercent = regularPrice > 0 ? (savingsAmount / regularPrice) * 100 : 0
    const pricePerTicket = priceInCents / ticketCount
    
    return {
      savingsAmount: Math.max(0, savingsAmount),
      savingsPercent: Math.max(0, savingsPercent),
      pricePerTicket,
      regularPrice
    }
  },
  
  formatPrice: (cents: number): string => {
    return `€${(cents / 100).toFixed(2)}`
  },
  
  formatSavings: (savings: number): string => {
    return `Save €${(savings / 100).toFixed(2)}`
  },
  
  formatPercent: (percent: number): string => {
    return `${percent.toFixed(1)}%`
  }
}