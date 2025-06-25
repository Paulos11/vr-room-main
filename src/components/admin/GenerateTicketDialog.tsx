'use client'

import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { 
  Loader2, Search, Mail, Phone, Building, Ticket, Plus, Minus,
  UserPlus, Users, X, TrendingDown
} from 'lucide-react'

interface GenerateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Registration {
  id: string
  name: string
  email: string
  phone: string
  isEmsClient: boolean
  status: string
}

interface PricingTier {
  id: string
  name: string
  ticketCount: number
  priceInCents: number
  savingsAmount: number
  savingsPercent: number
}

interface TicketType {
  id: string
  name: string
  description?: string
  category?: string
  pricingType: 'FIXED' | 'TIERED'
  priceInCents: number
  basePrice?: number // ✅ FIX: Use this for tiered pricing calculations
  availableStock: number
  maxPerOrder: number
  minPerOrder: number
  isActive: boolean
  hasTieredPricing: boolean
  pricingTiers?: PricingTier[]
}

interface SelectedTicket {
  ticketTypeId: string
  name: string
  quantity: number
  maxStock: number
  priceInCents: number
}

// ✅ NEW: Type for pricing calculation result
interface PricingResult {
  priceInCents: number
  savings: number
  appliedTier: PricingTier | null
  breakdown: string
}

