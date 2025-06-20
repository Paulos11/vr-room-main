// src/components/forms/steps/PanelInterestStep.tsx
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Zap } from 'lucide-react'
import { StepProps } from '@/types/registration'

export function PanelInterestStep({ formData, onUpdate }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Zap className="h-5 w-5" />
          Solar Panel Interest
        </h3>
        <p className="text-sm text-gray-600">Optional - Help us understand your needs</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-4 border rounded-lg bg-blue-50">
          <Checkbox 
            checked={formData.panelInterest}
            onCheckedChange={(checked) => onUpdate('panelInterest', checked)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label className="text-base font-medium">
              I'm interested in EMS solar panel solutions
            </Label>
            <p className="text-sm text-blue-800">
              Our solar experts will be prepared to discuss your specific energy requirements 
              when you visit our booth at the trade fair.
            </p>
          </div>
        </div>

        {formData.panelInterest && (
          <div className="space-y-3 p-3 border rounded-lg bg-purple-50 animate-in slide-in-from-top-2 duration-200">
            <div className="text-sm text-purple-800">
              <p className="font-medium mb-2">Thank you for your interest!</p>
              <p>
                Our solar panel specialists will have detailed information ready for you, 
                including product catalogs, pricing, and installation options. We look 
                forward to discussing how EMS solar solutions can meet your energy needs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}