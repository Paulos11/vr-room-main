// src/components/forms/steps/TicketSelectionStep.tsx - Updated to pass email for per-user validation
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ticket, Plus, Minus, AlertTriangle, Tag, Check, X, Loader2 } from 'lucide-react'
import { StepProps, TicketType, SelectedTicket } from '@/types/registration'
import { toast } from '@/components/ui/use-toast'

interface CouponValidationResult {
  isValid: boolean
  coupon?: {
    id: string
    code: string
    name: string
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
    discountValue: number
    minOrderAmount?: number
    maxUsesPerUser?: number
    currentUses?: number
    maxUses?: number
  }
  discountAmount?: number
  message?: string
}

export function TicketSelectionStep({ formData, onUpdate }: StepProps) {
  const [availableTickets, setAvailableTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState(formData.couponCode || '')
  const [couponValidation, setCouponValidation] = useState<CouponValidationResult | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponTouched, setCouponTouched] = useState(false)

  useEffect(() => {
    fetchAvailableTickets()
  }, [formData.isEmsClient])

  // Debounced coupon validation
  useEffect(() => {
    if (!couponCode.trim()) {
      setCouponValidation(null)
      onUpdate('couponCode', '')
      onUpdate('appliedDiscount', 0)
      return
    }

    if (couponTouched && couponCode.length >= 3) {
      const timeoutId = setTimeout(() => {
        validateCoupon(couponCode)
      }, 800)
      
      return () => clearTimeout(timeoutId)
    }
  }, [couponCode, couponTouched, formData.email]) // Add formData.email as dependency

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

  const validateCoupon = async (code: string) => {
    if (!code.trim() || formData.isEmsClient) return

    setValidatingCoupon(true)
    try {
      const totalAmount = getTotalCost()
      
      // Include customer email for per-user validation if available
      const validationData = {
        code: code.toUpperCase(),
        orderAmount: totalAmount,
        isEmsClient: formData.isEmsClient,
        ...(formData.email && { customerEmail: formData.email }) // Add email if available
      }

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationData)
      })

      const result = await response.json()
      
      if (result.success && result.data.isValid) {
        const discount = result.data.discountAmount || 0
        setCouponValidation(result.data)
        onUpdate('couponCode', code.toUpperCase())
        onUpdate('appliedDiscount', discount)
        
        toast({
          title: "Coupon Applied!",
          description: `You saved €${(discount / 100).toFixed(2)}`,
        })
      } else {
        setCouponValidation({
          isValid: false,
          message: result.message || 'Invalid coupon code'
        })
        onUpdate('couponCode', '')
        onUpdate('appliedDiscount', 0)
        
        // Show specific error message
        toast({
          title: "Coupon Error",
          description: result.message || 'Invalid coupon code',
          variant: "destructive",
        })
      }
    } catch (error) {
      setCouponValidation({
        isValid: false,
        message: 'Failed to validate coupon'
      })
      onUpdate('appliedDiscount', 0)
      
      toast({
        title: "Error",
        description: 'Failed to validate coupon',
        variant: "destructive",
      })
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleCouponChange = (value: string) => {
    setCouponCode(value.toUpperCase())
    setCouponTouched(true)
    
    // Clear validation immediately when user types
    if (couponValidation) {
      setCouponValidation(null)
      onUpdate('appliedDiscount', 0)
    }
  }

  const handleCouponBlur = () => {
    // Validate immediately when user leaves the field
    if (couponCode.trim() && couponCode.length >= 3) {
      validateCoupon(couponCode)
    }
  }

  const handleCouponKeyPress = (e: React.KeyboardEvent) => {
    // Validate when user presses Enter
    if (e.key === 'Enter' && couponCode.trim() && couponCode.length >= 3) {
      e.preventDefault()
      validateCoupon(couponCode)
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setCouponValidation(null)
    setCouponTouched(false)
    onUpdate('couponCode', '')
    onUpdate('appliedDiscount', 0)
  }

  const getSelectedQuantity = (ticketTypeId: string): number => {
    const selected = formData.selectedTickets.find(t => t.ticketTypeId === ticketTypeId)
    return selected ? selected.quantity : 0
  }

  const updateTicketQuantity = (ticket: TicketType, newQuantity: number) => {
    const currentSelected = [...formData.selectedTickets]
    const existingIndex = currentSelected.findIndex(t => t.ticketTypeId === ticket.id)
    
    if (newQuantity === 0) {
      if (existingIndex !== -1) {
        currentSelected.splice(existingIndex, 1)
      }
    } else {
      const selectedTicket: SelectedTicket = {
        ticketTypeId: ticket.id,
        name: ticket.name,
        priceInCents: formData.isEmsClient ? 0 : ticket.priceInCents,
        quantity: formData.isEmsClient ? 1 : newQuantity,
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
    
    // Re-validate coupon if applied when tickets change
    if (couponValidation?.isValid && couponCode) {
      setTimeout(() => validateCoupon(couponCode), 100)
    }
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

  const getAppliedDiscount = (): number => {
    return formData.appliedDiscount || 0
  }

  const getFinalCost = (): number => {
    const total = getTotalCost()
    const discount = getAppliedDiscount()
    return Math.max(0, total - discount)
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

      {/* Available Tickets */}
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

      {/* Coupon Code Section - Only for Public Customers */}
      {!formData.isEmsClient && formData.selectedTickets.length > 0 && (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
          <Label className="text-sm font-medium mb-2 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Coupon Code (Optional)
          </Label>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={couponCode}
                onChange={(e) => handleCouponChange(e.target.value)}
                onBlur={handleCouponBlur}
                onKeyPress={handleCouponKeyPress}
                placeholder="Enter code and press Enter"
                className="h-8 text-sm pr-8"
                disabled={validatingCoupon}
              />
              {validatingCoupon && (
                <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-gray-400" />
              )}
              {couponValidation?.isValid && (
                <Check className="absolute right-2 top-2 h-4 w-4 text-green-500" />
              )}
              {couponValidation && !couponValidation.isValid && (
                <X className="absolute right-2 top-2 h-4 w-4 text-red-500" />
              )}
            </div>
            
            {couponValidation?.isValid && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeCoupon}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Coupon Status Messages */}
          {couponValidation && (
            <div className={`mt-2 text-xs flex items-center gap-1 ${
              couponValidation.isValid ? 'text-green-700' : 'text-red-700'
            }`}>
              {couponValidation.isValid ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>
                    {couponValidation.coupon?.name} applied! 
                    {getAppliedDiscount() > 0 && ` Save ${formatPrice(getAppliedDiscount())}`}
                  </span>
                </>
              ) : (
                <>
                  <X className="h-3 w-3" />
                  <span>{couponValidation.message}</span>
                </>
              )}
            </div>
          )}

          {/* Email Warning */}
          {!formData.email && couponCode && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Enter your email in the next step for accurate coupon validation
            </div>
          )}
        </div>
      )}

      {/* Selection Summary */}
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
            
            {!formData.isEmsClient && (
              <div className="border-t pt-1 mt-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>{formatPrice(getTotalCost())}</span>
                </div>
                
                {getAppliedDiscount() > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Discount ({formData.couponCode}):</span>
                    <span>-{formatPrice(getAppliedDiscount())}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-sm border-t pt-1">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    {formatPrice(getFinalCost())}
                  </span>
                </div>
              </div>
            )}
            
            {formData.isEmsClient && (
              <div className="border-t pt-1 mt-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>Total:</span>
                  <span className="text-green-600">FREE</span>
                </div>
              </div>
            )}
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