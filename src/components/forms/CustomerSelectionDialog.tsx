
// src/components/forms/CustomerSelectionDialog.tsx - Updated to remove hardcoded price
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building, Users, Crown, CreditCard, X } from 'lucide-react'

interface CustomerSelectionDialogProps {
  open: boolean
  onCustomerTypeSelected: (isEmsClient: boolean) => void
}

export function CustomerSelectionDialog({ open, onCustomerTypeSelected }: CustomerSelectionDialogProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<boolean | null>(null)

  const handleSelection = (isEmsClient: boolean) => {
    setSelectedType(isEmsClient)
  }

  const handleContinue = () => {
    if (selectedType !== null) {
      onCustomerTypeSelected(selectedType)
    }
  }

  const handleClose = () => {
    router.push('/')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-0 bg-white shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800">
            Select Customer Type
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">Choose your registration category</p>
        </DialogHeader>

        <div className="space-y-3">
          {/* EMS Customer Card */}
          <Card 
            className={`cursor-pointer transition-all duration-200 border-2 ${
              selectedType === true 
                ? 'ring-2 ring-green-500 bg-green-50 border-green-300' 
                : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
            }`}
            onClick={() => handleSelection(true)}
          >
            <CardHeader className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <CardTitle className="text-base">EMS Customer</CardTitle>
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </div>
                  <CardDescription className="text-sm">
                    Existing client with account
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">FREE</p>
                  <p className="text-xs text-gray-500">All Tickets</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* General Public Card */}
          <Card 
            className={`cursor-pointer transition-all duration-200 border-2 ${
              selectedType === false 
                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
            onClick={() => handleSelection(false)}
          >
            <CardHeader className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <CardTitle className="text-base">General Public</CardTitle>
                    <CreditCard className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardDescription className="text-sm">
                    New visitor or potential customer
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">Varies</p>
                  <p className="text-xs text-gray-500">by ticket type</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleContinue}
            disabled={selectedType === null}
            className="w-full h-10 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
          >
            Continue Registration
          </Button>
          
          {selectedType === null && (
            <p className="text-xs text-gray-500 text-center mt-2">Please select an option above</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}