
// src/components/forms/steps/EmsCustomerStep.tsx - More compact
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building } from 'lucide-react'
import { StepProps } from '@/types/registration'

export function EmsCustomerStep({ formData, onUpdate }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-base font-semibold flex items-center justify-center gap-2">
          <Building className="h-4 w-4" />
          EMS Customer Details
        </h3>
        <p className="text-xs text-gray-600">Help us verify your account (optional)</p>
      </div>

      <div className="space-y-3 p-3 border rounded-lg bg-green-50">
        <div>
          <Label htmlFor="customerName" className="text-sm">Customer/Company Name</Label>
          <Input 
            id="customerName"
            placeholder="Your company name"
            value={formData.customerName || ''}
            onChange={(e) => onUpdate('customerName', e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <Label htmlFor="emsCustomerId" className="text-sm">EMS Customer ID</Label>
          <Input 
            id="emsCustomerId"
            placeholder="Customer ID (if known)"
            value={formData.emsCustomerId || ''}
            onChange={(e) => onUpdate('emsCustomerId', e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <Label htmlFor="accountManager" className="text-sm">Account Manager</Label>
          <Input 
            id="accountManager"
            placeholder="Manager name (if known)"
            value={formData.accountManager || ''}
            onChange={(e) => onUpdate('accountManager', e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <div className="p-3 border rounded-lg bg-blue-50">
        <p className="text-xs text-blue-800">
          <strong>Free VIP Access:</strong> As an EMS customer, your access is complimentary 
          pending verification by our admin team.
        </p>
      </div>
    </div>
  )
}