// src/components/VerificationDisplay.tsx - Verification Result Display

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Scan, User, Mail, Crown, RefreshCw, Clock } from 'lucide-react'
import { formatTime } from '../utils/scannerUtils'
import type { VerificationDisplayProps } from '../types/scanner'

export function VerificationDisplay({ 
  result, 
  isProcessing, 
  onClear 
}: VerificationDisplayProps) {
  
  // Processing State
  if (isProcessing) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 text-blue-600">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-lg font-medium">Verifying ticket...</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Please wait while we check the database</p>
      </div>
    )
  }

  // Empty State
  if (!result) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Scan className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Verify</h3>
        <p className="text-sm text-gray-600 mb-4">
          Scan QR code or enter ticket number manually to verify entry
        </p>
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Point camera at QR code for instant verification</p>
          <p>• Use manual entry if QR code is damaged</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Status Badge */}
      <div className="text-center">
        {result.canEnter ? (
          <div className="inline-flex items-center gap-3 bg-green-100 text-green-800 px-8 py-4 rounded-2xl text-xl font-bold border-2 border-green-300 shadow-sm">
            <CheckCircle className="h-8 w-8" />
            ENTRY ALLOWED
          </div>
        ) : (
          <div className="inline-flex items-center gap-3 bg-red-100 text-red-800 px-8 py-4 rounded-2xl text-xl font-bold border-2 border-red-300 shadow-sm">
            <XCircle className="h-8 w-8" />
            ENTRY DENIED
          </div>
        )}
      </div>

      {/* Result Message */}
      <div className="text-center">
        <p className={`text-lg font-medium ${result.canEnter ? 'text-green-700' : 'text-red-700'}`}>
          {result.message}
        </p>
      </div>

      {/* Ticket Details Card */}
      {result.ticket && (
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm space-y-4">
          
          {/* Ticket Number */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Ticket Number:</span>
            <code className="bg-blue-50 px-3 py-2 rounded-lg text-sm font-mono font-bold text-blue-700 border border-blue-200">
              {result.ticket.ticketNumber}
            </code>
          </div>

          {/* Customer Information */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg text-gray-900 truncate">
                {result.ticket.customerName}
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{result.ticket.email}</span>
              </div>
            </div>
          </div>

          {/* Customer Type & Access */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Customer Type:</span>
              <div className="flex items-center gap-2">
                {result.ticket.isEmsClient && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
                <Badge variant={result.ticket.isEmsClient ? "default" : "secondary"}>
                  {result.ticket.isEmsClient ? 'EMS Customer' : 'General Public'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Access Type:</span>
              <Badge variant="outline" className="font-medium">
                {result.ticket.ticketType}
              </Badge>
            </div>
          </div>

          {/* Check-in Information */}
          {result.checkIn && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <CheckCircle className="h-4 w-4" />
                <span>Successfully Checked In</span>
              </div>
              <div className="text-sm text-green-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Time: {formatTime(new Date(result.checkIn.timestamp))}</span>
                </div>
                <div>Location: {result.checkIn.location}</div>
                <div>Staff: {result.checkIn.checkedInBy}</div>
              </div>
            </div>
          )}

          {/* Additional Info for Denied Entry */}
          {!result.canEnter && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-700 space-y-1">
                <div className="font-medium">Entry denied because:</div>
                <div>• {result.message}</div>
                <div className="mt-2 text-xs">
                  Contact support if you believe this is an error.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onClear} variant="outline" className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          Clear & Scan Next
        </Button>
        
        {result.canEnter && (
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white px-6"
            onClick={() => {
              // Could add additional actions here like printing receipt
              console.log('Entry confirmed for:', result.ticket?.ticketNumber)
            }}
          >
            ✓ Confirm Entry
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
        Verification completed in {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}