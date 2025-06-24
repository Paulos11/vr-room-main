// FIXED: src/components/forms/EnhancedRegistrationForm.tsx - Tiered pricing support
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, ArrowRight, AlertTriangle, Crown } from 'lucide-react'

import { CustomerSelectionDialog } from './CustomerSelectionDialog'
import { TicketSelectionStep } from './steps/TicketSelectionStep'
import { PersonalInfoStep } from './steps/PersonalInfoStep'
import { EmsCustomerStep } from './steps/EmsCustomerStep'
import { PanelInterestStep } from './steps/PanelInterestStep'
import { TermsStep } from './steps/TermsStep'
import { RegistrationFormData } from '@/types/registration'
import { validateStep, validateAllFields } from '@/utils/formValidation'

export function EnhancedRegistrationForm() {
  const router = useRouter()
  const [showCustomerDialog, setShowCustomerDialog] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idCardNumber: '',
    isEmsClient: false,
    selectedTickets: [],
    panelInterest: false,
    acceptTerms: false,
    acceptPrivacyPolicy: false,
    couponCode: '',
    appliedDiscount: 0,
    // EMS client fields
    customerName: '',
    orderNumber: '',
    applicationNumber: '',
    orderDate: ''
  })

  // Calculate total steps based on customer type
  const totalSteps = formData.isEmsClient ? 5 : 4 // EMS: 5 steps, Public: 4 steps

  // Calculate totals with tiered pricing support
  const totalTickets = useMemo(() => {
    return formData.selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
  }, [formData.selectedTickets])

  const totalCost = useMemo(() => {
    if (formData.isEmsClient) return 'Free'
    
    // ✅ FIXED: Use the priceInCents from selectedTickets (which already includes tier calculations)
    const subtotal = formData.selectedTickets.reduce((sum, ticket) => 
      sum + ticket.priceInCents, 0  // ✅ This already includes tiered discounts from TicketSelectionStep
    )
    
    const discount = formData.appliedDiscount || 0
    const finalAmount = Math.max(0, subtotal - discount)
    
    if (discount > 0) {
      return `€${(finalAmount / 100).toFixed(2)} (${formData.couponCode} applied)`
    }
    
    return `€${(finalAmount / 100).toFixed(2)}`
  }, [formData.selectedTickets, formData.isEmsClient, formData.appliedDiscount, formData.couponCode])

  // ✅ NEW: Calculate savings from tiered pricing
  const tierSavings = useMemo(() => {
    if (formData.isEmsClient) return 0
    
    // Calculate how much was saved through tiered pricing
    let totalRegularPrice = 0
    let totalTierPrice = 0
    
    formData.selectedTickets.forEach(ticket => {
      if (ticket.packageInfo) {
        // This is a tiered/package ticket
        const regularPrice = ticket.packageInfo.pricePerTicket * ticket.packageInfo.ticketCount * ticket.quantity
        totalRegularPrice += regularPrice
        totalTierPrice += ticket.priceInCents
      } else {
        // Regular ticket - no savings
        totalRegularPrice += ticket.priceInCents
        totalTierPrice += ticket.priceInCents
      }
    })
    
    return Math.max(0, totalRegularPrice - totalTierPrice)
  }, [formData.selectedTickets, formData.isEmsClient])

  const handleCustomerTypeSelected = useCallback((isEmsClient: boolean) => {
    // Reset all form data when customer type changes
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idCardNumber: '',
      isEmsClient,
      selectedTickets: [],
      panelInterest: false,
      acceptTerms: false,
      acceptPrivacyPolicy: false,
      couponCode: '',
      appliedDiscount: 0,
      // EMS client fields
      customerName: '',
      orderNumber: '',
      applicationNumber: '',
      orderDate: ''
    })
    
    // Reset to step 1
    setCurrentStep(1)
    setShowCustomerDialog(false)
  }, [])

  const handleInputChange = useCallback((field: keyof RegistrationFormData | string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleNext = useCallback(() => {
    const isStepValid = validateStep(currentStep, formData)
    
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      toast({
        title: "Please complete required fields",
        description: "Check the highlighted fields and fix any errors.",
        variant: "destructive",
      })
    }
  }, [currentStep, formData, totalSteps])

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  const handleSubmit = useCallback(async () => {
    const validation = validateAllFields(formData)
    
    if (!validation.isValid) {
      toast({
        title: "Please fix errors:",
        description: validation.errors.join(', '),
        variant: "destructive",
      })
      return
    }

    if (formData.selectedTickets.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // ✅ FIXED: Prepare data with proper ticket pricing (already calculated with tiers)
      const cleanedData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        idCardNumber: formData.idCardNumber.trim(),
        couponCode: formData.couponCode || undefined,
        appliedDiscount: formData.appliedDiscount || 0,
        // Clean up EMS fields
        customerName: formData.customerName || undefined,
        orderNumber: formData.orderNumber || undefined,
        applicationNumber: formData.applicationNumber || undefined,
        orderDate: formData.orderDate || undefined,
        // ✅ FIXED: Send tickets with correct pricing and quantity
        selectedTickets: formData.selectedTickets.map(ticket => ({
          ticketTypeId: ticket.originalTicketId || ticket.ticketTypeId, // Use original ID if package
          name: ticket.name,
          priceInCents: ticket.priceInCents, // Total price for this selection (includes tier discounts)
          quantity: ticket.packageInfo ? ticket.packageInfo.ticketCount * ticket.quantity : ticket.quantity, // Total number of individual tickets
          maxPerOrder: ticket.maxPerOrder,
          minPerOrder: ticket.minPerOrder
        }))
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Registration successful!",
          description: formData.isEmsClient 
            ? "Pending approval." 
            : "Redirecting to payment...",
        })

        if (formData.isEmsClient) {
          router.push(`/registration/pending?id=${result.data.id}`)
        } else {
          router.push(`/payment?id=${result.data.id}`)
        }
      } else {
        toast({
          title: "Registration Failed",
          description: result.message || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Please check connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, router])

  const renderStepContent = useCallback(() => {
    console.log('Rendering step:', currentStep, 'isEmsClient:', formData.isEmsClient)
    
    switch (currentStep) {
      case 1:
        return <TicketSelectionStep formData={formData} onUpdate={handleInputChange} />
      case 2:
        return <PersonalInfoStep formData={formData} onUpdate={handleInputChange} />
      case 3:
        if (formData.isEmsClient) {
          return <EmsCustomerStep formData={formData} onUpdate={handleInputChange} />
        } else {
          return <PanelInterestStep formData={formData} onUpdate={handleInputChange} />
        }
      case 4:
        if (formData.isEmsClient) {
          return <PanelInterestStep formData={formData} onUpdate={handleInputChange} />
        } else {
          return <TermsStep formData={formData} onUpdate={handleInputChange} />
        }
      case 5:
        if (formData.isEmsClient) {
          return <TermsStep formData={formData} onUpdate={handleInputChange} />
        } else {
          console.error('Public customer should not reach step 5')
          return <div className="p-4 text-center text-red-600">Error: Invalid step for public customer</div>
        }
      default:
        return <div>Error: Invalid step {currentStep}</div>
    }
  }, [currentStep, formData, handleInputChange])

  const isCurrentStepValid = useMemo(() => {
    return validateStep(currentStep, formData)
  }, [currentStep, formData])

  if (showCustomerDialog) {
    return <CustomerSelectionDialog open={showCustomerDialog} onCustomerTypeSelected={handleCustomerTypeSelected} />
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg pt-8">
          <div className="text-center">
            {formData.isEmsClient && (
              <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            )}
            <CardTitle className="text-xl text-gray-800">
              {formData.isEmsClient ? 'EMS Customer Registration' : 'Event Registration'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {totalTickets > 0 ? (
                <div>
                  <span>{totalTickets} ticket{totalTickets > 1 ? 's' : ''} - {totalCost}</span>
                  
                  {/* ✅ NEW: Show tier savings */}
                  {tierSavings > 0 && !formData.isEmsClient && (
                    <div className="text-green-600 text-xs mt-1">
                      💰 Tier savings: €{(tierSavings / 100).toFixed(2)}
                    </div>
                  )}
                  
                  {/* Show coupon savings */}
                  {(formData.appliedDiscount || 0) > 0 && !formData.isEmsClient && (
                    <div className="text-green-600 text-xs mt-1">
                      🎫 Coupon savings: €{((formData.appliedDiscount || 0) / 100).toFixed(2)}
                    </div>
                  )}
                  
                  {/* Show total savings */}
                  {(tierSavings > 0 || (formData.appliedDiscount || 0) > 0) && !formData.isEmsClient && (
                    <div className="text-green-700 text-xs font-medium mt-1">
                      Total saved: €{((tierSavings + (formData.appliedDiscount || 0)) / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              ) : (
                formData.isEmsClient ? 'Select your complimentary tickets' : 'Select your tickets'
              )}
            </CardDescription>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span className="font-medium">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          {/* Step Content */}
          <div className="min-h-[400px] transition-all duration-300">
            {renderStepContent()}
          </div>
          
          {/* Step Validation Warning */}
          {!isCurrentStepValid && currentStep > 1 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mt-4">
              <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-800">
                Please complete all required fields above
              </p>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex justify-between mt-6 gap-3">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex-1 h-10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNext}
                className="flex-1 h-10 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                disabled={!isCurrentStepValid}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !isCurrentStepValid}
                className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Processing...' : 
                 formData.isEmsClient ? 'Submit Registration' : `Pay ${totalCost}`}
              </Button>
            )}
          </div>
          
          {/* Customer Type Change */}
          <div className="text-center mt-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setCurrentStep(1)
                setShowCustomerDialog(true)
              }}
              className="text-gray-500 text-sm h-8"
            >
              Change customer type
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}