// src/components/forms/EnhancedRegistrationForm.tsx - Fixed Version
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, ArrowRight, AlertTriangle, Crown } from 'lucide-react'

import { CustomerSelectionDialog } from './CustomerSelectionDialog'
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
    quantity: 1,
    panelInterest: false,
    acceptTerms: false,
    acceptPrivacyPolicy: false
  })

  const totalSteps = formData.isEmsClient ? 4 : 3

  // Calculate total cost - this is a VALUE, not a function
  const totalCost = useMemo(() => {
    if (formData.isEmsClient) return 'Free'
    return `€${((formData.quantity || 1) * 50).toFixed(2)}`
  }, [formData.isEmsClient, formData.quantity])

  const handleCustomerTypeSelected = useCallback((isEmsClient: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      isEmsClient,
      quantity: isEmsClient ? 1 : (prev.quantity || 1)
    }))
    setShowCustomerDialog(false)
  }, [])

  const handleInputChange = useCallback((field: keyof RegistrationFormData, value: any) => {
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

    setIsSubmitting(true)

    try {
      const cleanedData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        idCardNumber: formData.idCardNumber.trim(),
        quantity: formData.isEmsClient ? 1 : (formData.quantity || 1)
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
    const actualStep = formData.isEmsClient ? currentStep : (currentStep === 1 ? 1 : currentStep + 1)

    switch (actualStep) {
      case 1:
        return <PersonalInfoStep formData={formData} onUpdate={handleInputChange} />
      case 2:
        return <EmsCustomerStep formData={formData} onUpdate={handleInputChange} />
      case 3:
        return <PanelInterestStep formData={formData} onUpdate={handleInputChange} />
      case 4:
        return <TermsStep formData={formData} onUpdate={handleInputChange} />
      default:
        return null
    }
  }, [currentStep, formData, handleInputChange])

  const isCurrentStepValid = useMemo(() => {
    return validateStep(currentStep, formData)
  }, [currentStep, formData])

  if (showCustomerDialog) {
    return <CustomerSelectionDialog open={showCustomerDialog} onCustomerTypeSelected={handleCustomerTypeSelected} />
  }

  return (
    <div className="w-full max-w-md mx-auto ">
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        {/* Header with enhanced styling */}
        <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg pt-8">
          <div className="text-center">
            {formData.isEmsClient && (
              <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            )}
            <CardTitle className="text-xl text-gray-800">
              {formData.isEmsClient ? 'EMS Customer Registration' : 'VIP Ticket Registration'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {formData.isEmsClient 
                ? 'Free VIP access - verification required'
                : `${formData.quantity || 1} VIP ticket(s) - ${totalCost}`
              }
            </CardDescription>
          </div>
          
          {/* Enhanced Progress Bar */}
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
          {/* Step Content with min height for smooth transitions */}
          <div className="min-h-[300px] transition-all duration-300">
            {renderStepContent()}
          </div>
          
          {/* Step Validation Warning */}
          {!isCurrentStepValid && currentStep > 1 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mt-4 animate-in slide-in-from-top-2 duration-200">
              <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-800">
                Please complete all required fields above
              </p>
            </div>
          )}
          
          {/* Enhanced Navigation */}
          <div className="flex justify-between mt-6 gap-3">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex-1 h-10 transition-all duration-200 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNext}
                className="flex-1 h-10 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                disabled={!isCurrentStepValid}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !isCurrentStepValid}
                className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
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
              onClick={() => setShowCustomerDialog(true)}
              className="text-gray-500 text-sm h-8 hover:bg-green-50 transition-colors"
            >
              Change customer type
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}