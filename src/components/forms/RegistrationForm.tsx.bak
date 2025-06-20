// src/components/forms/RegistrationForm.tsx (Updated handleSubmit function)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle, User, Mail, Phone, CreditCard, Zap } from 'lucide-react'

interface RegistrationFormProps {
  onSuccess?: () => void
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    panelInterest: false,
    panelType: '',
    interestLevel: '',
    acceptTerms: false
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.idNumber || !formData.acceptTerms) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and accept terms.",
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
        toast({
          title: "Registration Successful!",
          description: "Thank you for registering. You'll receive a confirmation email shortly.",
        })
        
        // Redirect to success page
        router.push('/register/success')
        onSuccess?.()
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">VIP Registration</CardTitle>
        <CardDescription className="text-center">
          Register for exclusive access to the EMS Trade Fair VIP Experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input 
                  placeholder="Enter your first name" 
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input 
                  placeholder="Enter your last name" 
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </h3>
            
            <div>
              <label className="text-sm font-medium">Email Address *</label>
              <Input 
                type="email" 
                placeholder="Enter your email address" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Phone Number *</label>
              <Input 
                type="tel" 
                placeholder="Enter your phone number" 
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Identification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Identification
            </h3>
            
            <div>
              <label className="text-sm font-medium">ID Number *</label>
              <Input 
                placeholder="Enter your ID number" 
                value={formData.idNumber}
                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used for ticket verification at the event
              </p>
            </div>
          </div>

          {/* Panel Interest */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              EMS Panel Interest (Optional)
            </h3>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                checked={formData.panelInterest}
                onCheckedChange={(checked) => handleInputChange('panelInterest', checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  I'm interested in learning more about EMS panels
                </label>
                <p className="text-xs text-gray-500">
                  Our experts will contact you during the event to discuss your requirements
                </p>
              </div>
            </div>
            
            {formData.panelInterest && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                <div>
                  <label className="text-sm font-medium">Panel Type of Interest</label>
                  <Select value={formData.panelType} onValueChange={(value) => handleInputChange('panelType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select panel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential Panels</SelectItem>
                      <SelectItem value="commercial">Commercial Panels</SelectItem>
                      <SelectItem value="industrial">Industrial Panels</SelectItem>
                      <SelectItem value="smart">Smart Panels</SelectItem>
                      <SelectItem value="custom">Custom Solutions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Interest Level</label>
                  <Select value={formData.interestLevel} onValueChange={(value) => handleInputChange('interestLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interest level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High - Ready to purchase soon</SelectItem>
                      <SelectItem value="MEDIUM">Medium - Considering options</SelectItem>
                      <SelectItem value="LOW">Low - Just exploring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox 
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  I accept the terms and conditions *
                </label>
                <p className="text-xs text-gray-500">
                  By registering, you agree to our privacy policy and terms of service
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Submitting...' : 'Register for VIP Access'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}