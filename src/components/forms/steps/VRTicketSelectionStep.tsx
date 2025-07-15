'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Clock,
  Users,
  Star,
  Zap
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

  const fetchAvailableExperiences = async () => {
    try {
      setLoading(true)
      // ✅ UPDATED: Call the unified public API with the 'vr' flow parameter
      const response = await fetch('/api/ticket-types/public?flow=vr')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // ✅ UPDATED: The data is now in 'result.data.ticketTypes'
        console.log('Fetched VR experiences:', result.data.ticketTypes)
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
  }
  
  useEffect(() => {
    fetchAvailableExperiences()
  }, [])

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

  const validateCoupon = async (code: string) => {
    if (!code.trim()) return

    setValidatingCoupon(true)
    try {
      const totalAmount = getTotalCost()
      
      const validationData = {
        code: code.toUpperCase(),
        orderAmount: totalAmount,
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

  const removeCoupon = () => {
    setCouponCode('')
    setCouponValidation(null)
    setCouponTouched(false)
    onUpdate('couponCode', '')
    onUpdate('appliedDiscount', 0)
  }

  const getSelectedQuantity = (experienceId: string): number => {
    const selected = formData.selectedTickets.find(t => t.ticketTypeId === experienceId)
    return selected ? selected.quantity : 0
  }

  const updateExperienceQuantity = (experience: VRTicketType, newQuantity: number) => {
    const currentSelected = [...formData.selectedTickets]
    const existingIndex = currentSelected.findIndex(t => t.ticketTypeId === experience.id)
    
    if (newQuantity === 0) {
      if (existingIndex !== -1) {
        currentSelected.splice(existingIndex, 1)
      }
    } else {
      const selectedExperience: VRSelectedTicket = {
        ticketTypeId: experience.id,
        name: experience.name,
        priceInCents: experience.priceInCents * newQuantity,
        quantity: newQuantity,
        maxPerOrder: experience.maxPerOrder,
        minPerOrder: experience.minPerOrder
      }
      
      if (existingIndex !== -1) {
        currentSelected[existingIndex] = selectedExperience
      } else {
        currentSelected.push(selectedExperience)
      }
    }
    
    onUpdate('selectedTickets', currentSelected)
    
    if (couponValidation?.isValid && couponCode) {
      setTimeout(() => validateCoupon(couponCode), 100)
    }
  }

  const increaseQuantity = (experience: VRTicketType) => {
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
  }

  const decreaseQuantity = (experience: VRTicketType) => {
    const currentQty = getSelectedQuantity(experience.id)
    if (currentQty > 0) {
      updateExperienceQuantity(experience, currentQty - 1)
    }
  }

  const getTotalSessions = (): number => {
    return formData.selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
  }

  const getTotalCost = (): number => {
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
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2 text-[#262624]">
          <Gamepad2 className="h-5 w-5 text-[#01AEED]" />
          Choose Your VR Adventure
        </h3>
        <p className="text-sm text-gray-600">
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
            
            return (
              <div 
                key={experience.id} 
                className={`border rounded-xl transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-[#01AEED] bg-gradient-to-r from-[#01AEED]/5 to-blue-50 border-[#01AEED]' : 'hover:border-[#01AEED]/50 border-gray-200'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    {/* Experience Info */}
                    <div className="flex-1 min-w-0">
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
                        <span className="text-lg font-bold text-[#01AEED]">
                          {formatPrice(experience.priceInCents)}
                          <span className="text-sm font-normal text-gray-500 ml-1">per session</span>
                        </span>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{experience.duration || '30'}min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{experience.maxPlayers || 1} player{(experience.maxPlayers || 1) > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <span>{experience.availableStock} available</span>
                          </div>
                        </div>
                      </div>
                      
                      {experience.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
                          {experience.description}
                        </p>
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
                        </div>
                      )}
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 ml-4">
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
                            {formatPrice(experience.priceInCents * selectedQty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Coupon Code Section */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
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
                    {getAppliedDiscount() > 0 && ` Save ${formatPrice(getAppliedDiscount())}`}
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
        <div className="p-4 border-2 border-[#01AEED]/20 rounded-xl bg-gradient-to-r from-[#01AEED]/5 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-[#262624]">
              <Gamepad2 className="h-5 w-5 text-[#01AEED]" />
              Booking Summary
            </h4>
            <span className="text-sm text-gray-600">{getTotalSessions()} session{getTotalSessions() > 1 ? 's' : ''}</span>
          </div>
          
          <div className="space-y-2">
            {formData.selectedTickets.map(ticket => (
              <div key={ticket.ticketTypeId} className="flex justify-between text-sm">
                <span className="text-gray-700">{ticket.name} × {ticket.quantity}</span>
                <span className="font-medium text-[#262624]">{formatPrice(ticket.priceInCents)}</span>
              </div>
            ))}
            
            <div className="border-t pt-2 mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-[#262624]">{formatPrice(getTotalCost())}</span>
              </div>
              
              {getAppliedDiscount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({formData.couponCode}):</span>
                  <span>-{formatPrice(getAppliedDiscount())}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span className="text-[#262624]">Total:</span>
                <span className="text-[#01AEED]">{formatPrice(getFinalCost())}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {formData.selectedTickets.length === 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Please select at least one VR experience to continue</span>
          </div>
        </div>
      )}

      {/* Experience Info */}
      {formData.selectedTickets.length > 0 && (
        <div className="p-4 bg-[#01AEED]/5 border border-[#01AEED]/20 rounded-xl">
          <div className="text-sm text-[#262624]">
            <div className="flex items-center gap-2 font-medium mb-2">
              <Gamepad2 className="h-4 w-4 text-[#01AEED]" />
              VR Experience Guidelines:
            </div>
            <ul className="text-gray-700 space-y-1 ml-6">
              <li>• Minimum age: 8 years (children under 13 need adult supervision)</li>
              <li>• Maximum session duration: 30 minutes per experience</li>
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