// src/components/forms/steps/EmsCustomerStep.tsx - Updated with required fields
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, AlertTriangle } from 'lucide-react'
import { StepProps } from '@/types/registration'

export function EmsCustomerStep({ formData, onUpdate }: StepProps) {
  // Validation helper
  const isFieldRequired = (fieldName: string) => {
    const requiredFields = ['customerName', 'orderNumber', 'applicationNumber']
    return requiredFields.includes(fieldName)
  }

  const isFieldEmpty = (fieldName: string) => {
    const value = formData[fieldName as keyof typeof formData]
    return !value || (typeof value === 'string' && value.trim() === '')
  }

  const getFieldError = (fieldName: string) => {
    if (isFieldRequired(fieldName) && isFieldEmpty(fieldName)) {
      return `${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`
    }
    return null
  }

  // Check if all required fields are filled
  const requiredFields = ['customerName', 'orderNumber', 'applicationNumber']
  const hasAllRequiredFields = requiredFields.every(field => !isFieldEmpty(field))

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-base font-semibold flex items-center justify-center gap-2">
          <Building className="h-4 w-4" />
          EMS Customer Details
        </h3>
        <p className="text-xs text-gray-600">
          Required information to verify your EMS account
        </p>
      </div>

      {/* EMS Customer Information */}
      <div className="space-y-3 p-3 border rounded-lg bg-green-50">
        <h4 className="text-sm font-medium text-green-900">
          Customer & Order Information
          <span className="text-red-500 ml-1">*</span>
        </h4>
        
        <div>
          <Label htmlFor="customerName" className="text-sm">
            Customer Name
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input 
            id="customerName"
            placeholder="Your name or business name"
            value={formData.customerName || ''}
            onChange={(e) => onUpdate('customerName', e.target.value)}
            className={`h-9 ${
              getFieldError('customerName') ? 'border-red-500 focus:border-red-500' : ''
            }`}
            required
          />
          {getFieldError('customerName') && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {getFieldError('customerName')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="orderNumber" className="text-sm">
              Order Number
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input 
              id="orderNumber"
              placeholder="e.g., ORD-2024-001"
              value={formData.orderNumber || ''}
              onChange={(e) => onUpdate('orderNumber', e.target.value)}
              className={`h-9 ${
                getFieldError('orderNumber') ? 'border-red-500 focus:border-red-500' : ''
              }`}
              required
            />
            {getFieldError('orderNumber') && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {getFieldError('orderNumber')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="applicationNumber" className="text-sm">
              Application Number
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input 
              id="applicationNumber"
              placeholder="e.g., APP-2024-001"
              value={formData.applicationNumber || ''}
              onChange={(e) => onUpdate('applicationNumber', e.target.value)}
              className={`h-9 ${
                getFieldError('applicationNumber') ? 'border-red-500 focus:border-red-500' : ''
              }`}
              required
            />
            {getFieldError('applicationNumber') && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {getFieldError('applicationNumber')}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="orderDate" className="text-sm">
            Order Date
            <span className="text-gray-500 ml-1">(Optional)</span>
          </Label>
          <Input 
            id="orderDate"
            type="date"
            value={formData.orderDate || ''}
            onChange={(e) => onUpdate('orderDate', e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Validation Summary */}
      {!hasAllRequiredFields && (
        <div className="p-3 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">
              Please fill in all required fields to continue
            </span>
          </div>
          <div className="mt-2 text-xs text-red-700">
            Missing required fields:
            <ul className="list-disc list-inside mt-1">
              {requiredFields.map(field => {
                if (isFieldEmpty(field)) {
                  return (
                    <li key={field}>
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </li>
                  )
                }
                return null
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Success Message */}
      {hasAllRequiredFields && (
        <div className="p-3 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="font-medium">
              All required information provided
            </span>
          </div>
        </div>
      )}

      <div className="p-3 border rounded-lg bg-purple-50">
        <p className="text-xs text-purple-800">
          <strong>Free VIP Access:</strong> As an EMS customer, your access is complimentary 
          pending verification by our admin team. The required order details help us verify 
          your account and speed up the approval process.
        </p>
      </div>
    </div>
  )
}