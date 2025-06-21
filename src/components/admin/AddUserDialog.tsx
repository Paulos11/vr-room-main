// src/components/admin/AddUserDialog.tsx - Comprehensive user creation form
'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  Loader2, 
  User, 
  Building, 
  Mail, 
  Phone, 
  CreditCard, 
  Zap,
  Plus,
  Sparkles 
} from 'lucide-react'

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface FormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  
  // EMS Client Information
  isEmsClient: boolean
  companyName: string
  emsCustomerId: string
  accountManager: string
  
  // Panel Interests
  hasPanelInterest: boolean
  panelType: string
  interestLevel: string
  estimatedBudget: string
  timeframe: string
  panelNotes: string
  
  // Admin Notes
  adminNotes: string
  
  // Auto-approve option
  autoApprove: boolean
  generateTickets: boolean
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  idCardNumber: '',
  isEmsClient: false,
  companyName: '',
  emsCustomerId: '',
  accountManager: '',
  hasPanelInterest: false,
  panelType: 'residential',
  interestLevel: 'MEDIUM',
  estimatedBudget: '',
  timeframe: '',
  panelNotes: '',
  adminNotes: '',
  autoApprove: true,
  generateTickets: true
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [creating, setCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone)
      case 2:
        return formData.isEmsClient ? !!(formData.companyName) : true
      case 3:
        return true // Optional step
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before continuing",
        variant: "destructive",
      })
    }
  }

  const handleCreate = useCallback(async () => {
    if (!validateStep(1)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `User created successfully${formData.generateTickets ? ' with tickets generated' : ''}`,
        })
        
        onSuccess()
        onOpenChange(false)
        
        // Reset form
        setFormData(initialFormData)
        setCurrentStep(1)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }, [formData, onSuccess, onOpenChange])

  const resetForm = () => {
    setFormData(initialFormData)
    setCurrentStep(1)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 bg-white shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
            Add New User
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new registration and optionally generate tickets instantly
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                step <= currentStep 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-sm' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-1 mx-2 rounded transition-all duration-200 ${
                  step < currentStep 
                    ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className="mt-1 h-11 border-2 border-gray-200 focus:border-blue-400"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className="mt-1 h-11 border-2 border-gray-200 focus:border-blue-400"
                    placeholder="Enter last name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-400"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-400"
                      placeholder="+356 1234 5678"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="idCard" className="text-sm font-medium text-gray-700">
                    ID Card Number
                  </Label>
                  <div className="relative mt-1">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="idCard"
                      value={formData.idCardNumber}
                      onChange={(e) => updateFormData('idCardNumber', e.target.value)}
                      className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-400"
                      placeholder="ID card or passport number"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Company Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Building className="w-5 h-5 text-green-600" />
                  Company Information
                </h3>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="isEmsClient" className="text-sm font-medium text-gray-700">
                    EMS Customer
                  </Label>
                  <Switch
                    id="isEmsClient"
                    checked={formData.isEmsClient}
                    onCheckedChange={(checked) => updateFormData('isEmsClient', checked)}
                  />
                </div>
              </div>
              
              {formData.isEmsClient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                      className="mt-1 h-11 border-2 border-gray-200 focus:border-green-400"
                      placeholder="Enter company name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emsCustomerId" className="text-sm font-medium text-gray-700">
                      EMS Customer ID
                    </Label>
                    <Input
                      id="emsCustomerId"
                      value={formData.emsCustomerId}
                      onChange={(e) => updateFormData('emsCustomerId', e.target.value)}
                      className="mt-1 h-11 border-2 border-gray-200 focus:border-green-400"
                      placeholder="EMS-XXXX"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="accountManager" className="text-sm font-medium text-gray-700">
                      Account Manager
                    </Label>
                    <Input
                      id="accountManager"
                      value={formData.accountManager}
                      onChange={(e) => updateFormData('accountManager', e.target.value)}
                      className="mt-1 h-11 border-2 border-gray-200 focus:border-green-400"
                      placeholder="Manager name"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                    General Public Registration
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    This user will be registered as a general public attendee
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Solar Panel Interest & Settings */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Panel Interest */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Solar Panel Interest
                </h3>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="hasPanelInterest" className="text-sm font-medium text-gray-700">
                    Interested in Solar
                  </Label>
                  <Switch
                    id="hasPanelInterest"
                    checked={formData.hasPanelInterest}
                    onCheckedChange={(checked) => updateFormData('hasPanelInterest', checked)}
                  />
                </div>
              </div>
              
              {formData.hasPanelInterest ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="panelType" className="text-sm font-medium text-gray-700">
                      Panel Type
                    </Label>
                    <Select 
                      value={formData.panelType} 
                      onValueChange={(value) => updateFormData('panelType', value)}
                    >
                      <SelectTrigger className="mt-1 h-11 border-2 border-gray-200 focus:border-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential Panels</SelectItem>
                        <SelectItem value="commercial">Commercial Panels</SelectItem>
                        <SelectItem value="industrial">Industrial Panels</SelectItem>
                        <SelectItem value="hybrid">Hybrid Systems</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="interestLevel" className="text-sm font-medium text-gray-700">
                      Interest Level
                    </Label>
                    <Select 
                      value={formData.interestLevel} 
                      onValueChange={(value) => updateFormData('interestLevel', value)}
                    >
                      <SelectTrigger className="mt-1 h-11 border-2 border-gray-200 focus:border-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low Interest</SelectItem>
                        <SelectItem value="MEDIUM">Medium Interest</SelectItem>
                        <SelectItem value="HIGH">High Interest</SelectItem>
                        <SelectItem value="URGENT">Urgent Need</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="estimatedBudget" className="text-sm font-medium text-gray-700">
                      Estimated Budget
                    </Label>
                    <Input
                      id="estimatedBudget"
                      value={formData.estimatedBudget}
                      onChange={(e) => updateFormData('estimatedBudget', e.target.value)}
                      className="mt-1 h-11 border-2 border-gray-200 focus:border-orange-400"
                      placeholder="€10,000 - €50,000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeframe" className="text-sm font-medium text-gray-700">
                      Purchase Timeframe
                    </Label>
                    <Input
                      id="timeframe"
                      value={formData.timeframe}
                      onChange={(e) => updateFormData('timeframe', e.target.value)}
                      className="mt-1 h-11 border-2 border-gray-200 focus:border-orange-400"
                      placeholder="Within 6 months"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="panelNotes" className="text-sm font-medium text-gray-700">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="panelNotes"
                      value={formData.panelNotes}
                      onChange={(e) => updateFormData('panelNotes', e.target.value)}
                      className="mt-1 border-2 border-gray-200 focus:border-orange-400"
                      placeholder="Any specific requirements or questions..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Badge variant="outline" className="text-gray-600 border-gray-300">
                    No Solar Interest
                  </Badge>
                  <p className="text-sm text-gray-500 mt-2">
                    User is not interested in solar panel information
                  </p>
                </div>
              )}
            </div>

            {/* Admin Settings */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-gray-800 mb-4">
                Admin Settings & Processing
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-700">
                    Admin Notes
                  </Label>
                  <Textarea
                    id="adminNotes"
                    value={formData.adminNotes}
                    onChange={(e) => updateFormData('adminNotes', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-purple-400"
                    placeholder="Internal notes about this registration..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div>
                    <Label htmlFor="autoApprove" className="text-sm font-medium text-gray-700">
                      Auto-approve Registration
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically approve this registration without manual review
                    </p>
                  </div>
                  <Switch
                    id="autoApprove"
                    checked={formData.autoApprove}
                    onCheckedChange={(checked) => updateFormData('autoApprove', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div>
                    <Label htmlFor="generateTickets" className="text-sm font-medium text-gray-700">
                      Generate Tickets Immediately
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Create and send tickets right after registration
                    </p>
                  </div>
                  <Switch
                    id="generateTickets"
                    checked={formData.generateTickets}
                    onCheckedChange={(checked) => updateFormData('generateTickets', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="hover:bg-gray-50"
              >
                Previous
              </Button>
            )}
            {currentStep < 3 && (
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Next Step
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="hover:bg-gray-50"
            >
              Cancel
            </Button>
            {currentStep === 3 && (
              <Button 
                onClick={handleCreate}
                disabled={creating || !validateStep(1)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 min-w-32"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Summary Preview for Step 3 */}
        {currentStep === 3 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3">Registration Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">User:</span>
                <span className="font-medium ml-2">{formData.firstName} {formData.lastName}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="font-medium ml-2">{formData.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <Badge variant={formData.isEmsClient ? "default" : "outline"} className="ml-2">
                  {formData.isEmsClient ? 'EMS Customer' : 'General Public'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Solar Interest:</span>
                <Badge variant={formData.hasPanelInterest ? "default" : "outline"} className="ml-2">
                  {formData.hasPanelInterest ? 'Interested' : 'Not Interested'}
                </Badge>
              </div>
              {formData.autoApprove && (
                <div className="md:col-span-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    ✓ Will be auto-approved {formData.generateTickets ? 'with tickets generated' : ''}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}