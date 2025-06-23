// src/components/forms/steps/EmsCustomerStep.tsx - Updated with simplified fields
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

      {/* EMS Customer Information */}
      <div className="space-y-3 p-3 border rounded-lg bg-green-50">
        <h4 className="text-sm font-medium text-green-900">Customer & Order Information (Optional)</h4>
        
        <div>
          <Label htmlFor="customerName" className="text-sm">Customer Name</Label>
          <Input 
            id="customerName"
            placeholder="Your name or business name"
            value={formData.customerName || ''}
            onChange={(e) => onUpdate('customerName', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="orderNumber" className="text-sm">Order Number</Label>
            <Input 
              id="orderNumber"
              placeholder="e.g., ORD-2024-001"
              value={formData.orderNumber || ''}
              onChange={(e) => onUpdate('orderNumber', e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="applicationNumber" className="text-sm">Application Number</Label>
            <Input 
              id="applicationNumber"
              placeholder="e.g., APP-2024-001"
              value={formData.applicationNumber || ''}
              onChange={(e) => onUpdate('applicationNumber', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="orderDate" className="text-sm">Order Date</Label>
          <Input 
            id="orderDate"
            type="date"
            value={formData.orderDate || ''}
            onChange={(e) => onUpdate('orderDate', e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <div className="p-3 border rounded-lg bg-purple-50">
        <p className="text-xs text-purple-800">
          <strong>Free VIP Access:</strong> As an EMS customer, your access is complimentary 
          pending verification by our admin team. Providing order details helps speed up verification.
        </p>
      </div>
    </div>
  )
}