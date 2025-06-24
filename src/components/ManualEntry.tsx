// src/components/ManualEntry.tsx - Manual Ticket Entry Component

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Keyboard, CheckCircle } from 'lucide-react'
import { validateTicketNumber } from '../utils/scannerUtils'
import type { ManualEntryProps } from '../types/scanner'

export function ManualEntry({ onSubmit, isProcessing, disabled = false }: ManualEntryProps) {
  const [ticketNumber, setTicketNumber] = useState('')
  const [isValid, setIsValid] = useState(true)

  const handleInputChange = (value: string) => {
    const cleanValue = value.toUpperCase().trim()
    setTicketNumber(cleanValue)
    
    // Validate format as user types (only if they've entered something)
    if (cleanValue.length > 0) {
      setIsValid(validateTicketNumber(cleanValue) || cleanValue.length < 12) // Allow partial input
    } else {
      setIsValid(true)
    }
  }

  const handleSubmit = () => {
    const cleanTicket = ticketNumber.trim()
    
    if (!cleanTicket) return
    
    if (!validateTicketNumber(cleanTicket)) {
      setIsValid(false)
      return
    }
    
    onSubmit(cleanTicket)
    setTicketNumber('')
    setIsValid(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="border-t pt-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          Manual Ticket Entry:
        </label>
      </div>

      {/* Input Field */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="TKT-2025-XXXXXX"
            value={ticketNumber}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`flex-1 font-mono ${!isValid ? 'border-red-300 focus:border-red-500' : ''}`}
            disabled={isProcessing || disabled}
            maxLength={16}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!ticketNumber.trim() || !isValid || isProcessing || disabled}
            className="px-6"
          >
            {isProcessing ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Verify'
            )}
          </Button>
        </div>

        {/* Validation Message */}
        {!isValid && ticketNumber.length > 0 && (
          <p className="text-sm text-red-600">
            Invalid format. Expected: TKT-YYYY-XXXXXX (e.g., TKT-2025-ABC123)
          </p>
        )}

        {/* Format Helper */}
        {ticketNumber.length === 0 && (
          <p className="text-xs text-gray-500">
            Format: TKT-2025-ABC123 (case insensitive)
          </p>
        )}
      </div>

      {/* Quick Instructions */}
      <Alert className="bg-gray-50 border-gray-200">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Backup Entry:</strong> Use this if QR code is damaged or unreadable. 
          Ticket numbers are printed below QR codes on tickets.
        </AlertDescription>
      </Alert>
    </div>
  )
}