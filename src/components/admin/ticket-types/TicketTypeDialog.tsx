// CLEAN: Simple TicketTypeDialog - No confusing examples
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { Plus, Trash2 } from 'lucide-react'

interface TicketType {
  id: string
  name: string
  description?: string
  priceInCents: number
  totalStock: number
  soldStock: number
  availableStock: number
  isActive: boolean
}

interface TicketTypeDialogProps {
  ticket: TicketType | null
  onSave: () => void
  onCancel: () => void
}

interface Package {
  name: string
  price: string
  tickets: number
}

export function TicketTypeDialog({ ticket, onSave, onCancel }: TicketTypeDialogProps) {
  // Basic form data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priceType, setPriceType] = useState<'single' | 'packages'>('single')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState(100)
  const [saving, setSaving] = useState(false)

  // Package pricing - start with just one empty package
  const [packages, setPackages] = useState<Package[]>([
    { name: 'Single', price: '', tickets: 1 }
  ])

  // Load existing ticket data
  useEffect(() => {
    if (ticket) {
      setName(ticket.name)
      setDescription(ticket.description || '')
      setPrice((ticket.priceInCents / 100).toFixed(2))
      setStock(ticket.totalStock)
      setPriceType('single') // Default to single for existing tickets
    } else {
      // Reset for new ticket
      setName('')
      setDescription('')
      setPrice('')
      setStock(100)
      setPriceType('single')
      setPackages([{ name: 'Single', price: '', tickets: 1 }])
    }
  }, [ticket])

  const addPackage = () => {
    setPackages([...packages, { name: `Package ${packages.length + 1}`, price: '', tickets: 1 }])
  }

  const removePackage = (index: number) => {
    if (packages.length > 1) {
      setPackages(packages.filter((_, i) => i !== index))
    }
  }

  const updatePackage = (index: number, field: keyof Package, value: any) => {
    setPackages(packages.map((pkg, i) => i === index ? { ...pkg, [field]: value } : pkg))
  }

  const handleSave = async () => {
    // Simple validation
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a ticket name",
        variant: "destructive"
      })
      return
    }

    if (priceType === 'single' && (!price || parseFloat(price) <= 0)) {
      toast({
        title: "Price Required",
        description: "Please enter a valid price",
        variant: "destructive"
      })
      return
    }

    if (priceType === 'packages') {
      for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i]
        if (!pkg.name.trim() || !pkg.price || parseFloat(pkg.price) <= 0 || pkg.tickets <= 0) {
          toast({
            title: "Package Error",
            description: `Please complete all fields for package ${i + 1}`,
            variant: "destructive"
          })
          return
        }
      }
    }

    setSaving(true)

    try {
      const isEditing = !!ticket
      const url = isEditing ? `/api/admin/ticket-types/${ticket.id}` : '/api/admin/ticket-types'
      const method = isEditing ? 'PUT' : 'POST'

      // Prepare data
      let dataToSend: any = {
        name: name.trim(),
        description: description.trim() || null,
        totalStock: stock,
        maxPerOrder: 10,
        minPerOrder: 1,
        emsClientsOnly: false, // ✅ REMOVED: No more EMS restrictions
        publicOnly: false,     // ✅ REMOVED: No more public restrictions
        featured: false
      }

      if (priceType === 'single') {
        // Simple fixed pricing
        dataToSend.pricingType = 'FIXED'
        dataToSend.priceInCents = Math.round(parseFloat(price) * 100)
      } else {
        // Package pricing (tiered)
        dataToSend.pricingType = 'TIERED'
        dataToSend.basePrice = Math.round(parseFloat(packages[0].price) * 100) // Use first package as base
        dataToSend.priceInCents = Math.round(parseFloat(packages[0].price) * 100)
        
        dataToSend.pricingTiers = packages.map((pkg, index) => ({
          name: pkg.name,
          description: `${pkg.tickets} tickets for €${pkg.price}`,
          priceInCents: Math.round(parseFloat(pkg.price) * 100),
          ticketCount: pkg.tickets,
          isPopular: index === 1 && packages.length > 1, // Second option is popular if exists
          sortOrder: index
        }))
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success!",
          description: `Ticket ${isEditing ? 'updated' : 'created'} successfully`
        })
        onSave()
      } else {
        toast({
          title: "Error",
          description: result.message || 'Something went wrong',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to save ticket',
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {ticket ? 'Edit Ticket' : 'New Ticket'}
        </DialogTitle>
        <DialogDescription>
          {ticket ? 'Update ticket details' : 'Create a new ticket type'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Name */}
        <div>
          <Label>Ticket Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., VR Experience"
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this ticket include?"
            className="mt-1 resize-none"
            rows={2}
          />
        </div>

        {/* Stock */}
        <div>
          <Label>Total Tickets Available *</Label>
          <Input
            type="number"
            min="1"
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 100)}
            className="mt-1"
          />
        </div>

        {/* Pricing Type - Simplified */}
        <div>
          <Label>How do you want to price this?</Label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="single"
                checked={priceType === 'single'}
                onChange={(e) => setPriceType(e.target.value as 'single')}
                className="text-blue-600"
              />
              <span className="text-sm">One price per ticket (€10 = 1 ticket)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="packages"
                checked={priceType === 'packages'}
                onChange={(e) => setPriceType(e.target.value as 'packages')}
                className="text-blue-600"
              />
              <span className="text-sm">Package deals (€3=1, €4=2, €10=15 tickets)</span>
            </label>
          </div>
        </div>

        {/* Single Price */}
        {priceType === 'single' && (
          <div>
            <Label>Price per ticket (EUR) *</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="10.00"
                className="pl-8"
              />
            </div>
          </div>
        )}

        {/* Package Pricing */}
        {priceType === 'packages' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Create your packages *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPackage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {packages.map((pkg, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Package {index + 1}</span>
                    {packages.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePackage(index)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      value={pkg.name}
                      onChange={(e) => updatePackage(index, 'name', e.target.value)}
                      placeholder="Package name (e.g., Family Pack)"
                      className="text-sm"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">€</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pkg.price}
                            onChange={(e) => updatePackage(index, 'price', e.target.value)}
                            placeholder="Price"
                            className="text-sm pl-6"
                          />
                        </div>
                      </div>
                      <div>
                        <Input
                          type="number"
                          min="1"
                          value={pkg.tickets}
                          onChange={(e) => updatePackage(index, 'tickets', parseInt(e.target.value) || 1)}
                          placeholder="# Tickets"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Show savings if we can calculate it */}
                    {pkg.price && pkg.tickets > 1 && packages[0].price && index > 0 && (
                      <div className="text-xs text-green-600">
                        Saves €{(parseFloat(packages[0].price) * pkg.tickets - parseFloat(pkg.price)).toFixed(2)} 
                        vs buying {pkg.tickets} individual
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {packages.length === 1 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  Click + to add more package options with better deals
                </div>
              )}
            </div>
          </div>
        )}

        {/* Existing ticket stats */}
        {ticket && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <div className="font-medium mb-2">Current Stats</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Sold:</span>
                <span className="text-green-600">{ticket.soldStock}</span>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <span>{ticket.availableStock}</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="text-green-600">
                  €{((ticket.soldStock * ticket.priceInCents) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : (ticket ? 'Update' : 'Create')}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}