// src/components/admin/AddUserDialog.tsx - Simplified minimal form
'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  UserPlus
} from 'lucide-react'

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface FormData {
  // Basic Information
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  
  // Customer Type
  isEmsClient: boolean
  customerName: string // Only for EMS clients
  orderNumber: string // Optional for EMS clients
  
  // Simple Panel Interest
  hasPanelInterest: boolean
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  idCardNumber: '',
  isEmsClient: false,
  customerName: '',
  orderNumber: '',
  hasPanelInterest: false
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [creating, setCreating] = useState(false)

  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      return false
    }
    if (formData.isEmsClient && !formData.customerName) {
      return false
    }
    return true
  }

  const handleCreate = useCallback(async () => {
    if (!validateForm()) {
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
        body: JSON.stringify({
          ...formData,
          autoApprove: true,
          generateTickets: true
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "User created and tickets generated successfully",
        })
        
        onSuccess()
        onOpenChange(false)
        setFormData(initialFormData)
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
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-lg border-0 bg-white shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add New User
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Quick registration - tickets will be generated automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Personal Information */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className="mt-1 h-10 border-2 border-gray-200 focus:border-blue-400"
                  placeholder="First name"
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
                  className="mt-1 h-10 border-2 border-gray-200 focus:border-blue-400"
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div className="mt-3">
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
                  className="pl-10 h-10 border-2 border-gray-200 focus:border-blue-400"
                  placeholder="user@example.com"
                />
              </div>
            </div>
            
            <div className="mt-3">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number *
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="pl-10 h-10 border-2 border-gray-200 focus:border-blue-400"
                  placeholder="+356 1234 5678"
                />
              </div>
            </div>
            
            <div className="mt-3">
              <Label htmlFor="idCard" className="text-sm font-medium text-gray-600">
                ID Card Number (Optional)
              </Label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="idCard"
                  value={formData.idCardNumber}
                  onChange={(e) => updateFormData('idCardNumber', e.target.value)}
                  className="pl-10 h-10 border-2 border-gray-200 focus:border-blue-400"
                  placeholder="ID card number"
                />
              </div>
            </div>
          </div>

          {/* Customer Type */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-green-600" />
                Customer Type
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
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                    Customer/Company Name *
                  </Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => updateFormData('customerName', e.target.value)}
                    className="mt-1 h-10 border-2 border-gray-200 focus:border-green-400"
                    placeholder="Customer or business name"
                  />
                </div>
                <div>
                  <Label htmlFor="orderNumber" className="text-sm font-medium text-gray-600">
                    Order Number (Optional)
                  </Label>
                  <Input
                    id="orderNumber"
                    value={formData.orderNumber}
                    onChange={(e) => updateFormData('orderNumber', e.target.value)}
                    className="mt-1 h-10 border-2 border-gray-200 focus:border-green-400"
                    placeholder="e.g., ORD-2024-001"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                  General Public Registration
                </Badge>
              </div>
            )}
          </div>

          {/* Solar Panel Interest */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  Solar Panel Interest
                </h3>
                <p className="text-xs text-gray-600 mt-1">Optional - for lead tracking</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="hasPanelInterest" className="text-sm font-medium text-gray-700">
                  Interested
                </Label>
                <Switch
                  id="hasPanelInterest"
                  checked={formData.hasPanelInterest}
                  onCheckedChange={(checked) => updateFormData('hasPanelInterest', checked)}
                />
              </div>
            </div>
            
            {formData.hasPanelInterest && (
              <div className="mt-3 p-2 bg-orange-100 rounded text-center">
                <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">
                  ⚡ Will be flagged for solar panel follow-up
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={creating || !validateForm()}
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
        </div>

        {/* Quick Summary */}
        <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <Badge variant={formData.isEmsClient ? "default" : "outline"}>
                {formData.isEmsClient ? 'EMS Customer' : 'General Public'}
              </Badge>
              {formData.hasPanelInterest && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                  <Zap className="w-3 h-3 mr-1" />
                  Solar Interest
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-600">
              {formData.isEmsClient ? 'Free EMS tickets' : 'Auto-approved with tickets'}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Event: 26 June - 06 July 2025
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}