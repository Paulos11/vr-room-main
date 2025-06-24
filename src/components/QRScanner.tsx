// src/components/QRScanner.tsx - QR Scanner Component

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, XCircle, CheckCircle, Timer, AlertTriangle } from 'lucide-react'
import { useQRScanner } from '../hooks/useQRScanner'
import type { QRScannerProps } from '../types/scanner'

export function QRScanner({ onScan, isProcessing, disabled = false }: QRScannerProps) {
  const { isScanning, isReady, scannerId, startScanning, stopScanning, error } = useQRScanner()

  const handleStartScanning = async () => {
    if (disabled || isProcessing) return
    
    try {
      await startScanning(onScan)
    } catch (error) {
      console.error('Failed to start scanning:', error)
      alert('Failed to start camera. Please ensure camera permissions are granted and refresh the page.')
    }
  }

  const handleStopScanning = async () => {
    try {
      await stopScanning()
    } catch (error) {
      console.error('Failed to stop scanning:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Scanner Container */}
      <div className="relative">
        <div 
          id={scannerId}
          className="w-full rounded-lg overflow-hidden bg-gray-100"
          style={{ minHeight: isScanning ? 'auto' : '300px' }}
        >
          {!isScanning && (
            <div className="flex items-center justify-center h-72 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 font-medium">
                  {!isReady && !error ? 'Initializing scanner...' :
                   error ? 'Scanner unavailable' :
                   'Ready to scan QR codes'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {!isReady && !error ? 'Please wait...' :
                   error ? 'Please refresh the page' :
                   'Click Start Scanner below'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Scanning Indicator */}
        {isScanning && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-500 text-white animate-pulse">
              🔴 LIVE SCANNING
            </Badge>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-blue-500 text-white">
              ⏳ PROCESSING
            </Badge>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {isScanning ? (
          <Button 
            onClick={handleStopScanning} 
            variant="outline" 
            className="flex-1"
            disabled={isProcessing}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Stop Scanner
          </Button>
        ) : (
          <Button 
            onClick={handleStartScanning} 
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!isReady || isProcessing || disabled || !!error}
          >
            <Camera className="mr-2 h-4 w-4" />
            {!isReady && !error ? 'Loading...' : 
             error ? 'Unavailable' : 
             'Start Scanner'}
          </Button>
        )}
      </div>

      {/* Status Messages */}
      {!isReady && !error && (
        <Alert className="bg-blue-50 border-blue-200">
          <Timer className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <strong>Loading scanner...</strong> Downloading QR detection library. This may take a few seconds on first load.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Scanner Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {isReady && !error && !isScanning && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Scanner Ready!</strong> Click "Start Scanner" and point camera at QR codes for instant detection.
          </AlertDescription>
        </Alert>
      )}

      {isScanning && (
        <Alert className="bg-blue-50 border-blue-200">
          <Camera className="h-4 w-4" />
          <AlertDescription>
            <strong>Scanning Active:</strong> Point camera at QR code. Keep phone steady and ensure good lighting.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}