// src/components/admin/GenerateTicketDialog.tsx - Enhanced ticket generation
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { 
  Loader2, 
  Search, 
  User, 
  Mail, 
  Phone, 
  Building,
  Ticket,
  Plus,
  UserPlus,
  Users,
  X
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

interface TicketType {
  id: string
  name: string
  priceInCents: number
  availableStock: number
  totalStock: number
  soldStock: number
  isActive: boolean
}

interface SelectedTicket {
  ticketTypeId: string
  name: string
  quantity: number
  maxStock: number
}

export function GenerateTicketDialog({ open, onOpenChange, onSuccess }: GenerateTicketDialogProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'quick'>('existing')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  
  // Existing user tab
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Registration[]>([])
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  
  // Quick ticket tab
  const [quickForm, setQuickForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isEmsClient: false
  })
  
  // Ticket selection
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([])
  
  // Fetch ticket types
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
        setTicketTypes(result.data.ticketTypes || [])
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

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchRegistrations(searchQuery)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, searchRegistrations])

  const addTicketType = (ticketType: TicketType) => {
    const existing = selectedTickets.find(t => t.ticketTypeId === ticketType.id)
    if (existing) {
      if (existing.quantity < existing.maxStock) {
        setSelectedTickets(prev => 
          prev.map(t => 
            t.ticketTypeId === ticketType.id 
              ? { ...t, quantity: t.quantity + 1 }
              : t
          )
        )
      }
    } else {
      setSelectedTickets(prev => [...prev, {
        ticketTypeId: ticketType.id,
        name: ticketType.name,
        quantity: 1,
        maxStock: ticketType.availableStock
      }])
    }
  }

  const updateTicketQuantity = (ticketTypeId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedTickets(prev => prev.filter(t => t.ticketTypeId !== ticketTypeId))
    } else {
      setSelectedTickets(prev => 
        prev.map(t => 
          t.ticketTypeId === ticketTypeId 
            ? { ...t, quantity: Math.min(quantity, t.maxStock) }
            : t
        )
      )
    }
  }

  const removeTicketType = (ticketTypeId: string) => {
    setSelectedTickets(prev => prev.filter(t => t.ticketTypeId !== ticketTypeId))
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
          description: `Generated ${selectedTickets.reduce((sum, t) => sum + t.quantity, 0)} tickets for ${selectedRegistration.name}`,
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
    if (!quickForm.firstName || !quickForm.lastName || !quickForm.phone || selectedTickets.length === 0) {
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
          description: `Generated ${selectedTickets.reduce((sum, t) => sum + t.quantity, 0)} tickets for ${quickForm.firstName} ${quickForm.lastName}`,
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
      isEmsClient: false
    })
    setSelectedTickets([])
    setActiveTab('existing')
  }

  const totalTickets = selectedTickets.reduce((sum, t) => sum + t.quantity, 0)
  const totalCost = selectedTickets.reduce((sum, t) => {
    const ticketType = ticketTypes.find(tt => tt.id === t.ticketTypeId)
    return sum + (ticketType ? ticketType.priceInCents * t.quantity : 0)
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
          </DialogTitle>
          <DialogDescription>
            Create tickets for existing customers or add new quick registrations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'existing' | 'quick')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Existing Customer
            </TabsTrigger>
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Quick Ticket
            </TabsTrigger>
          </TabsList>

          {/* Existing Customer Tab */}
          <TabsContent value="existing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search Registered Users</CardTitle>
                <CardDescription>Find existing customers by name, email, or phone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {searchResults.map((registration) => (
                      <div
                        key={registration.id}
                        onClick={() => setSelectedRegistration(registration)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedRegistration?.id === registration.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white hover:bg-gray-50'
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
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {registration.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {registration.phone}
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
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900">Selected Customer</h4>
                        <p className="text-green-700">{selectedRegistration.name}</p>
                        <p className="text-sm text-green-600">{selectedRegistration.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRegistration(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Ticket Tab */}
          <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Customer Registration</CardTitle>
                <CardDescription>Add new customer and generate tickets instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={quickForm.firstName}
                      onChange={(e) => setQuickForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={quickForm.lastName}
                      onChange={(e) => setQuickForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={quickForm.email}
                      onChange={(e) => setQuickForm(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={quickForm.phone}
                      onChange={(e) => setQuickForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10"
                      placeholder="+356 1234 5678"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">EMS Customer</Label>
                    <p className="text-xs text-gray-600">Free tickets for EMS customers</p>
                  </div>
                  <Button
                    variant={quickForm.isEmsClient ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickForm(prev => ({ ...prev, isEmsClient: !prev.isEmsClient }))}
                  >
                    {quickForm.isEmsClient ? (
                      <><Building className="h-3 w-3 mr-1" />EMS</>
                    ) : (
                      <><Users className="h-3 w-3 mr-1" />Public</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Ticket Types</CardTitle>
            <CardDescription>Choose ticket types and quantities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Available Ticket Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ticketTypes.filter(tt => tt.isActive && tt.availableStock > 0).map((ticketType) => (
                <div
                  key={ticketType.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => addTicketType(ticketType)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">{ticketType.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-green-600 font-medium">
                          €{(ticketType.priceInCents / 100).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ticketType.availableStock} available
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Tickets */}
            {selectedTickets.length > 0 && (
              <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900">Selected Tickets</h4>
                {selectedTickets.map((selected) => (
                  <div key={selected.ticketTypeId} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="font-medium text-sm">{selected.name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTicketQuantity(selected.ticketTypeId, selected.quantity - 1)}
                        className="h-6 w-6 p-0"
                      >
                        -
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{selected.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTicketQuantity(selected.ticketTypeId, selected.quantity + 1)}
                        className="h-6 w-6 p-0"
                        disabled={selected.quantity >= selected.maxStock}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTicketType(selected.ticketTypeId)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Total: {totalTickets} tickets</span>
                  <span className="font-medium text-green-600">
                    €{(totalCost / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={activeTab === 'existing' ? generateTicketsForExisting : generateQuickTickets}
            disabled={loading || selectedTickets.length === 0 || 
              (activeTab === 'existing' && !selectedRegistration) ||
              (activeTab === 'quick' && (!quickForm.firstName || !quickForm.lastName || !quickForm.phone))
            }
            className="min-w-32"
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
      </DialogContent>
    </Dialog>
  )
}