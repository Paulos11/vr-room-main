// src/components/FastQRScanner.tsx - Fast Native QR Scanner Component

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, XCircle, CheckCircle, Timer, AlertTriangle, Zap } from 'lucide-react'
import { useNativeQRScanner } from '../hooks/useNativeQRScanner'

interface FastQRScannerProps {
  onScan: (qrData: string) => void
  isProcessing: boolean
  disabled?: boolean
}

export function FastQRScanner({ onScan, isProcessing, disabled = false }: FastQRScannerProps) {
  const { 
    isScanning, 
    isReady, 
    videoRef, 
    canvasRef, 
    startScanning, 
    stopScanning, 
    error 
  } = useNativeQRScanner()

  const handleStartScanning = async () => {
    if (disabled || isProcessing) return
    
    try {
      await startScanning(onScan)
    } catch (error) {
      console.error('Failed to start scanning:', error)
      alert('Failed to start camera. Please ensure camera permissions are granted.')
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
        <div className="w-full rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
          
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full ${isScanning ? 'block' : 'hidden'}`}
            style={{ height: isScanning ? 'auto' : '0px', minHeight: isScanning ? '300px' : '0px' }}
          />

          {/* Hidden Canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Placeholder when not scanning */}
          {!isScanning && (
            <div className="flex items-center justify-center h-72 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  {error ? (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  ) : !isReady ? (
                    <Timer className="h-8 w-8 text-blue-500 animate-spin" />
                  ) : (
                    <Camera className="h-8 w-8 text-blue-500" />
                  )}
                </div>
                <p className="text-gray-600 font-medium">
                  {error ? 'Scanner unavailable' :
                   !isReady ? 'Initializing scanner...' :
                   'Ready to scan QR codes'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {error ? 'Please refresh the page' :
                   !isReady ? 'Please wait...' :
                   'Click Start Scanner below'}
                </p>
              </div>
            </div>
          )}

          {/* Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Scanning Frame */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-green-500 rounded-2xl">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-green-400 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-green-400 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-green-400 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-green-400 rounded-br-xl"></div>
              </div>
              
              {/* Scanning Line */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-green-400 animate-pulse"></div>
              
              {/* Status Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                <Badge className="bg-green-500 text-white animate-pulse">
                  🎯 SCANNING
                </Badge>
                {isProcessing && (
                  <Badge className="bg-blue-500 text-white">
                    ⏳ PROCESSING
                  </Badge>
                )}
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 text-white text-sm p-3 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Fast Scanner Active</span>
                  </div>
                  <div className="text-xs opacity-90">
                    Point camera at QR code • Hold steady • Good lighting
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
             'Start Fast Scanner'}
          </Button>
        )}
      </div>

      {/* Status Messages */}
      {!isReady && !error && (
        <Alert className="bg-blue-50 border-blue-200">
          <Timer className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <strong>Initializing...</strong> Setting up native QR detection. This is much faster than library loading!
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
            <strong>Fast Scanner Ready!</strong> Using native browser QR detection for instant results.
          </AlertDescription>
        </Alert>
      )}

      {isScanning && (
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Live Scanning:</strong> Point camera directly at QR code. Detection is automatic and instant.
          </AlertDescription>
        </Alert>
      )}

      {/* Technical Info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
        <div className="font-medium mb-1">Scanner Info:</div>
        <div className="space-y-1">
          <div>• Method: {typeof (window as any).BarcodeDetector !== 'undefined' ? 'Native BarcodeDetector' : 'Canvas-based'}</div>
          <div>• Status: {isReady ? '✅ Ready' : error ? '❌ Error' : '⏳ Loading'}</div>
          <div>• Performance: Native detection = Instant, No library loading</div>
        </div>
      </div>
    </div>
  )
}