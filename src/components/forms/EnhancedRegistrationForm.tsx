// src/components/forms/EnhancedRegistrationForm.tsx - Updated to include panel interest for public customers
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
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
import { RegistrationFormData } from '@/types/registration' // Assuming this type is correctly defined
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
    // Updated EMS client fields - ensure these match RegistrationFormData
    customerName: '',
    orderNumber: '',
    applicationNumber: '',
    orderDate: ''
  })

  // Calculate total steps based on customer type
  const totalSteps = formData.isEmsClient ? 5 : 4 // EMS: 5 steps, Public: 4 steps

  // Calculate totals
  const totalTickets = useMemo(() => {
    return formData.selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
  }, [formData.selectedTickets])

  const totalCost = useMemo(() => {
    if (formData.isEmsClient) return 'Free'
    const totalCents = formData.selectedTickets.reduce((sum, ticket) => 
      sum + (ticket.priceInCents * ticket.quantity), 0
    )
    return `€${(totalCents / 100).toFixed(2)}`
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
      // EMS client fields - **REMOVE emsCustomerId and accountManager**
      customerName: '',
      orderNumber: '',       // Initialize optional fields as empty string or undefined
      applicationNumber: '', // Initialize optional fields as empty string or undefined
      orderDate: ''          // Initialize optional fields as empty string or undefined
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
      const cleanedData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        idCardNumber: formData.idCardNumber.trim(),
        couponCode: formData.couponCode || undefined,
        // Ensure optional EMS client fields are set to undefined if empty strings
        customerName: formData.customerName || undefined,
        orderNumber: formData.orderNumber || undefined,
        applicationNumber: formData.applicationNumber || undefined,
        orderDate: formData.orderDate || undefined, // Keep as string for API, conversion happens there
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
    // Debug logging
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
          // Panel Interest Step for Public Customers
          return <PanelInterestStep formData={formData} onUpdate={handleInputChange} />
        }
      case 4:
        if (formData.isEmsClient) {
          // Panel Interest Step for EMS Customers (Step 4 for EMS)
          return <PanelInterestStep formData={formData} onUpdate={handleInputChange} />
        } else {
          // Terms Step for Public Customers (Step 4 for Public)
          return <TermsStep formData={formData} onUpdate={handleInputChange} />
        }
      case 5:
        // This case should only be reachable by EMS clients for Terms Step
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
                `${totalTickets} ticket${totalTickets > 1 ? 's' : ''} - ${totalCost}`
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
                // Reset to step 1 when changing customer type
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