export function GenerateTicketDialog({ open, onOpenChange, onSuccess }: GenerateTicketDialogProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'existing'>('quick') // ✅ CHANGED: Quick tab first
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  
  // Existing user search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Registration[]>([])
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  
  // Quick registration form
  const [quickForm, setQuickForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isEmsClient: false,
    paymentMethod: 'CASH' // ✅ NEW: Default payment method
  })
  
  // ✅ NEW: Payment method options
  const paymentMethods = [
    { value: 'CASH', label: 'Cash Payment' },
    { value: 'ONLINE', label: 'Online Payment' },
    { value: 'OTHER', label: 'Other' }
  ]
  
  // Ticket selection
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([])
  
  // ✅ NEW: Manual quantity input state
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null)
  const [tempQuantity, setTempQuantity] = useState('')
  
  useEffect(() => {
    if (open) {
      fetchTicketTypes()
    }
  }, [open])

  const fetchTicketTypes = async () => {
    try {
      const response = await fetch('/api/admin/ticket-types')
      const result = await response.json()
      if (result.success) {
        const processedTicketTypes = result.data.ticketTypes.map((ticket: any) => ({
          ...ticket,
          hasTieredPricing: ticket.pricingType === 'TIERED' && ticket.pricingTiers?.length > 0,
          priceInCents: parseInt(ticket.priceInCents) || 0,
          basePrice: parseInt(ticket.basePrice) || 0,
          pricingTiers: ticket.pricingTiers?.map((tier: any) => ({
            ...tier,
            priceInCents: parseInt(tier.priceInCents) || 0,
            ticketCount: parseInt(tier.ticketCount) || 1,
            savingsAmount: parseInt(tier.savingsAmount) || 0,
            savingsPercent: parseFloat(tier.savingsPercent) || 0
          })) || []
        }))
        setTicketTypes(processedTicketTypes)
      }
    } catch (error) {
      console.error('Failed to fetch ticket types:', error)
    }
  }

  const searchRegistrations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/registrations/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()
      if (result.success) {
        setSearchResults(result.data || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchRegistrations(searchQuery)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, searchRegistrations])

  // ✅ FIXED: Correct tier calculation with optimal pricing and proper typing
  const calculatePriceForQuantity = (ticket: TicketType, quantity: number): PricingResult => {
    const isEmsClient = selectedRegistration?.isEmsClient || quickForm.isEmsClient

    if (isEmsClient) {
      return { priceInCents: 0, savings: 0, appliedTier: null, breakdown: 'EMS Customer - Free' }
    }

    if (!ticket.hasTieredPricing || !ticket.pricingTiers || ticket.pricingTiers.length === 0) {
      const baseUnitPrice = ticket.basePrice || ticket.priceInCents
      return {
        priceInCents: baseUnitPrice * quantity,
        savings: 0,
        appliedTier: null,
        breakdown: `${quantity} × €${(baseUnitPrice / 100).toFixed(2)}`
      }
    }

    const baseUnitPrice = ticket.basePrice || ticket.priceInCents
    const regularPrice = baseUnitPrice * quantity
    
    // ✅ NEW: Find the most cost-effective combination of tiers
    let bestPrice = regularPrice
    let bestTier: PricingTier | null = null
    let bestBreakdown = `${quantity} × €${(baseUnitPrice / 100).toFixed(2)} (regular)`

    // Sort tiers by ticket count (largest first for optimization)
    const sortedTiers = [...ticket.pricingTiers].sort((a, b) => b.ticketCount - a.ticketCount)
    
    // Try each tier as the primary tier
    for (const tier of sortedTiers) {
      if (quantity >= tier.ticketCount) {
        // Calculate how many complete tier packages we can buy
        const tierPackages = Math.floor(quantity / tier.ticketCount)
        const remainingTickets = quantity % tier.ticketCount
        
        // Cost = (tier packages × tier price) + (remaining × base price)
        const tierCost = (tierPackages * tier.priceInCents) + (remainingTickets * baseUnitPrice)
        
        if (tierCost < bestPrice) {
          bestPrice = tierCost
          bestTier = tier
          
          if (remainingTickets > 0) {
            bestBreakdown = `${tierPackages}×${tier.name} (€${(tier.priceInCents / 100).toFixed(2)}) + ${remainingTickets}×Single (€${(baseUnitPrice / 100).toFixed(2)})`
          } else {
            bestBreakdown = `${tierPackages}×${tier.name} (€${(tier.priceInCents / 100).toFixed(2)})`
          }
        }
      }
      
      // Also check exact tier match
      if (quantity === tier.ticketCount && tier.priceInCents < bestPrice) {
        bestPrice = tier.priceInCents
        bestTier = tier
        bestBreakdown = `${tier.name} package (${tier.ticketCount} tickets)`
      }
    }

    const savings = regularPrice - bestPrice

    console.log('Pricing calculation for', ticket.name, quantity, 'tickets:', {
      regularPrice: regularPrice,
      bestPrice: bestPrice,
      savings: savings,
      appliedTier: bestTier?.name,
      breakdown: bestBreakdown
    })

    return {
      priceInCents: bestPrice,
      savings: Math.max(0, savings),
      appliedTier: bestTier,
      breakdown: bestBreakdown
    }
  }

  const getSelectedQuantity = (ticketTypeId: string): number => {
    const selected = selectedTickets.find(t => t.ticketTypeId === ticketTypeId)
    return selected ? selected.quantity : 0
  }

  const updateTicketQuantity = (ticket: TicketType, newQuantity: number) => {
    const currentSelected = [...selectedTickets]
    const existingIndex = currentSelected.findIndex(t => t.ticketTypeId === ticket.id)
    
    if (newQuantity === 0) {
      if (existingIndex !== -1) {
        currentSelected.splice(existingIndex, 1)
      }
    } else {
      const pricing = calculatePriceForQuantity(ticket, newQuantity)
      const selectedTicket: SelectedTicket = {
        ticketTypeId: ticket.id,
        name: ticket.name,
        priceInCents: pricing.priceInCents,
        quantity: newQuantity,
        maxStock: ticket.availableStock
      }
      
      if (existingIndex !== -1) {
        currentSelected[existingIndex] = selectedTicket
      } else {
        currentSelected.push(selectedTicket)
      }
    }
    
    setSelectedTickets(currentSelected)
  }

  const increaseQuantity = (ticket: TicketType) => {
    const currentQty = getSelectedQuantity(ticket.id)
    const isEmsClient = selectedRegistration?.isEmsClient || quickForm.isEmsClient
    const maxQty = isEmsClient ? 1 : Math.min(ticket.maxPerOrder, ticket.availableStock)
    
    if (currentQty < maxQty) {
      updateTicketQuantity(ticket, currentQty + 1)
    }
  }

  const decreaseQuantity = (ticket: TicketType) => {
    const currentQty = getSelectedQuantity(ticket.id)
    if (currentQty > 0) {
      updateTicketQuantity(ticket, currentQty - 1)
    }
  }

  // ✅ NEW: Manual quantity input handlers
  const handleQuantityClick = (ticketId: string) => {
    const currentQty = getSelectedQuantity(ticketId)
    setEditingQuantity(ticketId)
    setTempQuantity(currentQty.toString())
  }

  const handleQuantityChange = (value: string) => {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setTempQuantity(value)
    }
  }

  const handleQuantitySubmit = (ticket: TicketType) => {
    const newQty = parseInt(tempQuantity) || 0
    const isEmsClient = selectedRegistration?.isEmsClient || quickForm.isEmsClient
    const maxQty = isEmsClient ? 1 : Math.min(ticket.maxPerOrder, ticket.availableStock)
    
    const finalQty = Math.min(Math.max(0, newQty), maxQty)
    updateTicketQuantity(ticket, finalQty)
    setEditingQuantity(null)
    setTempQuantity('')
  }

  const handleQuantityCancel = () => {
    setEditingQuantity(null)
    setTempQuantity('')
  }

  const handleQuantityKeyDown = (e: React.KeyboardEvent, ticket: TicketType) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleQuantitySubmit(ticket)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleQuantityCancel()
    }
  }

  const generateTicketsForExisting = async () => {
    if (!selectedRegistration || selectedTickets.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a user and at least one ticket type",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/tickets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: selectedRegistration.id,
          tickets: selectedTickets,
          adminUser: 'Admin User'
        })
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: `Generated ${selectedTickets.reduce((sum, t) => sum + t.quantity, 0)} tickets`,
        })
        onSuccess()
        resetForm()
        onOpenChange(false)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateQuickTickets = async () => {
    if (!quickForm.firstName || !quickForm.lastName || selectedTickets.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in required fields and select ticket types",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/tickets/quick-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: quickForm,
          tickets: selectedTickets,
          adminUser: 'Admin User'
        })
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: `Generated ${selectedTickets.reduce((sum, t) => sum + t.quantity, 0)} tickets`,
        })
        onSuccess()
        resetForm()
        onOpenChange(false)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedRegistration(null)
    setQuickForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isEmsClient: false,
      paymentMethod: 'CASH'
    })
    setSelectedTickets([])
    setActiveTab('quick') // ✅ CHANGED: Reset to quick tab
    setEditingQuantity(null) // ✅ NEW: Reset quantity editing
    setTempQuantity('')
  }

  const formatPrice = (cents: number): string => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const totalTickets = selectedTickets.reduce((sum, t) => sum + t.quantity, 0)
  const totalCost = selectedTickets.reduce((sum, t) => sum + t.priceInCents, 0)
  const isEmsClient = selectedRegistration?.isEmsClient || quickForm.isEmsClient

  // Calculate total savings
  const totalSavings = selectedTickets.reduce((sum, selected) => {
    const ticket = ticketTypes.find(t => t.id === selected.ticketTypeId)
    if (!ticket) return sum
    const pricing = calculatePriceForQuantity(ticket, selected.quantity)
    return sum + pricing.savings
  }, 0)

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600" />
            Generate Tickets
            {isEmsClient && <Badge className="bg-yellow-100 text-yellow-800">EMS Customer</Badge>}
          </DialogTitle>
          <DialogDescription>
            Create tickets for existing customers or add new quick registrations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'quick' | 'existing')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">
              <UserPlus className="h-4 w-4 mr-2" />
              Quick Generate
            </TabsTrigger>
            <TabsTrigger value="existing">
              <Users className="h-4 w-4 mr-2" />
              Existing Customer
            </TabsTrigger>
          </TabsList>

          {/* Quick Generate Tab - NOW FIRST */}
         <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={quickForm.firstName}
                      onChange={(e) => setQuickForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={quickForm.lastName}
                      onChange={(e) => setQuickForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email (Optional)</Label>
                  <Input
                    type="email"
                    value={quickForm.email}
                    onChange={(e) => setQuickForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <Label>Phone Number (Optional)</Label>
                  <Input
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+356 1234 5678"
                  />
                </div>

                {/* ✅ NEW: Payment Method Selection */}
                <div>
                  <Label>Payment Method</Label>
                  <select
                    value={quickForm.paymentMethod}
                    onChange={(e) => setQuickForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <Label className="text-sm font-medium">EMS Customer</Label>
                    <p className="text-xs text-gray-600">Free tickets for EMS customers</p>
                  </div>
                  <Button
                    variant={quickForm.isEmsClient ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickForm(prev => ({ ...prev, isEmsClient: !prev.isEmsClient }))}
                  >
                    {quickForm.isEmsClient ? 'EMS' : 'Public'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Existing Customer Tab - NOW SECOND */}
          <TabsContent value="existing" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((registration) => (
                      <div
                        key={registration.id}
                        onClick={() => setSelectedRegistration(registration)}
                        className={`p-3 rounded border cursor-pointer transition-colors ${
                          selectedRegistration?.id === registration.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{registration.name}</span>
                              <Badge variant={registration.isEmsClient ? "default" : "outline"} className="text-xs">
                                {registration.isEmsClient ? 'EMS' : 'Public'}
                              </Badge>
                            </div>
                            {/* ✅ FIXED: Show email and phone properly */}
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span>{registration.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{registration.phone}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {registration.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected User */}
                {selectedRegistration && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900">Selected: {selectedRegistration.name}</h4>
                        <p className="text-sm text-green-600">{selectedRegistration.email}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRegistration(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

  
        </Tabs>

        {/* Ticket Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketTypes.filter(t => t.isActive && t.availableStock > 0).map((ticket) => {
              const selectedQty = getSelectedQuantity(ticket.id)
              const maxQty = isEmsClient ? 1 : Math.min(ticket.maxPerOrder, ticket.availableStock)
              const pricing = calculatePriceForQuantity(ticket, selectedQty)
              const baseUnitPrice = ticket.basePrice || ticket.priceInCents

              return (
                <div key={ticket.id} className={`border rounded p-3 ${selectedQty > 0 ? 'bg-blue-50 border-blue-300' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{ticket.name}</h4>
                        {selectedQty > 0 && <Badge variant="secondary">{selectedQty}</Badge>}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {isEmsClient ? 'FREE' : formatPrice(baseUnitPrice)} per ticket • {ticket.availableStock} available
                      </div>

                      {/* Tiered Pricing Display */}
                      {!isEmsClient && ticket.hasTieredPricing && ticket.pricingTiers && ticket.pricingTiers.length > 0 && (
                        <div className="text-xs bg-green-50 border border-green-200 rounded p-2 mb-2">
                          <div className="flex items-center gap-1 text-green-700 mb-1">
                            <TrendingDown className="h-3 w-3" />
                            <span className="font-medium">Volume Discounts:</span>
                          </div>
                          <div className="space-y-1">
                            {ticket.pricingTiers.map((tier, index) => {
                              const regularPrice = baseUnitPrice * tier.ticketCount
                              const savings = regularPrice - tier.priceInCents
                              return (
                                <div key={index} className="text-green-600">
                                  {tier.ticketCount} tickets: {formatPrice(tier.priceInCents)}
                                  {savings > 0 && <span className="text-green-700 ml-1">(Save {formatPrice(savings)})</span>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Selected Ticket Summary */}
                      {selectedQty > 0 && (
                        <div className="text-sm">
                          {pricing.savings > 0 && !isEmsClient && (
                            <div className="text-green-600 mb-1">
                              💰 You saved {formatPrice(pricing.savings)}!
                              {pricing.appliedTier && (
                                <div className="text-xs text-green-700 mt-1">
                                  Applied: {pricing.appliedTier.name}
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            Total: <span className="font-medium">{isEmsClient ? 'FREE' : formatPrice(pricing.priceInCents)}</span>
                          </div>
                          {/* ✅ NEW: Show pricing breakdown for debugging */}
                          {pricing.breakdown && !isEmsClient && (
                            <div className="text-xs text-gray-500 mt-1">
                              Breakdown: {pricing.breakdown}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                      {/* ✅ ENHANCED: Quantity Controls with Manual Input */}
                      {editingQuantity === ticket.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => decreaseQuantity(ticket)}
                            disabled={selectedQty === 0}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <Input
                            value={tempQuantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            onKeyDown={(e) => handleQuantityKeyDown(e, ticket)}
                            onBlur={() => handleQuantitySubmit(ticket)}
                            className="w-16 h-8 text-center text-sm"
                            autoFocus
                            placeholder="0"
                          />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => increaseQuantity(ticket)}
                            disabled={selectedQty >= maxQty}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          <span className="text-xs text-gray-500">
                            max: {maxQty}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => decreaseQuantity(ticket)}
                            disabled={selectedQty === 0}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <button
                            onClick={() => handleQuantityClick(ticket.id)}
                            className="w-16 h-8 text-center font-medium bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded transition-colors cursor-pointer"
                            title="Click to edit quantity manually"
                          >
                            {selectedQty}
                          </button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => increaseQuantity(ticket)}
                            disabled={selectedQty >= maxQty}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          <span className="text-xs text-gray-500">
                            max: {maxQty}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )
            })}

            {/* Order Summary */}
            {selectedTickets.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium mb-3">Order Summary</h4>
                
                {selectedTickets.map((selected) => (
                  <div key={selected.ticketTypeId} className="flex justify-between text-sm mb-1">
                    <span>{selected.name} × {selected.quantity}</span>
                    <span className="font-medium">
                      {isEmsClient ? 'FREE' : formatPrice(selected.priceInCents)}
                    </span>
                  </div>
                ))}
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total ({totalTickets} tickets):</span>
                    <span>{isEmsClient ? 'FREE' : formatPrice(totalCost)}</span>
                  </div>
                  
                  {totalSavings > 0 && !isEmsClient && (
                    <div className="text-sm text-green-600 mt-1">
                      Total savings: {formatPrice(totalSavings)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedTickets.length > 0 && (
              <span>Ready to generate {totalTickets} tickets</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={activeTab === 'quick' ? generateQuickTickets : generateTicketsForExisting}
              disabled={loading || selectedTickets.length === 0 || 
                (activeTab === 'existing' && !selectedRegistration) ||
                (activeTab === 'quick' && (!quickForm.firstName || !quickForm.lastName))
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Ticket className="mr-2 h-4 w-4" />
                  Generate {totalTickets} Ticket{totalTickets !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}