// src/components/admin/ticket-types/TicketTypeDialog.tsx - Updated with Description
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'

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

export function TicketTypeDialog({ ticket, onSave, onCancel }: TicketTypeDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceInCents: 0,
    totalStock: 100
  })

  const [priceDisplay, setPriceDisplay] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ticket) {
      setFormData({
        name: ticket.name,
        description: ticket.description || '',
        priceInCents: ticket.priceInCents,
        totalStock: ticket.totalStock
      })
      setPriceDisplay((ticket.priceInCents / 100).toFixed(2))
    } else {
      setFormData({
        name: '',
        description: '',
        priceInCents: 0,
        totalStock: 100
      })
      setPriceDisplay('')
    }
  }, [ticket])

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Ticket name is required",
          variant: "destructive",
        })
        return
      }

      if (formData.priceInCents < 0) {
        toast({
          title: "Error",
          description: "Price cannot be negative",
          variant: "destructive",
        })
        return
      }

      if (formData.totalStock < 0) {
        toast({
          title: "Error",
          description: "Stock cannot be negative",
          variant: "destructive",
        })
        return
      }

      setSaving(true)

      const isEditing = !!ticket
      const url = isEditing ? `/api/admin/ticket-types/${ticket.id}` : '/api/admin/ticket-types'
      const method = isEditing ? 'PUT' : 'POST'

      // Prepare the data to send
      const dataToSend = {
        ...formData,
        description: formData.description.trim() || null // Send null if empty
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Ticket type ${isEditing ? 'updated' : 'created'} successfully`,
        })
        onSave()
      } else {
        toast({
          title: "Error",
          description: result.message || `Failed to ${isEditing ? 'update' : 'create'} ticket type`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${ticket ? 'update' : 'create'} ticket type`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePriceChange = (value: string) => {
    setPriceDisplay(value)
    
    // Convert to cents, handling empty string
    if (value === '') {
      setFormData(prev => ({ ...prev, priceInCents: 0 }))
    } else {
      const numValue = parseFloat(value) || 0
      setFormData(prev => ({ ...prev, priceInCents: Math.round(numValue * 100) }))
    }
  }

  return (
    <DialogContent className="max-w-md bg-white max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {ticket ? 'Edit Ticket Type' : 'Create New Ticket Type'}
        </DialogTitle>
        <DialogDescription>
          {ticket ? 'Update ticket details' : 'Add a new ticket type'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor="name">Ticket Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Ice Skating"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this ticket includes, duration, age requirements, etc."
            className="resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            This description will be shown to customers during ticket selection
          </p>
        </div>
        
        {/* Price */}
        <div>
          <Label htmlFor="price">Price (EUR) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={priceDisplay}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
              className="pl-8"
              required
            />
          </div>
        </div>

        {/* Stock */}
        <div>
          <Label htmlFor="totalStock">Total Stock *</Label>
          <Input
            id="totalStock"
            type="number"
            min="0"
            value={formData.totalStock}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              totalStock: parseInt(e.target.value) || 0 
            }))}
            placeholder="100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Total number of tickets available for sale
          </p>
        </div>

        {/* Sales Report for existing tickets */}
        {ticket && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Current Sales Report</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Stock:</span>
                <span>{ticket.totalStock}</span>
              </div>
              <div className="flex justify-between">
                <span>Sold:</span>
                <span className="text-green-600">{ticket.soldStock}</span>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="text-blue-600">{ticket.availableStock}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Revenue:</span>
                <span className="text-green-600">
                  €{((ticket.soldStock * ticket.priceInCents) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : (ticket ? 'Update' : 'Create')}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}