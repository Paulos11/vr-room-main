// src/components/forms/steps/VRTicketSelectionStep.tsx - Optimized for mobile & performance
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Gamepad2, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Tag, 
  Check, 
  X, 
  Loader2,
  Star,
  TrendingDown,
  Clock,
  Users
} from 'lucide-react'
import { VRStepProps, VRTicketType, VRSelectedTicket, VRRegistrationFormData, CouponValidationResult } from '@/types/vr-registration'
import { toast } from '@/components/ui/use-toast'

export function VRTicketSelectionStep({ formData, onUpdate }: VRStepProps) {
  const [availableExperiences, setAvailableExperiences] = useState<VRTicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState(formData.couponCode || '')
  const [couponValidation, setCouponValidation] = useState<CouponValidationResult | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponTouched, setCouponTouched] = useState(false)

  // Memoized calculations for performance - FIX NaN issues
  const totalSessions = useMemo(() => {
    return formData.selectedTickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0)
  }, [formData.selectedTickets])

  const totalCost = useMemo(() => {
    return formData.selectedTickets.reduce((sum, ticket) => sum + (ticket.priceInCents || 0), 0)
  }, [formData.selectedTickets])

  const appliedDiscount = useMemo(() => {
    return formData.appliedDiscount || 0
  }, [formData.appliedDiscount])

  const finalCost = useMemo(() => {
    return Math.max(0, totalCost - appliedDiscount)
  }, [totalCost, appliedDiscount])

  const formatPrice = useCallback((cents: number): string => {
    if (isNaN(cents) || cents === null || cents === undefined) {
      return '€0.00'
    }
    return `€${(cents / 100).toFixed(2)}`
  }, [])

  const fetchAvailableExperiences = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ticket-types/public?flow=vr')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setAvailableExperiences(result.data.ticketTypes || [])
      } else {
        throw new Error(result.message || 'Failed to load VR experiences')
      }
    } catch (error) {
      console.error('Error fetching VR experiences:', error)
      toast({
        title: "Error",
        description: "Failed to load VR experiences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchAvailableExperiences()
  }, [fetchAvailableExperiences])

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

  const validateCoupon = useCallback(async (code: string) => {
    if (!code.trim()) return

    setValidatingCoupon(true)
    try {
      const validationData = {
        code: code.toUpperCase(),
        orderAmount: totalCost,
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
          description: `You saved ${formatPrice(discount)}`,
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
  }, [totalCost, formData.email, onUpdate, formatPrice])

  // Optimized pricing calculation - FIX NaN issues
  const calculateBestPricing = useCallback((experience: VRTicketType, quantity: number) => {
    // Ensure valid inputs
    if (!experience || !experience.priceInCents || quantity <= 0) {
      return {
        totalPrice: 0,
        pricePerTicket: 0,
        savings: 0,
        savingsPercent: 0,
        tierName: null,
        isOptimalTier: false
      }
    }

    const basePrice = experience.priceInCents || 0

    if (!experience.hasTieredPricing || !experience.pricingTiers || experience.pricingTiers.length === 0) {
      return {
        totalPrice: basePrice * quantity,
        pricePerTicket: basePrice,
        savings: 0,
        savingsPercent: 0,
        tierName: null,
        isOptimalTier: false
      }
    }

    const applicableTiers = experience.pricingTiers.filter(tier => 
      tier.ticketCount && tier.ticketCount <= quantity
    )
    
    if (applicableTiers.length === 0) {
      return {
        totalPrice: basePrice * quantity,
        pricePerTicket: basePrice,
        savings: 0,
        savingsPercent: 0,
        tierName: null,
        isOptimalTier: false
      }
    }

    const bestTier = applicableTiers.reduce((best, current) => 
      (current.ticketCount || 0) > (best.ticketCount || 0) ? current : best
    )

    if (!bestTier.ticketCount || !bestTier.priceInCents) {
      return {
        totalPrice: basePrice * quantity,
        pricePerTicket: basePrice,
        savings: 0,
        savingsPercent: 0,
        tierName: bestTier.name || null,
        isOptimalTier: false
      }
    }

    const completeTierPackages = Math.floor(quantity / bestTier.ticketCount)
    const remainingTickets = quantity % bestTier.ticketCount

    const tierPackagePrice = completeTierPackages * bestTier.priceInCents
    const remainingPrice = remainingTickets * basePrice
    const totalPrice = tierPackagePrice + remainingPrice

    const basePriceTotal = basePrice * quantity
    const savings = Math.max(0, basePriceTotal - totalPrice)
    const savingsPercent = basePriceTotal > 0 ? (savings / basePriceTotal) * 100 : 0

    return {
      totalPrice,
      pricePerTicket: Math.round(totalPrice / quantity),
      savings,
      savingsPercent,
      tierName: bestTier.name || null,
      isOptimalTier: quantity === bestTier.ticketCount
    }
  }, [])

  const getSelectedQuantity = useCallback((experienceId: string): number => {
    const selected = formData.selectedTickets.find(t => t.ticketTypeId === experienceId)
    return selected ? selected.quantity : 0
  }, [formData.selectedTickets])

  const updateExperienceQuantity = useCallback((experience: VRTicketType, newQuantity: number) => {
    const currentSelected = [...formData.selectedTickets]
    const existingIndex = currentSelected.findIndex(t => t.ticketTypeId === experience.id)
    
    if (newQuantity === 0) {
      if (existingIndex !== -1) {
        currentSelected.splice(existingIndex, 1)
      }
    } else {
      const pricing = calculateBestPricing(experience, newQuantity)
      
      // Ensure we have valid pricing
      const totalPrice = pricing.totalPrice || (experience.priceInCents || 0) * newQuantity
      
      const selectedExperience: VRSelectedTicket = {
        ticketTypeId: experience.id,
        name: experience.name,
        priceInCents: totalPrice,
        quantity: newQuantity,
        maxPerOrder: experience.maxPerOrder || 10,
        minPerOrder: experience.minPerOrder || 1
      }
      
      if (existingIndex !== -1) {
        currentSelected[existingIndex] = selectedExperience
      } else {
        currentSelected.push(selectedExperience)
      }
    }
    
    onUpdate('selectedTickets', currentSelected)
    
    // Re-validate coupon if applied
    if (couponValidation?.isValid && couponCode) {
      setTimeout(() => validateCoupon(couponCode), 100)
    }
  }, [formData.selectedTickets, calculateBestPricing, onUpdate, couponValidation, couponCode, validateCoupon])

  const increaseQuantity = useCallback((experience: VRTicketType) => {
    const currentQty = getSelectedQuantity(experience.id)
    const maxQty = Math.min(experience.maxPerOrder, experience.availableStock)
    
    if (currentQty < maxQty) {
      updateExperienceQuantity(experience, currentQty + 1)
    } else {
      toast({
        title: "Quantity limit reached",
        description: currentQty >= experience.availableStock ? "No more sessions available" : `Maximum ${experience.maxPerOrder} sessions per booking`,
        variant: "destructive",
      })
    }
  }, [getSelectedQuantity, updateExperienceQuantity])

  const decreaseQuantity = useCallback((experience: VRTicketType) => {
    const currentQty = getSelectedQuantity(experience.id)
    if (currentQty > 0) {
      updateExperienceQuantity(experience, currentQty - 1)
    }
  }, [getSelectedQuantity, updateExperienceQuantity])

  const handleCouponChange = useCallback((value: string) => {
    setCouponCode(value.toUpperCase())
    setCouponTouched(true)
    
    if (couponValidation) {
      setCouponValidation(null)
      onUpdate('appliedDiscount', 0)
    }
  }, [couponValidation, onUpdate])

  const removeCoupon = useCallback(() => {
    setCouponCode('')
    setCouponValidation(null)
    setCouponTouched(false)
    onUpdate('couponCode', '')
    onUpdate('appliedDiscount', 0)
  }, [onUpdate])

  const getPricingDisplay = useCallback((experience: VRTicketType, quantity: number) => {
    if (quantity === 0) {
      return {
        displayPrice: formatPrice(experience.priceInCents),
        suffix: 'per session',
        showTierHint: experience.hasTieredPricing && experience.tieredPricingNote
      }
    }

    const pricing = calculateBestPricing(experience, quantity)
    
    if (pricing.savings > 0) {
      return {
        displayPrice: formatPrice(pricing.totalPrice),
        suffix: `(${formatPrice(pricing.pricePerTicket)} each)`,
        savings: formatPrice(pricing.savings),
        savingsPercent: pricing.savingsPercent.toFixed(1),
        showTierHint: false
      }
    }

    return {
      displayPrice: formatPrice(pricing.totalPrice),
      suffix: quantity > 1 ? `(${formatPrice(pricing.pricePerTicket)} each)` : '',
      showTierHint: false
    }
  }, [formatPrice, calculateBestPricing])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-[#01AEED] animate-spin" />
          <span className="text-gray-600">Loading VR experiences...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-semibold flex items-center justify-center gap-2 text-[#262624]">
          <Gamepad2 className="h-5 w-5 text-[#01AEED]" />
          Choose Your VR Adventure
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Select your virtual reality experiences
        </p>
      </div>

      {/* Available VR Experiences */}
      <div className="space-y-3">
        {availableExperiences.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No VR experiences available at this time</p>
          </div>
        ) : (
          availableExperiences.map(experience => {
            const selectedQty = getSelectedQuantity(experience.id)
            const maxQty = Math.min(experience.maxPerOrder, experience.availableStock)
            const isSelected = selectedQty > 0
            const canAddMore = selectedQty < maxQty
            const pricingDisplay = getPricingDisplay(experience, selectedQty)
            
            return (
              <div 
                key={experience.id} 
                className={`border rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-[#01AEED] bg-gradient-to-r from-[#01AEED]/5 to-blue-50 border-[#01AEED]' : 'hover:border-[#01AEED]/50 border-gray-200'
                }`}
              >
                <div className="p-3 sm:p-4">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-3">
                    {/* Experience Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-[#262624] truncate">{experience.name}</h4>
                          {experience.featured && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-yellow-700 border-yellow-300 bg-yellow-50">
                              <Star className="h-2.5 w-2.5 mr-0.5" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm font-bold text-[#01AEED] mb-1">
                          {pricingDisplay.displayPrice}
                          {pricingDisplay.suffix && (
                            <span className="text-xs font-normal text-gray-500 ml-1">{pricingDisplay.suffix}</span>
                          )}
                        </div>
                        
                        {pricingDisplay.savings && (
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">
                              Save {pricingDisplay.savings} ({pricingDisplay.savingsPercent}% off)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isSelected && (
                        <Badge className="bg-[#01AEED] text-white text-xs px-2 py-0.5 ml-2">
                          {selectedQty}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Experience Details */}
                    {experience.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {experience.description}
                      </p>
                    )}

                    {/* Tiered Pricing Hint */}
                    {!isSelected && experience.hasTieredPricing && experience.tieredPricingNote && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <TrendingDown className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <p className="text-yellow-800 font-medium">{experience.tieredPricingNote.message}</p>
                            <p className="text-yellow-700 mt-0.5">{experience.tieredPricingNote.bestOffer}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tags & Category */}
                    {(experience.category || experience.difficulty) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {experience.category && (
                          <Badge variant="outline" className="text-xs">
                            {experience.category}
                          </Badge>
                        )}
                        {experience.difficulty && (
                          <Badge variant={experience.difficulty === 'Easy' ? 'secondary' : experience.difficulty === 'Hard' ? 'destructive' : 'default'} className="text-xs">
                            {experience.difficulty}
                          </Badge>
                        )}
                        {experience.duration && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{experience.duration}min</span>
                          </div>
                        )}
                        {experience.maxPlayers && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>Up to {experience.maxPlayers}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => decreaseQuantity(experience)}
                          disabled={selectedQty === 0}
                          className="h-8 w-8 p-0 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-6 text-center text-sm font-semibold text-[#262624]">
                          {selectedQty}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => increaseQuantity(experience)}
                          disabled={!canAddMore}
                          className="h-8 w-8 p-0 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {isSelected && (
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#01AEED]">
                            {pricingDisplay.displayPrice}
                          </div>
                          {pricingDisplay.savings && (
                            <div className="text-xs text-green-600">
                              Saved {pricingDisplay.savings}!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-start justify-between mb-3">
                      {/* Experience Info */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-base font-semibold text-[#262624] truncate">{experience.name}</h4>
                          {isSelected && (
                            <Badge className="bg-[#01AEED] text-white text-xs px-2 py-0.5">
                              {selectedQty} session{selectedQty > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {experience.featured && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 text-yellow-700 border-yellow-300 bg-yellow-50">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-[#01AEED]">
                              {pricingDisplay.displayPrice}
                              {pricingDisplay.suffix && (
                                <span className="text-sm font-normal text-gray-500 ml-1">{pricingDisplay.suffix}</span>
                              )}
                            </span>
                            
                            {pricingDisplay.savings && (
                              <div className="flex items-center gap-1 mt-1">
                                <TrendingDown className="h-3 w-3 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">
                                  Save {pricingDisplay.savings} ({pricingDisplay.savingsPercent}% off)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {experience.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
                            {experience.description}
                          </p>
                        )}

                        {!isSelected && experience.hasTieredPricing && experience.tieredPricingNote && (
                          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <TrendingDown className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs">
                                <p className="text-yellow-800 font-medium">{experience.tieredPricingNote.message}</p>
                                <p className="text-yellow-700 mt-1">{experience.tieredPricingNote.bestOffer}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {experience.category && (
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {experience.category}
                            </Badge>
                            {experience.difficulty && (
                              <Badge variant={experience.difficulty === 'Easy' ? 'secondary' : experience.difficulty === 'Hard' ? 'destructive' : 'default'} className="text-xs">
                                {experience.difficulty}
                              </Badge>
                            )}
                            {experience.duration && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{experience.duration}min</span>
                              </div>
                            )}
                            {experience.maxPlayers && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Users className="h-3 w-3" />
                                <span>Up to {experience.maxPlayers}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => decreaseQuantity(experience)}
                          disabled={selectedQty === 0}
                          className="h-9 w-9 p-0 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-8 text-center text-lg font-semibold text-[#262624]">
                          {selectedQty}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => increaseQuantity(experience)}
                          disabled={!canAddMore}
                          className="h-9 w-9 p-0 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white"
                          title={
                            selectedQty >= experience.availableStock ? "No more sessions available" :
                            selectedQty >= experience.maxPerOrder ? `Maximum ${experience.maxPerOrder} per booking` : ""
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Session Total */}
                    {isSelected && (
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <div className="flex gap-2">
                          {experience.tags && experience.tags.length > 0 && 
                            experience.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          }
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="text-gray-600">Total: </span>
                            <span className="font-semibold text-[#01AEED] text-lg">
                              {pricingDisplay.displayPrice}
                            </span>
                          </div>
                          {pricingDisplay.savings && (
                            <div className="text-xs text-green-600">
                              Saved {pricingDisplay.savings}!
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Coupon Code Section */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50">
          <Label className="text-sm font-medium mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#01AEED]" />
            Promo Code (Optional)
          </Label>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={couponCode}
                onChange={(e) => handleCouponChange(e.target.value)}
                onBlur={() => {
                  if (couponCode.trim() && couponCode.length >= 3) {
                    validateCoupon(couponCode)
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && couponCode.trim() && couponCode.length >= 3) {
                    e.preventDefault()
                    validateCoupon(couponCode)
                  }
                }}
                placeholder="Enter promo code"
                className="h-10 text-sm pr-10 border-[#01AEED]/30 focus:border-[#01AEED]"
                disabled={validatingCoupon}
              />
              {validatingCoupon && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
              )}
              {couponValidation?.isValid && (
                <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
              {couponValidation && !couponValidation.isValid && (
                <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
              )}
            </div>
            
            {couponValidation?.isValid && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeCoupon}
                className="h-10 px-3 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Coupon Status Messages */}
          {couponValidation && (
            <div className={`mt-2 text-sm flex items-center gap-2 ${
              couponValidation.isValid ? 'text-green-700' : 'text-red-700'
            }`}>
              {couponValidation.isValid ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>
                    {couponValidation.coupon?.name} applied! 
                    {appliedDiscount > 0 && ` Save ${formatPrice(appliedDiscount)}`}
                  </span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  <span>{couponValidation.message}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Booking Summary */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-3 sm:p-4 border-2 border-[#01AEED]/20 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#01AEED]/5 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-[#262624]">
              <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#01AEED]" />
              Booking Summary
            </h4>
            <span className="text-sm text-gray-600">{totalSessions} session{totalSessions > 1 ? 's' : ''}</span>
          </div>
          
          <div className="space-y-2">
            {formData.selectedTickets.map(ticket => {
              const experience = availableExperiences.find(exp => exp.id === ticket.ticketTypeId)
              const pricing = experience ? calculateBestPricing(experience, ticket.quantity) : null
              
              return (
                <div key={ticket.ticketTypeId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{ticket.name} × {ticket.quantity}</span>
                    <span className="font-medium text-[#262624]">{formatPrice(ticket.priceInCents)}</span>
                  </div>
                  {pricing && pricing.savings > 0 && (
                    <div className="flex justify-between text-xs text-green-600 ml-4">
                      <span>Volume discount applied</span>
                      <span>-{formatPrice(pricing.savings)}</span>
                    </div>
                  )}
                </div>
              )
            })}
            
            <div className="border-t pt-2 mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-[#262624]">{formatPrice(totalCost)}</span>
              </div>
              
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({formData.couponCode}):</span>
                  <span>-{formatPrice(appliedDiscount)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                <span className="text-[#262624]">Total:</span>
                <span className="text-[#01AEED]">{formatPrice(finalCost)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {formData.selectedTickets.length === 0 && (
        <div className="p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg sm:rounded-xl">
          <div className="flex items-center gap-2 text-sm text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Please select at least one VR experience to continue</span>
          </div>
        </div>
      )}

      {/* Experience Info */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-3 sm:p-4 bg-[#01AEED]/5 border border-[#01AEED]/20 rounded-lg sm:rounded-xl">
          <div className="text-sm text-[#262624]">
            <div className="flex items-center gap-2 font-medium mb-2">
              <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
              VR Experience Guidelines:
            </div>
            <ul className="text-gray-700 space-y-1 ml-6 text-xs sm:text-sm">
              <li>• Session duration varies by experience</li>
              <li>• Comfortable clothing and closed shoes recommended</li>
              <li>• All equipment sanitized between sessions</li>
              <li>• Arrive 10 minutes before your session time</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}