
// src/components/forms/steps/TicketSelectionStep.tsx - More compact version
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Ticket, Plus, Minus, AlertTriangle } from 'lucide-react'
import { StepProps, TicketType, SelectedTicket } from '@/types/registration'
import { toast } from '@/components/ui/use-toast'

export function TicketSelectionStep({ formData, onUpdate }: StepProps) {
  const [availableTickets, setAvailableTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAvailableTickets()
  }, [formData.isEmsClient])

  const fetchAvailableTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ticket-types/public?isEmsClient=${formData.isEmsClient}`)
      const result = await response.json()
      
      if (result.success) {
        setAvailableTickets(result.data.ticketTypes || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load ticket types",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast({
        title: "Error",
        description: "Failed to load ticket types",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getSelectedQuantity = (ticketTypeId: string): number => {
    const selected = formData.selectedTickets.find(t => t.ticketTypeId === ticketTypeId)
    return selected ? selected.quantity : 0
  }

  const updateTicketQuantity = (ticket: TicketType, newQuantity: number) => {
    const currentSelected = [...formData.selectedTickets]
    const existingIndex = currentSelected.findIndex(t => t.ticketTypeId === ticket.id)
    
    if (newQuantity === 0) {
      // Remove ticket if quantity is 0
      if (existingIndex !== -1) {
        currentSelected.splice(existingIndex, 1)
      }
    } else {
      const selectedTicket: SelectedTicket = {
        ticketTypeId: ticket.id,
        name: ticket.name,
        priceInCents: formData.isEmsClient ? 0 : ticket.priceInCents, // Free for EMS clients
        quantity: formData.isEmsClient ? 1 : newQuantity, // Force quantity 1 for EMS clients
        maxPerOrder: ticket.maxPerOrder,
        minPerOrder: ticket.minPerOrder
      }
      
      if (existingIndex !== -1) {
        currentSelected[existingIndex] = selectedTicket
      } else {
        currentSelected.push(selectedTicket)
      }
    }
    
    onUpdate('selectedTickets', currentSelected)
  }

  const increaseQuantity = (ticket: TicketType) => {
    const currentQty = getSelectedQuantity(ticket.id)
    const maxQty = formData.isEmsClient ? 1 : Math.min(ticket.maxPerOrder, ticket.availableStock)
    
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

  const getTotalTickets = (): number => {
    return formData.selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
  }

  const getTotalCost = (): number => {
    if (formData.isEmsClient) return 0
    return formData.selectedTickets.reduce((sum, ticket) => 
      sum + (ticket.priceInCents * ticket.quantity), 0
    )
  }

  const formatPrice = (cents: number): string => {
    return `€${(cents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading available tickets...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-center mb-3">
        <h3 className="text-base font-semibold flex items-center justify-center gap-2">
          <Ticket className="h-4 w-4" />
          Select Your Tickets
        </h3>
        <p className="text-xs text-gray-600">
          {formData.isEmsClient 
            ? 'Choose your complimentary tickets (1 each)' 
            : 'Choose tickets and quantities'
          }
        </p>
      </div>

      {/* EMS Customer Notice */}
      {formData.isEmsClient && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-green-800">
            <Ticket className="h-3 w-3" />
            <span className="font-medium">EMS Customer Benefits: All tickets complimentary (1 each)</span>
          </div>
        </div>
      )}

      {/* Available Tickets - Compact Cards */}
      <div className="space-y-2">
        {availableTickets.length === 0 ? (
          <div className="text-center py-6 text-gray-600">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No tickets available at this time</p>
          </div>
        ) : (
          availableTickets.map(ticket => {
            const selectedQty = getSelectedQuantity(ticket.id)
            const maxQty = formData.isEmsClient ? 1 : Math.min(ticket.maxPerOrder, ticket.availableStock)
            const isSelected = selectedQty > 0
            
            return (
              <div 
                key={ticket.id} 
                className={`p-3 border rounded-lg transition-all duration-200 ${
                  isSelected ? 'ring-1 ring-blue-500 bg-blue-50 border-blue-300' : 'hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Ticket Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{ticket.name}</h4>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {selectedQty}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-sm font-bold ${
                        formData.isEmsClient ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {formData.isEmsClient ? 'FREE' : formatPrice(ticket.priceInCents)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {ticket.availableStock} available
                      </span>
                    </div>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => decreaseQuantity(ticket)}
                      disabled={selectedQty === 0}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-6 text-center text-sm font-medium">
                      {selectedQty}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => increaseQuantity(ticket)}
                      disabled={selectedQty >= maxQty}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Subtotal for selected tickets */}
                {isSelected && !formData.isEmsClient && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="flex justify-between text-xs">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        {formatPrice(ticket.priceInCents * selectedQty)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Selection Summary - Compact */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-3 border-2 border-blue-200 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Summary</h4>
            <span className="text-xs text-gray-600">{getTotalTickets()} tickets</span>
          </div>
          
          <div className="space-y-1">
            {formData.selectedTickets.map(ticket => (
              <div key={ticket.ticketTypeId} className="flex justify-between text-xs">
                <span className="truncate">{ticket.name} × {ticket.quantity}</span>
                <span className="font-medium ml-2">
                  {formData.isEmsClient ? 'FREE' : formatPrice(ticket.priceInCents * ticket.quantity)}
                </span>
              </div>
            ))}
            
            <div className="border-t pt-1 mt-1">
              <div className="flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span className={formData.isEmsClient ? 'text-green-600' : 'text-blue-600'}>
                  {formData.isEmsClient ? 'FREE' : formatPrice(getTotalCost())}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {formData.selectedTickets.length === 0 && (
        <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-orange-800">
            <AlertTriangle className="h-3 w-3" />
            <span>Please select at least one ticket to continue</span>
          </div>
        </div>
      )}
    </div>
  )
}
