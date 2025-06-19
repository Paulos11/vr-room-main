
// Updated Enhanced Registration Form with Customer Selection
// src/components/forms/EnhancedRegistrationForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, User, Building, Zap, CheckCircle } from 'lucide-react'
import { CustomerSelectionDialog } from './CustomerSelectionDialog'

interface RegistrationFormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  
  // Customer Type (set by popup)
  isEmsClient: boolean
  
  // EMS Client Details (if applicable)
  companyName?: string
  emsCustomerId?: string
  accountManager?: string
  
  // Panel Interest
  panelInterest: boolean
  panelType?: string
  interestLevel?: string
  estimatedBudget?: string
  timeframe?: string
  panelNotes?: string
  
  // Terms
  acceptTerms: boolean
  acceptPrivacyPolicy: boolean
}

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
    panelInterest: false,
    acceptTerms: false,
    acceptPrivacyPolicy: false
  })

  // Adjust total steps based on customer type
  const totalSteps = formData.isEmsClient ? 4 : 3 // Skip EMS details for non-customers

  const handleCustomerTypeSelected = (isEmsClient: boolean) => {
    setFormData(prev => ({ ...prev, isEmsClient }))
    setShowCustomerDialog(false)
  }

  const handleInputChange = (field: keyof RegistrationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && 
                 formData.phone && formData.idCardNumber)
      // Updated EMS Customer Details Section in EnhancedRegistrationForm.tsx

      case 2:
        // Only shown for EMS clients
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <Building className="h-5 w-5" />
                EMS Customer Details
              </h3>
              <p className="text-sm text-gray-600">Please provide your EMS customer information</p>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-green-50">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input 
                  id="companyName"
                  placeholder="Enter your company name" 
                  value={formData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The company name associated with your EMS solar panel account
                </p>
              </div>

              <div>
                <Label htmlFor="emsCustomerId">EMS Customer ID *</Label>
                <Input 
                  id="emsCustomerId"
                  placeholder="Enter your EMS customer ID" 
                  value={formData.emsCustomerId || ''}
                  onChange={(e) => handleInputChange('emsCustomerId', e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This can be found on your EMS solar panel invoices or contracts
                </p>
              </div>

              <div>
                <Label htmlFor="accountManager">Account Manager (Optional)</Label>
                <Input 
                  id="accountManager"
                  placeholder="Your EMS account manager name (if known)" 
                  value={formData.accountManager || ''}
                  onChange={(e) => handleInputChange('accountManager', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your dedicated EMS solar panel account manager (optional)
                </p>
              </div>
            </div>

            <div className="p-3 border rounded-lg bg-blue-50">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> As an existing EMS solar panel customer, your VIP access is complimentary. 
                Our admin team will verify your customer status using the information provided above.
              </p>
            </div>
          </div>
        )

// Also update the validation logic to make account manager truly optional
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      return !!(formData.firstName && formData.lastName && formData.email && 
               formData.phone && formData.idCardNumber)
  // Updated EMS Customer Details Section - All Optional with Customer Name
case 2:
  // Only shown for EMS clients
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Building className="h-5 w-5" />
          EMS Customer Details
        </h3>
        <p className="text-sm text-gray-600">Please provide your EMS customer information</p>
      </div>

      <div className="space-y-4 p-4 border rounded-lg bg-green-50">
        <div>
          <Label htmlFor="customerName">Customer Name (Optional)</Label>
          <Input 
            id="customerName"
            placeholder="Enter your name as registered with EMS" 
            value={formData.companyName || ''} // Reusing companyName field for customer name
            onChange={(e) => handleInputChange('companyName', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Your name as it appears in EMS records
          </p>
        </div>

        <div>
          <Label htmlFor="emsCustomerId">EMS Customer ID (Optional)</Label>
          <Input 
            id="emsCustomerId"
            placeholder="Enter your EMS customer ID" 
            value={formData.emsCustomerId || ''}
            onChange={(e) => handleInputChange('emsCustomerId', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            This can be found on your EMS invoices or contracts
          </p>
        </div>

        <div>
          <Label htmlFor="accountManager">Account Manager (Optional)</Label>
          <Input 
            id="accountManager"
            placeholder="Your EMS account manager name (if known)" 
            value={formData.accountManager || ''}
            onChange={(e) => handleInputChange('accountManager', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Your dedicated EMS account manager (optional)
          </p>
        </div>
      </div>

      <div className="p-3 border rounded-lg bg-blue-50">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> As an existing EMS customer, your VIP access is complimentary. 
          Our admin team will verify your customer status.
        </p>
      </div>
    </div>
  )

// Simplified Panel Interest Section - Only Checkbox
case 3: // Panel Interest Section (for EMS customers) or case 2 (for non-EMS customers)
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Zap className="h-5 w-5" />
          Panel Interest (Optional)
        </h3>
        <p className="text-sm text-gray-600">Help us understand your panel requirements</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox 
            checked={formData.panelInterest}
            onCheckedChange={(checked) => handleInputChange('panelInterest', checked)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label className="text-base font-medium">
              I'm interested in EMS panel solutions
            </Label>
            <p className="text-sm text-gray-600">
              Our experts will contact you to discuss your specific requirements
            </p>
          </div>
        </div>

        {formData.panelInterest && (
          <div className="p-4 border rounded-lg bg-blue-50">
            <div>
              <Label htmlFor="panelNotes">Tell us about your requirements (Optional)</Label>
              <textarea 
                id="panelNotes"
                className="w-full mt-2 p-3 border rounded-md text-sm"
                placeholder="Please describe your panel requirements, project details, timeline, budget, or any specific questions you have..."
                value={formData.panelNotes || ''}
                onChange={(e) => handleInputChange('panelNotes', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )

// Updated validation - make EMS details optional
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      return !!(formData.firstName && formData.lastName && formData.email && 
               formData.phone && formData.idCardNumber)
    case 2:
      if (formData.isEmsClient) {
        // All EMS customer details are now optional
        return true
      } else {
        // For non-EMS clients, step 2 is panel interest (no validation needed as it's optional)
        return true
      }
    case 3:
      if (formData.isEmsClient) {
        // For EMS clients, step 3 is panel interest (optional)
        return true
      } else {
        // For non-EMS clients, step 3 is terms
        return formData.acceptTerms && formData.acceptPrivacyPolicy
      }
    case 4:
      // Only for EMS clients - terms
      return formData.acceptTerms && formData.acceptPrivacyPolicy
    default:
      return true
  }
}

// Create the missing pending page
// src/app/registration/pending/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, CheckCircle, Mail, Phone, AlertCircle, Home } from 'lucide-react'
import Link from 'next/link'

export default function PendingApprovalPage() {
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('id')
  
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (registrationId) {
      fetchRegistration()
    }
  }, [registrationId])

  const fetchRegistration = async () => {
    try {
      // For now, use mock data since API might not be ready
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
      
      setRegistration({
        id: registrationId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+356 1234 5678',
        isEmsClient: true,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        companyName: 'ABC Solar Ltd',
        emsCustomerId: 'EMS-12345',
        panelInterest: true
      })
    } catch (error) {
      console.error('Error fetching registration:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Registration Not Found</h2>
            <p className="text-gray-600 mb-4">The registration could not be found.</p>
            <Link href="/register">
              <Button>Back to Registration</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-orange-500" />
              Registration Pending Approval
            </CardTitle>
            <CardDescription className="text-center">
              Your EMS customer registration is being reviewed by our team
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status Banner */}
            <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-800">Awaiting Admin Approval</h3>
                  <p className="text-sm text-orange-700">
                    We're verifying your EMS customer status and will notify you once approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Details */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Registration Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium">{registration.firstName} {registration.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{registration.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span className="font-medium">{registration.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Registration ID:</span>
                  <span className="font-mono text-xs">{registration.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Submitted:</span>
                  <span>{new Date(registration.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Approval
                  </Badge>
                </div>
              </div>
            </div>

            {/* EMS Customer Info */}
            {registration.companyName && (
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-medium mb-3">EMS Customer Information</h3>
                <div className="space-y-2 text-sm">
                  {registration.companyName && (
                    <div className="flex justify-between">
                      <span>Customer Name:</span>
                      <span className="font-medium">{registration.companyName}</span>
                    </div>
                  )}
                  {registration.emsCustomerId && (
                    <div className="flex justify-between">
                      <span>Customer ID:</span>
                      <span className="font-medium">{registration.emsCustomerId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* What Happens Next */}
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                What Happens Next?
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium mt-0.5">1</div>
                  <span>Our admin team will verify your EMS customer status (usually within 24 hours)</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium mt-0.5">2</div>
                  <span>Once approved, we'll generate your complimentary VIP ticket</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium mt-0.5">3</div>
                  <span>You'll receive an email with your VIP ticket and collection instructions</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium mt-0.5">4</div>
                  <span>Collect your physical ticket at our booth during the event</span>
                </div>
              </div>
            </div>

            {/* Panel Interest */}
            {registration.panelInterest && (
              <div className="p-4 border rounded-lg bg-purple-50">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Panel Interest Noted
                </h3>
                <p className="text-sm text-purple-800">
                  We've noted your interest in EMS panels. Our experts will be prepared to discuss 
                  your requirements when you visit our booth at the trade fair.
                </p>
              </div>
            )}

            {/* Contact Information */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Need Help?</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span>Email: support@ems-events.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span>Phone: +356 2123 4567</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/ticket-status" className="flex-1">
                <Button className="w-full">
                  Check Status Later
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Keep this page bookmarked or save your Registration ID: <strong>{registration.id}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Create the directory structure for the pending page
    case 3:
      if (formData.isEmsClient) {
        // For EMS clients, step 3 is panel interest
        if (formData.panelInterest) {
          return !!(formData.panelType && formData.interestLevel)
        }
        return true
      } else {
        // For non-EMS clients, step 3 is terms
        return formData.acceptTerms && formData.acceptPrivacyPolicy
      }
    case 4:
      // Only for EMS clients - terms
      return formData.acceptTerms && formData.acceptPrivacyPolicy
    default:
      return true
  }
}

// Update the panel interest section to reflect solar panel focus
case 3: // Panel Interest Section
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Zap className="h-5 w-5" />
          Solar Panel Interest (Optional)
        </h3>
        <p className="text-sm text-gray-600">Help us understand your solar panel requirements</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox 
            checked={formData.panelInterest}
            onCheckedChange={(checked) => handleInputChange('panelInterest', checked)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label className="text-base font-medium">
              I'm interested in EMS solar panel solutions
            </Label>
            <p className="text-sm text-gray-600">
              Our solar experts will contact you to discuss your specific energy requirements
            </p>
          </div>
        </div>

        {formData.panelInterest && (
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <div>
              <Label htmlFor="panelType">Solar Panel Type *</Label>
              <Select 
                value={formData.panelType} 
                onValueChange={(value) => handleInputChange('panelType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select solar panel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential Solar Panels</SelectItem>
                  <SelectItem value="commercial">Commercial Solar Systems</SelectItem>
                  <SelectItem value="industrial">Industrial Solar Solutions</SelectItem>
                  <SelectItem value="smart">Smart Solar Panels with IoT</SelectItem>
                  <SelectItem value="battery">Solar + Battery Storage</SelectItem>
                  <SelectItem value="custom">Custom Solar Solutions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interestLevel">Interest Level *</Label>
              <Select 
                value={formData.interestLevel} 
                onValueChange={(value) => handleInputChange('interestLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interest level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgent - Need solar installation within 1 month</SelectItem>
                  <SelectItem value="HIGH">High - Planning solar installation within 3 months</SelectItem>
                  <SelectItem value="MEDIUM">Medium - Considering solar within 6 months</SelectItem>
                  <SelectItem value="LOW">Low - Just exploring solar options</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedBudget">Estimated Solar Budget (Optional)</Label>
              <Select 
                value={formData.estimatedBudget} 
                onValueChange={(value) => handleInputChange('estimatedBudget', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range for solar installation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-5k">Under €5,000</SelectItem>
                  <SelectItem value="5k-10k">€5,000 - €10,000</SelectItem>
                  <SelectItem value="10k-20k">€10,000 - €20,000</SelectItem>
                  <SelectItem value="20k-35k">€20,000 - €35,000</SelectItem>
                  <SelectItem value="35k-50k">€35,000 - €50,000</SelectItem>
                  <SelectItem value="over-50k">Over €50,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeframe">Installation Timeframe (Optional)</Label>
              <Select 
                value={formData.timeframe} 
                onValueChange={(value) => handleInputChange('timeframe', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="When do you plan to install solar panels?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediately</SelectItem>
                  <SelectItem value="1-month">Within 1 month</SelectItem>
                  <SelectItem value="3-months">Within 3 months</SelectItem>
                  <SelectItem value="6-months">Within 6 months</SelectItem>
                  <SelectItem value="1-year">Within 1 year</SelectItem>
                  <SelectItem value="future">Future consideration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="panelNotes">Additional Notes (Optional)</Label>
              <textarea 
                id="panelNotes"
                className="w-full mt-1 p-2 border rounded-md text-sm"
                placeholder="Tell us more about your solar energy requirements (roof type, energy usage, property size, etc.)..."
                value={formData.panelNotes || ''}
                onChange={(e) => handleInputChange('panelNotes', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
      case 3:
        if (formData.isEmsClient) {
          // For EMS clients, step 3 is panel interest
          if (formData.panelInterest) {
            return !!(formData.panelType && formData.interestLevel)
          }
          return true
        } else {
          // For non-EMS clients, step 3 is terms
          return formData.acceptTerms && formData.acceptPrivacyPolicy
        }
      case 4:
        // Only for EMS clients - terms
        return formData.acceptTerms && formData.acceptPrivacyPolicy
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive",
      })
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) {
      toast({
        title: "Please complete all required fields",
        description: "You must fill in all required information and accept the terms.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        if (formData.isEmsClient) {
          // EMS Client - needs admin approval
          router.push(`/registration/pending?id=${result.data.id}`)
        } else {
          // Non-EMS Client - redirect to payment
          router.push(`/payment?id=${result.data.id}`)
        }
      } else {
        toast({
          title: "Registration Failed",
          description: result.message || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    // Adjust step numbers based on customer type
    const actualStep = formData.isEmsClient ? currentStep : (currentStep === 1 ? 1 : currentStep + 1)

    switch (actualStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <p className="text-sm text-gray-600">Please provide your personal details</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input 
                  id="firstName"
                  placeholder="Enter your first name" 
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input 
                  id="lastName"
                  placeholder="Enter your last name" 
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="Enter your email address" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input 
                id="phone"
                type="tel" 
                placeholder="Enter your phone number" 
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="idCard">ID Card Number *</Label>
              <Input 
                id="idCard"
                placeholder="Enter your ID card number" 
                value={formData.idCardNumber}
                onChange={(e) => handleInputChange('idCardNumber', e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for ticket verification at the event
              </p>
            </div>
          </div>
        )

      case 2:
        // Only shown for EMS clients
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <Building className="h-5 w-5" />
                EMS Customer Details
              </h3>
              <p className="text-sm text-gray-600">Please provide your EMS customer information</p>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-green-50">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input 
                  id="companyName"
                  placeholder="Enter your company name" 
                  value={formData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="emsCustomerId">EMS Customer ID *</Label>
                <Input 
                  id="emsCustomerId"
                  placeholder="Enter your EMS customer ID" 
                  value={formData.emsCustomerId || ''}
                  onChange={(e) => handleInputChange('emsCustomerId', e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This can be found on your EMS invoices or contracts
                </p>
              </div>

              <div>
                <Label htmlFor="accountManager">Account Manager (Optional)</Label>
                <Input 
                  id="accountManager"
                  placeholder="Your EMS account manager name" 
                  value={formData.accountManager || ''}
                  onChange={(e) => handleInputChange('accountManager', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <Zap className="h-5 w-5" />
                Panel Interest (Optional)
              </h3>
              <p className="text-sm text-gray-600">Help us understand your panel requirements</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  checked={formData.panelInterest}
                  onCheckedChange={(checked) => handleInputChange('panelInterest', checked)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    I'm interested in EMS panel solutions
                  </Label>
                  <p className="text-sm text-gray-600">
                    Our experts will contact you to discuss your specific requirements
                  </p>
                </div>
              </div>

              {formData.panelInterest && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <div>
                    <Label htmlFor="panelType">Panel Type *</Label>
                    <Select 
                      value={formData.panelType} 
                      onValueChange={(value) => handleInputChange('panelType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select panel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential Panels</SelectItem>
                        <SelectItem value="commercial">Commercial Panels</SelectItem>
                        <SelectItem value="industrial">Industrial Panels</SelectItem>
                        <SelectItem value="smart">Smart IoT Panels</SelectItem>
                        <SelectItem value="custom">Custom Solutions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="interestLevel">Interest Level *</Label>
                    <Select 
                      value={formData.interestLevel} 
                      onValueChange={(value) => handleInputChange('interestLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interest level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="URGENT">Urgent - Need to purchase within 1 month</SelectItem>
                        <SelectItem value="HIGH">High - Planning to purchase within 3 months</SelectItem>
                        <SelectItem value="MEDIUM">Medium - Considering within 6 months</SelectItem>
                        <SelectItem value="LOW">Low - Just exploring options</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="estimatedBudget">Estimated Budget (Optional)</Label>
                    <Select 
                      value={formData.estimatedBudget} 
                      onValueChange={(value) => handleInputChange('estimatedBudget', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-1k">Under €1,000</SelectItem>
                        <SelectItem value="1k-5k">€1,000 - €5,000</SelectItem>
                        <SelectItem value="5k-10k">€5,000 - €10,000</SelectItem>
                        <SelectItem value="10k-25k">€10,000 - €25,000</SelectItem>
                        <SelectItem value="25k-50k">€25,000 - €50,000</SelectItem>
                        <SelectItem value="over-50k">Over €50,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Terms & Confirmation
              </h3>
              <p className="text-sm text-gray-600">Please review and accept our terms</p>
            </div>

            {/* Registration Summary */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Registration Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Type:</span>
                  <span className="font-medium">
                    {formData.isEmsClient ? 'EMS Customer' : 'General Public'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-medium">
                    {formData.isEmsClient ? 'Free (pending approval)' : '€50.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    I accept the Terms and Conditions *
                  </Label>
                  <p className="text-xs text-gray-600">
                    By registering, you agree to our terms of service and event policies
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox 
                  checked={formData.acceptPrivacyPolicy}
                  onCheckedChange={(checked) => handleInputChange('acceptPrivacyPolicy', checked)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    I accept the Privacy Policy *
                  </Label>
                  <p className="text-xs text-gray-600">
                    We will use your information to process your registration and improve our services
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Don't show the form until customer type is selected
  if (showCustomerDialog) {
    return <CustomerSelectionDialog open={showCustomerDialog} onCustomerTypeSelected={handleCustomerTypeSelected} />
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {formData.isEmsClient ? 'EMS Customer Registration' : 'VIP Registration'}
        </CardTitle>
        <CardDescription className="text-center">
          {formData.isEmsClient 
            ? 'Register for free VIP access - pending verification'
            : 'Register for €50 VIP access with instant confirmation'
          }
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderStepContent()}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 
               formData.isEmsClient ? 'Submit for Approval' : 'Proceed to Payment'}
            </Button>
          )}
        </div>
        
        {/* Back to Selection */}
        <div className="text-center mt-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowCustomerDialog(true)}
            className="text-gray-500"
          >
            Change customer type
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
