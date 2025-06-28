// FIXED: src/components/forms/steps/TicketSelectionStep.tsx - 50 max for public, 1 for EMS
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Ticket, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Tag, 
  Check, 
  X, 
  Loader2,
  TrendingDown,
  Gift
} from 'lucide-react'
import { StepProps, TicketType, SelectedTicket, RegistrationFormData, CouponValidationResult } from '@/types/registration'
import { toast } from '@/components/ui/use-toast'

// ✅ FREE TICKET COUPON CONFIGURATION
const FREE_TICKET_COUPON = 'EMS_ECOFLOW11'
const FREE_TICKET_COUPONS = ['EMS_ECOFLOW11']

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
  }, [couponCode, couponTouched, formData.email])

  const fetchAvailableTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ticket-types/public?isEmsClient=${formData.isEmsClient}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log('Fetched tickets:', result.data.ticketTypes)
        setAvailableTickets(result.data.ticketTypes || [])
      } else {
        throw new Error(result.message || 'Failed to load ticket types')
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

  // ✅ Check if current coupon is a free ticket coupon
  const isFreeTicketCoupon = (code: string): boolean => {
    return FREE_TICKET_COUPONS.includes(code.toUpperCase())
  }

  // ✅ FIXED: Validate coupon with auto-select all tickets functionality
  const validateCoupon = async (code: string) => {
    if (!code.trim() || formData.isEmsClient) return

    setValidatingCoupon(true)
    try {
      const totalAmount = getTotalCost()
      
      // ✅ SPECIAL HANDLING: Free ticket coupon
      if (isFreeTicketCoupon(code)) {
        console.log('Processing free ticket coupon:', code.toUpperCase())
        
        // ✅ FIXED: Always auto-select ALL available tickets (1 each)
        const autoSelectedTickets: SelectedTicket[] = availableTickets.map(ticket => {
          const pricing = calculatePriceForQuantity(ticket, 1)
          return {
            ticketTypeId: ticket.id,
            name: ticket.name,
            priceInCents: pricing.priceInCents,
            quantity: 1,
            maxPerOrder: ticket.maxPerOrder,
            minPerOrder: ticket.minPerOrder
          }
        })
        
        // Update selected tickets to include all available tickets
        onUpdate('selectedTickets', autoSelectedTickets)
        
        // Calculate total discount (all tickets at original price)
        const totalTicketPrice = availableTickets.reduce((sum, ticket) => {
          return sum + ticket.priceInCents
        }, 0)
        
        // Set up fake coupon validation result for free ticket
        setCouponValidation({
          isValid: true,
          coupon: {
            id: 'free-ticket-special',
            code: code.toUpperCase(),
            name: 'Free Ticket Coupon 🎉',
            discountType: 'FIXED_AMOUNT',
            discountValue: totalTicketPrice,
            description: 'Special promotion - All tickets free!'
          },
          discountAmount: totalTicketPrice,
          message: 'Free ticket applied! All available tickets are now FREE! 🎉'
        })
        
        onUpdate('couponCode', code.toUpperCase())
        onUpdate('appliedDiscount', totalTicketPrice)
        
        toast({
          title: "🎉 All Tickets FREE!",
          description: `All ${availableTickets.length} ticket types selected and are now completely free!`,
        })
        
        setValidatingCoupon(false)
        return
      }
      
      // ✅ REGULAR COUPON VALIDATION (existing logic)
      const validationData = {
        code: code.toUpperCase(),
        orderAmount: totalAmount,
        isEmsClient: formData.isEmsClient,
        ...(formData.email && { customerEmail: formData.email })
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
    
    if (couponValidation) {
      setCouponValidation(null)
      onUpdate('appliedDiscount', 0)
    }
  }

  const handleCouponBlur = () => {
    if (couponCode.trim() && couponCode.length >= 3) {
      validateCoupon(couponCode)
    }
  }

  const handleCouponKeyPress = (e: React.KeyboardEvent) => {
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
    // Reset tickets to empty when removing free coupon
    if (isFreeTicketCoupon(formData.couponCode || '')) {
      onUpdate('selectedTickets', [])
    }
  }

  const getSelectedQuantity = (ticketTypeId: string): number => {
    const selected = formData.selectedTickets.find(t => t.ticketTypeId === ticketTypeId)
    return selected ? selected.quantity : 0
  }

  // ✅ Calculate price for quantity based on tiers
  const calculatePriceForQuantity = (ticket: TicketType, quantity: number) => {
    if (formData.isEmsClient || !ticket.hasTieredPricing || !ticket.pricingTiers) {
      return {
        priceInCents: formData.isEmsClient ? 0 : ticket.priceInCents * quantity,
        savings: 0,
        appliedTier: null
      }
    }

    // Find the exact tier match or best applicable tier
    let appliedTier = null
    let finalPrice = ticket.priceInCents * quantity // Default to per-ticket pricing

    // Sort tiers by ticket count (descending) to find best match
    const sortedTiers = [...ticket.pricingTiers].sort((a, b) => b.ticketCount - a.ticketCount)
    
    for (const tier of sortedTiers) {
      if (quantity === tier.ticketCount) {
        // Exact match - use tier price
        finalPrice = tier.priceInCents
        appliedTier = tier
        break
      } else if (quantity > tier.ticketCount) {
        // For quantities larger than tier, calculate mixed pricing
        const completeTiers = Math.floor(quantity / tier.ticketCount)
        const remainingTickets = quantity % tier.ticketCount
        const mixedPrice = (completeTiers * tier.priceInCents) + (remainingTickets * ticket.priceInCents)
        
        if (mixedPrice < finalPrice) {
          finalPrice = mixedPrice
          appliedTier = tier
        }
      }
    }

    const regularPrice = ticket.priceInCents * quantity
    const savings = regularPrice - finalPrice

    return {
      priceInCents: finalPrice,
      savings: Math.max(0, savings),
      appliedTier
    }
  }

  const updateTicketQuantity = (ticket: TicketType, newQuantity: number) => {
    const currentSelected = [...formData.selectedTickets]
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
    
    // ✅ Re-validate free ticket coupon if active
    if (isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid) {
      setTimeout(() => {
        // Recalculate total discount for all available tickets
        const totalPrice = availableTickets.reduce((sum, ticket) => {
          return sum + ticket.priceInCents
        }, 0)
        onUpdate('appliedDiscount', totalPrice)
      }, 100)
    } else if (couponValidation?.isValid && couponCode) {
      setTimeout(() => validateCoupon(couponCode), 100)
    }
  }

  // ✅ UPDATED: Increase quantity with proper limits
  const increaseQuantity = (ticket: TicketType) => {
    const currentQty = getSelectedQuantity(ticket.id)
    
    // ✅ UPDATED: EMS customers max 1, Public customers use ticket's maxPerOrder (now 50 by default)
    const maxQty = formData.isEmsClient ? 1 : Math.min(ticket.maxPerOrder, ticket.availableStock)
    
    // ✅ FREE TICKET RESTRICTION: Check if free coupon is active
    const activeFreeTicketCoupon = isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid
    
    if (activeFreeTicketCoupon) {
      // For free ticket coupon: Allow maximum 1 per ticket type
      if (currentQty >= 1) {
        toast({
          title: "Free ticket limit reached",
          description: "This coupon allows only 1 ticket per type",
          variant: "destructive",
        })
        return
      }
      // Allow adding 1 ticket of this type
      if (currentQty < 1) {
        updateTicketQuantity(ticket, currentQty + 1)
      }
    } else {
      // ✅ UPDATED: Normal quantity increase - now respects the higher maxPerOrder
      if (currentQty < maxQty) {
        updateTicketQuantity(ticket, currentQty + 1)
      } else {
        // Show appropriate message based on limit type
        const limitType = formData.isEmsClient ? "EMS customers are limited to 1 ticket per type" : 
                         currentQty >= ticket.availableStock ? "Not enough tickets available" :
                         `Maximum ${ticket.maxPerOrder} tickets per order for this type`
        
        toast({
          title: "Quantity limit reached",
          description: limitType,
          variant: "destructive",
        })
      }
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
    
    // ✅ Use the actual calculated price from selected tickets (which includes tier discounts)
    return formData.selectedTickets.reduce((sum, ticket) => 
      sum + ticket.priceInCents, 0
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
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading available tickets...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Ticket className="h-5 w-5" />
          Select Your Tickets
        </h3>
        <p className="text-sm text-gray-600">
          {formData.isEmsClient 
            ? 'Choose your complimentary tickets (1 each)' 
            : 'Choose tickets and quantities (up to 50 each)'
          }
        </p>
      </div>

      {/* EMS Customer Notice */}
      {formData.isEmsClient && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <Ticket className="h-4 w-4" />
            <span className="font-medium">EMS Customer Benefits: All tickets complimentary (1 each)</span>
          </div>
        </div>
      )}

      {/* ✅ FREE TICKET COUPON ACTIVE NOTICE - Only show AFTER coupon is applied */}
      {!formData.isEmsClient && isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-purple-800">
            <Gift className="h-4 w-4" />
            <span className="font-medium">🎉 Free Ticket Coupon Active - All tickets FREE!</span>
          </div>
          <p className="text-xs text-purple-600 mt-1">
            All available ticket types have been selected and are completely FREE! Each type is limited to quantity 1.
          </p>
        </div>
      )}

      {/* Available Tickets */}
      <div className="space-y-3">
        {availableTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No tickets available at this time</p>
          </div>
        ) : (
          availableTickets.map(ticket => {
            const selectedQty = getSelectedQuantity(ticket.id)
            
            // ✅ UPDATED: Calculate proper max quantity
            const maxQty = formData.isEmsClient ? 1 : Math.min(ticket.maxPerOrder, ticket.availableStock)
            const isSelected = selectedQty > 0
            
            // ✅ Apply free ticket restrictions
            const activeFreeTicketCoupon = isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid
            const finalMaxQty = activeFreeTicketCoupon ? 1 : maxQty
            const canAddMore = selectedQty < finalMaxQty
            
            // Calculate current pricing and savings
            const pricing = calculatePriceForQuantity(ticket, selectedQty)
            
            return (
              <div 
                key={ticket.id} 
                className={`border rounded-lg transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' : 'hover:border-blue-300'
                } ${activeFreeTicketCoupon && isSelected ? 'ring-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300' : ''}`}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    {/* Ticket Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{ticket.name}</h4>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {selectedQty}
                          </Badge>
                        )}
                        {ticket.featured && (
                          <Badge variant="outline" className="text-xs px-1 py-0.5 text-yellow-700 border-yellow-300">
                            Featured
                          </Badge>
                        )}
                        {activeFreeTicketCoupon && isSelected && (
                          <Badge className="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 border-purple-300">
                            FREE! 🎉
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-bold ${
                          formData.isEmsClient ? 'text-green-600' : 
                          (activeFreeTicketCoupon && isSelected) ? 'text-purple-600' : 'text-blue-600'
                        }`}>
                          {formData.isEmsClient ? 'FREE' : 
                           (activeFreeTicketCoupon && isSelected) ? 'FREE' : formatPrice(ticket.priceInCents)}
                          {!formData.isEmsClient && !(activeFreeTicketCoupon && isSelected) && (
                            <span className="text-xs font-normal text-gray-500 ml-1">per ticket</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ticket.availableStock} available
                        </span>
                        
                        {ticket.category && (
                          <Badge variant="outline" className="text-xs">
                            {ticket.category}
                          </Badge>
                        )}
                      </div>
                      
                      {ticket.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
                          {ticket.description}
                        </p>
                      )}

                      {!formData.isEmsClient && !activeFreeTicketCoupon && ticket.hasTieredPricing && ticket.pricingTiers && ticket.pricingTiers.length > 0 && (
                        <div className="text-xs bg-green-50 border border-green-200 rounded px-2 py-1 mb-2">
                          <div className="flex items-center gap-1 text-green-700 mb-1">
                            <TrendingDown className="h-3 w-3" />
                            <span className="font-medium">Volume Discounts Available:</span>
                          </div>
                          <div className="space-y-0.5">
                            {ticket.pricingTiers.map((tier, index) => {
                              const regularPrice = ticket.priceInCents * tier.ticketCount
                              const savings = regularPrice - tier.priceInCents
                              return (
                                <div key={index} className="text-green-600">
                                  • {tier.ticketCount} tickets for €{(tier.priceInCents / 100).toFixed(2)}
                                  {savings > 0 && (
                                    <span className="text-green-700 font-medium"> (Save €{(savings / 100).toFixed(2)})</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {activeFreeTicketCoupon && !isSelected && (
                        <div className="text-xs bg-purple-50 border border-purple-200 rounded px-2 py-1 mb-2">
                          <div className="flex items-center gap-1 text-purple-700">
                            <Gift className="h-3 w-3" />
                            <span className="font-medium">This ticket will be FREE with your coupon! 🎉</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decreaseQuantity(ticket)}
                        disabled={selectedQty === 0}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center text-sm font-medium">
                        {selectedQty}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => increaseQuantity(ticket)}
                        disabled={!canAddMore}
                        className="h-8 w-8 p-0"
                        title={
                          activeFreeTicketCoupon && !canAddMore ? "Free coupon allows only 1 per ticket type" : 
                          formData.isEmsClient && !canAddMore ? "EMS customers limited to 1 per ticket type" :
                          selectedQty >= ticket.availableStock ? "No more tickets available" :
                          selectedQty >= ticket.maxPerOrder ? `Maximum ${ticket.maxPerOrder} per order` : ""
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Subtotal with Savings */}
                  {isSelected && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                      <div className="flex gap-1">
                        {ticket.parsedTags && ticket.parsedTags.length > 0 && 
                          ticket.parsedTags.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        }
                      </div>
                      
                      <div className="text-right">
                        {!formData.isEmsClient ? (
                          <div className="text-xs">
                            {activeFreeTicketCoupon ? (
                              <div className="text-purple-600 font-medium">
                                🎉 FREE with coupon!
                                <div className="text-gray-400 line-through text-xs">
                                  Was: {formatPrice(pricing.priceInCents)}
                                </div>
                              </div>
                            ) : (
                              <>
                                {pricing.savings > 0 && (
                                  <div className="text-green-600 font-medium mb-1">
                                    💰 You saved €{(pricing.savings / 100).toFixed(2)}!
                                    {pricing.appliedTier && (
                                      <div className="text-green-700">
                                        ({pricing.appliedTier.name} discount applied)
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-600">Total: </span>
                                  <span className="font-medium text-blue-600">
                                    {formatPrice(pricing.priceInCents)}
                                  </span>
                                  {pricing.savings > 0 && (
                                    <span className="text-gray-400 line-through ml-1 text-xs">
                                      {formatPrice(ticket.priceInCents * selectedQty)}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs font-medium text-green-600">
                            Complimentary
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Coupon Code Section - Only for Public Customers */}
      {!formData.isEmsClient && formData.selectedTickets.length > 0 && (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
          <Label className="text-sm font-medium mb-2 flex items-center gap-1">
            <Tag className="h-4 w-4" />
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
                className="h-9 text-sm pr-8"
                disabled={validatingCoupon}
              />
              {validatingCoupon && (
                <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
              )}
              {couponValidation?.isValid && (
                <Check className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />
              )}
              {couponValidation && !couponValidation.isValid && (
                <X className="absolute right-2 top-2.5 h-4 w-4 text-red-500" />
              )}
            </div>
            
            {couponValidation?.isValid && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeCoupon}
                className="h-9 px-3"
              >
                <X className="h-4 w-4" />
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
          {!formData.email && couponCode && !isFreeTicketCoupon(couponCode) && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Enter your email in the next step for accurate coupon validation
            </div>
          )}
        </div>
      )}

      {/* Selection Summary */}
      {formData.selectedTickets.length > 0 && (
        <div className={`p-4 border-2 rounded-lg ${
          isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid
            ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50' 
            : 'border-blue-200 bg-blue-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-1">
              Order Summary
              {isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid && (
                <Gift className="h-4 w-4 text-purple-600" />
              )}
            </h4>
            <span className="text-xs text-gray-600">{getTotalTickets()} tickets</span>
          </div>
          
          <div className="space-y-1">
            {formData.selectedTickets.map(ticket => (
              <div key={ticket.ticketTypeId} className="flex justify-between text-xs">
                <span className="truncate">{ticket.name} × {ticket.quantity}</span>
                <span className="font-medium ml-2">
                  {formData.isEmsClient ? 'FREE' : 
                   (isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid) ? 'FREE' :
                   formatPrice(ticket.priceInCents)}
                </span>
              </div>
            ))}
            
            {!formData.isEmsClient && (
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>{formatPrice(getTotalCost())}</span>
                </div>
                
                {getAppliedDiscount() > 0 && (
                  <div className={`flex justify-between text-xs ${
                    isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid ? 'text-purple-600' : 'text-green-600'
                  }`}>
                    <span>
                      Discount ({formData.couponCode}):
                      {isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid && ' 🎉'}
                    </span>
                    <span>-{formatPrice(getAppliedDiscount())}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-sm border-t pt-1">
                  <span>Total:</span>
                  <span className={`${
                    isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid && getFinalCost() === 0 
                      ? 'text-purple-600' 
                      : 'text-blue-600'
                  }`}>
                    {getFinalCost() === 0 && isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid
                      ? 'FREE! 🎉' 
                      : formatPrice(getFinalCost())
                    }
                  </span>
                </div>

                {/* ✅ FREE TICKET SUCCESS MESSAGE - Only after coupon applied */}
                {isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid && getFinalCost() === 0 && (
                  <div className="bg-purple-100 border border-purple-300 rounded-lg p-2 mt-2">
                    <div className="text-xs text-purple-800 text-center">
                      🎉 <strong>Congratulations!</strong> All your tickets are completely FREE!<br/>
                      <span className="text-purple-600">No payment required - proceed to complete registration</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {formData.isEmsClient && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-sm">
                  <span>Total:</span>
                  <span className="text-green-600">FREE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ FREE TICKET USAGE RESTRICTIONS - Only show after coupon applied */}
      {!formData.isEmsClient && isFreeTicketCoupon(formData.couponCode || '') && couponValidation?.isValid && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-xs text-purple-800">
            <div className="flex items-center gap-1 font-medium mb-1">
              <AlertTriangle className="h-3 w-3" />
              Free Ticket Coupon Terms:
            </div>
            <ul className="text-purple-700 space-y-1 ml-4">
              <li>• Limited to 1 ticket per ticket type</li>
              <li>• All available ticket types included</li>
              <li>• Cannot be combined with other offers</li>
              <li>• Valid for this event only</li>
              <li>• Non-transferable</li>
            </ul>
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {formData.selectedTickets.length === 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Please select at least one ticket to continue</span>
          </div>
        </div>
      )}

      {/* ✅ NEW: Public Customer Quantity Info */}
      {!formData.isEmsClient && formData.selectedTickets.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-800">
            <div className="flex items-center gap-1 font-medium mb-1">
              <Ticket className="h-3 w-3" />
              Quantity Guidelines:
            </div>
            <ul className="text-blue-700 space-y-1 ml-4">
              <li>• Maximum 50 tickets per ticket type per order</li>
              <li>• No limit on total number of orders</li>
              <li>• Volume discounts available for bulk purchases</li>
              <li>• All tickets subject to availability</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}