// src/components/forms/VRRegistrationForm.tsx - Optimized responsive VR registration
'use client'

import { useState, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, ArrowRight, AlertTriangle, Gamepad2, Users, Calendar, MapPin, CreditCard, Shield, CheckCircle, Gift } from 'lucide-react'

// Lazy load step components for better performance
import { VRTicketSelectionStep } from './steps/VRTicketSelectionStep'
import { VRPersonalInfoStep } from './steps/VRPersonalInfoStep'
import { VRTermsStep } from './steps/VRTermsStep'
import { VRPaymentStep } from './steps/VRPaymentStep'
import { VRRegistrationFormData } from '@/types/vr-registration'
import { validateVRStep, validateAllVRFields } from '@/utils/vrFormValidation'

export function VRRegistrationForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [formData, setFormData] = useState<VRRegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    selectedTickets: [],
    acceptTerms: false,
    acceptPrivacyPolicy: false,
    couponCode: '',
    appliedDiscount: 0,
  })

  const totalSteps = 4

  // Memoized calculations for performance
  const totalTickets = useMemo(() => {
    return formData.selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
  }, [formData.selectedTickets])

  const totalCost = useMemo(() => {
    const subtotal = formData.selectedTickets.reduce((sum, ticket) => 
      sum + ticket.priceInCents, 0
    )
    const discount = formData.appliedDiscount || 0
    const finalAmount = Math.max(0, subtotal - discount)
    
    if (discount > 0) {
      return `€${(finalAmount / 100).toFixed(2)} (${formData.couponCode} applied)`
    }
    
    return `€${(finalAmount / 100).toFixed(2)}`
  }, [formData.selectedTickets, formData.appliedDiscount, formData.couponCode])

  const isFreeOrder = useMemo(() => {
    const subtotal = formData.selectedTickets.reduce((sum, ticket) => 
      sum + ticket.priceInCents, 0
    )
    const discount = formData.appliedDiscount || 0
    return subtotal - discount <= 0
  }, [formData.selectedTickets, formData.appliedDiscount])

  const handleInputChange = useCallback((field: keyof VRRegistrationFormData | string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleNext = useCallback(() => {
    const isStepValid = validateVRStep(currentStep, formData)
    
    if (isStepValid) {
      if (currentStep === 3) {
        handleCreateRegistration()
      } else {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps))
      }
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

  const handleCreateRegistration = useCallback(async () => {
    const validation = validateAllVRFields(formData)
    
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
        title: "No VR sessions selected",
        description: "Please select at least one VR experience",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const cleanedData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        couponCode: formData.couponCode || undefined,
        appliedDiscount: formData.appliedDiscount || 0,
        selectedTickets: formData.selectedTickets.map(ticket => ({
          ticketTypeId: ticket.ticketTypeId,
          name: ticket.name,
          priceInCents: ticket.priceInCents,
          quantity: ticket.quantity,
          maxPerOrder: ticket.maxPerOrder,
          minPerOrder: ticket.minPerOrder
        }))
      }

      const response = await fetch('/api/vr-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setRegistrationData(result.data)
        setCurrentStep(4)
        toast({
          title: "Registration created!",
          description: "Proceed to payment to complete your booking.",
        })
      } else {
        toast({
          title: "Registration Failed",
          description: result.message || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('VR registration error:', error)
      toast({
        title: "Network Error",
        description: "Please check connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  const handlePaymentComplete = useCallback(() => {
    const successUrl = `/payment/success?registration_id=${registrationData.id}&vr_booking=true`
    router.push(successUrl)
  }, [registrationData, router])

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <VRTicketSelectionStep formData={formData} onUpdate={handleInputChange} />
      case 2:
        return <VRPersonalInfoStep formData={formData} onUpdate={handleInputChange} />
      case 3:
        return <VRTermsStep formData={formData} onUpdate={handleInputChange} />
      case 4:
        return registrationData ? (
          <VRPaymentStep 
            registrationData={registrationData}
            onPaymentComplete={handlePaymentComplete}
            isFreeOrder={isFreeOrder}
          />
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#01AEED]" />
            <p className="text-gray-600">Creating your registration...</p>
          </div>
        )
      default:
        return <div>Error: Invalid step {currentStep}</div>
    }
  }, [currentStep, formData, handleInputChange, registrationData, handlePaymentComplete])

  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 4) return true
    return validateVRStep(currentStep, formData)
  }, [currentStep, formData])

  const stepTitles = [
    'Choose Experiences',
    'Your Information', 
    'Terms & Booking',
    'Payment'
  ]

  const getStepIcon = (stepIndex: number) => {
    switch (stepIndex) {
      case 1: return <Gamepad2 className="h-3 w-3 sm:h-4 sm:w-4" />
      case 2: return <Users className="h-3 w-3 sm:h-4 sm:w-4" />
      case 3: return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
      case 4: return isFreeOrder ? <Gift className="h-3 w-3 sm:h-4 sm:w-4" /> : <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
      default: return <div className="h-3 w-3 sm:h-4 sm:w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative">
      
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-30"
        style={{ backgroundImage: "url('/vr-background.jpg')" }}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen pt-16 sm:pt-20">
        
        {/* Header Section */}
        <div className="w-full bg-black/40 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
            
            {/* Mobile Header */}
            <div className="block sm:hidden">
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold text-white">Book VR Experience</h1>
                <p className="text-xs text-gray-300">
                  {currentStep === 4 ? 
                    (isFreeOrder ? 'Complete free booking' : 'Secure payment') : 
                    'Choose your VR adventure'
                  }
                </p>
              </div>
              
              {/* Mobile Progress */}
              <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{stepTitles[currentStep - 1]}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div 
                  className="bg-[#01AEED] h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
              
              {/* Mobile Summary */}
              {totalTickets > 0 && currentStep < 4 && (
                <div className="text-center mt-3 p-2 bg-white/10 rounded-lg">
                  <div className="text-[#01AEED] font-bold">{totalCost}</div>
                  <div className="text-xs text-gray-300">{totalTickets} session{totalTickets > 1 ? 's' : ''}</div>
                </div>
              )}
            </div>

            {/* Desktop Header */}
            <div className="hidden sm:flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">Book Your VR Experience</h1>
                <p className="text-sm text-gray-300">
                  {currentStep === 4 ? 
                    (isFreeOrder ? 'Complete your free VR booking' : 'Secure payment with Stripe') : 
                    'Choose your virtual reality adventure'
                  }
                </p>
              </div>
              
              {/* Desktop Progress */}
              <div className="hidden lg:flex items-center gap-4">
                {stepTitles.map((title, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index + 1 < currentStep ? 'bg-green-500 text-white' :
                      index + 1 === currentStep ? 'bg-[#01AEED] text-white' :
                      'bg-white/20 text-gray-300'
                    }`}>
                      {index + 1 < currentStep ? <CheckCircle className="h-4 w-4" /> : getStepIcon(index + 1)}
                    </div>
                    <span className={`text-xs lg:text-sm ${
                      index + 1 === currentStep ? 'text-white font-medium' : 'text-gray-300'
                    }`}>
                      {title}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Desktop Summary */}
              {totalTickets > 0 && currentStep < 4 && (
                <div className="text-right">
                  <div className="text-white font-bold text-lg lg:text-xl">{totalCost}</div>
                  <div className="text-sm text-gray-300">{totalTickets} session{totalTickets > 1 ? 's' : ''}</div>
                </div>
              )}

              {currentStep === 4 && registrationData && (
                <div className="text-right">
                  <div className={`font-bold text-lg lg:text-xl ${isFreeOrder ? 'text-green-400' : 'text-white'}`}>
                    {isFreeOrder ? 'FREE' : `€${(registrationData.finalAmount / 100).toFixed(2)}`}
                  </div>
                  <div className="text-sm text-gray-300">
                    {registrationData.sessionCount} session{registrationData.sessionCount > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          
          {/* Step Content Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden">
            
            {/* Content Body */}
            <div className="p-4 sm:p-6 lg:p-8">
              <Suspense fallback={
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#01AEED]" />
                  <p className="text-gray-600">Loading...</p>
                </div>
              }>
                {renderStepContent()}
              </Suspense>
            </div>
            
            {/* Step Validation Warning */}
            {!isCurrentStepValid && currentStep > 1 && currentStep < 4 && (
              <div className="mx-4 sm:mx-6 lg:mx-8 mb-6 flex items-center gap-2 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-orange-800">
                  Please complete all required fields above to continue
                </p>
              </div>
            )}
            
            {/* Navigation Footer */}
            {currentStep < 4 && (
              <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Previous
                  </Button>
                  
                  {/* Location Info - Hidden on mobile */}
                  <div className="hidden lg:flex items-center gap-6 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-[#01AEED]" />
                      <span> 50m from Bugibba Square</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-[#01AEED]" />
                      <span>All Ages</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleNext}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm bg-gradient-to-r from-[#01AEED] to-[#262624] hover:from-[#01AEED]/90 hover:to-[#262624]/90"
                    disabled={!isCurrentStepValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Creating...
                      </>
                    ) : currentStep === 3 ? (
                      <>
                        Create Booking
                        <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Location Info */}
          <div className="block sm:hidden mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex justify-center gap-4 text-xs text-white">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#01AEED]" />
                <span>Bugibba</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#01AEED]" />
                <span>Opening Soon</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-[#01AEED]" />
                <span>All Ages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}