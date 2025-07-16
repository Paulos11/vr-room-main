// src/components/forms/VRRegistrationForm.tsx - VR registration with integrated payment step
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, ArrowRight, AlertTriangle, Gamepad2, Users, Calendar, MapPin, CreditCard, Shield, CheckCircle, Gift } from 'lucide-react'

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

  const totalSteps = 4 // Added payment step

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
        // After terms step, create registration
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

      console.log('Creating VR registration:', {
        email: cleanedData.email,
        sessionCount: cleanedData.selectedTickets.length,
        totalTickets: cleanedData.selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
      })

      const response = await fetch('/api/vr-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setRegistrationData(result.data)
        setCurrentStep(4) // Move to payment step
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
    // Redirect to success page
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
  }, [currentStep, formData, handleInputChange, registrationData, handlePaymentComplete, isFreeOrder])

  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 4) return true // Payment step validation handled internally
    return validateVRStep(currentStep, formData)
  }, [currentStep, formData])

  const stepTitles = [
    'Choose VR Experiences',
    'Your Information', 
    'Terms & Booking',
    'Payment & Confirmation'
  ]

  const getStepIcon = (stepIndex: number) => {
    switch (stepIndex) {
      case 1: return <Gamepad2 className="h-4 w-4" />
      case 2: return <Users className="h-4 w-4" />
      case 3: return <CheckCircle className="h-4 w-4" />
      case 4: return isFreeOrder ? <Gift className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />
      default: return <div className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed relative pt-20" 
         style={{ 
           backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(1,174,237,0.8)), url('/vr-background.jpg')`,
         }}>
      
      {/* Full-width container */}
      <div className="w-full min-h-screen">
        
        {/* Header Section */}
        <div className="w-full bg-black/40 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              {/* Form Title */}
              <div>
                <h1 className="text-2xl font-bold text-white">Book Your VR Experience</h1>
                <p className="text-sm text-gray-300">
                  {currentStep === 4 ? (
                    isFreeOrder ? 'Complete your free VR booking' : 'Secure payment with Stripe'
                  ) : (
                    'Choose your virtual reality adventure'
                  )}
                </p>
              </div>
              
              {/* Step Progress */}
              <div className="hidden md:flex items-center gap-6">
                {stepTitles.map((title, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index + 1 < currentStep ? 'bg-green-500 text-white' :
                      index + 1 === currentStep ? 'bg-[#01AEED] text-white' :
                      'bg-white/20 text-gray-300'
                    }`}>
                      {index + 1 < currentStep ? <CheckCircle className="h-4 w-4" /> : getStepIcon(index + 1)}
                    </div>
                    <span className={`text-sm ${
                      index + 1 === currentStep ? 'text-white font-medium' : 'text-gray-300'
                    }`}>
                      {title}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Booking Summary */}
              {totalTickets > 0 && currentStep < 4 && (
                <div className="text-right">
                  <div className="text-white font-bold text-lg">{totalCost}</div>
                  <div className="text-sm text-gray-300">{totalTickets} session{totalTickets > 1 ? 's' : ''}</div>
                </div>
              )}

              {/* Payment Summary */}
              {currentStep === 4 && registrationData && (
                <div className="text-right">
                  <div className={`font-bold text-lg ${isFreeOrder ? 'text-green-400' : 'text-white'}`}>
                    {isFreeOrder ? 'FREE' : `€${(registrationData.finalAmount / 100).toFixed(2)}`}
                  </div>
                  <div className="text-sm text-gray-300">
                    {registrationData.sessionCount} session{registrationData.sessionCount > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile Progress Bar */}
            <div className="mt-4 md:hidden">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{stepTitles[currentStep - 1]}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-[#01AEED] h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Step Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden">
            
            {/* Content Body */}
            <div className="p-8">
              {renderStepContent()}
            </div>
            
            {/* Step Validation Warning */}
            {!isCurrentStepValid && currentStep > 1 && currentStep < 4 && (
              <div className="mx-8 mb-6 flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800">
                  Please complete all required fields above to continue
                </p>
              </div>
            )}
            
            {/* Navigation Footer */}
            {currentStep < 4 && (
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="px-6 py-3 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED] hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#01AEED]" />
                      <span>Bugibba Square</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#01AEED]" />
                      <span>Opening Wednesday</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#01AEED]" />
                      <span>All Ages</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleNext}
                    className="px-6 py-3 bg-gradient-to-r from-[#01AEED] to-[#262624] hover:from-[#01AEED]/90 hover:to-[#262624]/90"
                    disabled={!isCurrentStepValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : currentStep === 3 ? (
                      <>
                        Create Booking
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}