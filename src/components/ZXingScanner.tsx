// src/components/ZXingScanner.tsx - Fixed ZXing Scanner (No Label Error)

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, XCircle, CheckCircle, AlertTriangle, Zap } from 'lucide-react'

interface ZXingScannerProps {
  onScan: (qrData: string) => void
  isProcessing: boolean
  disabled?: boolean
}

export function ZXingScanner({ onScan, isProcessing, disabled = false }: ZXingScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<any>(null)

  // Load ZXing library
  useEffect(() => {
    let mounted = true

    const loadZXing = async () => {
      try {
        // Check if already loaded
        if ((window as any).ZXing) {
          console.log('✅ ZXing already loaded')
          initializeReader()
          return
        }

        console.log('📦 Loading ZXing-JS library...')
        
        // Load ZXing from CDN
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/@zxing/library@latest/umd/index.min.js'
        
        script.onload = () => {
          console.log('✅ ZXing loaded successfully')
          if (mounted) {
            initializeReader()
          }
        }
        
        script.onerror = () => {
          console.warn('⚠️ Primary CDN failed, trying jsdelivr...')
          
          // Fallback CDN
          const fallbackScript = document.createElement('script')
          fallbackScript.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@latest/umd/index.min.js'
          
          fallbackScript.onload = () => {
            console.log('✅ ZXing loaded from fallback')
            if (mounted) {
              initializeReader()
            }
          }
          
          fallbackScript.onerror = () => {
            console.error('❌ Failed to load ZXing from all CDNs')
            if (mounted) {
              setError('Failed to load QR scanner library')
            }
          }
          
          document.head.appendChild(fallbackScript)
        }
        
        document.head.appendChild(script)

      } catch (err) {
        console.error('❌ ZXing loading error:', err)
        if (mounted) {
          setError('QR Scanner initialization failed')
        }
      }
    }

    const initializeReader = () => {
      try {
        const ZXing = (window as any).ZXing
        if (ZXing) {
          readerRef.current = new ZXing.BrowserQRCodeReader()
          console.log('✅ ZXing reader initialized')
          setIsReady(true)
          setError(null)
        }
      } catch (err) {
        console.error('❌ Reader initialization failed:', err)
        setError('QR reader initialization failed')
      }
    }

    loadZXing()

    return () => {
      mounted = false
      stopScanning()
    }
  }, [])

  const startScanning = useCallback(async () => {
    if (!isReady || isScanning || !readerRef.current) {
      console.warn('⚠️ Scanner not ready')
      return
    }

    try {
      console.log('🚀 Starting ZXing scanner...')

      // Get video devices
      const videoInputDevices = await readerRef.current.listVideoInputDevices()
      console.log('📷 Available cameras:', videoInputDevices.length)

      // Safely select camera device
      let selectedDeviceId = null

      if (videoInputDevices.length > 0) {
        // Default to first device
        selectedDeviceId = videoInputDevices[0].deviceId

        // Try to find back camera (safely check label)
        const backCamera = videoInputDevices.find((device: any) => {
          const label = device.label || ''
          return label.toLowerCase().includes('back') || 
                 label.toLowerCase().includes('rear') ||
                 label.toLowerCase().includes('environment')
        })
        
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId
          console.log('📱 Using back camera:', backCamera.label || 'Unknown')
        } else {
          console.log('📱 Using camera:', videoInputDevices[0].label || 'Camera 1')
        }
      }

      if (!selectedDeviceId) {
        throw new Error('No camera devices found')
      }

      // Start decoding from video device
      await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result: any, error: any) => {
          if (result) {
            console.log('🎯 ZXing QR detected:', result.text)
            onScan(result.text)
          }
          // Suppress "not found" errors as they're normal during scanning
          if (error && !error.message.includes('NotFoundException')) {
            console.log('Scanning...', error.message?.substring(0, 50) || 'Scanning error')
          }
        }
      )

      setIsScanning(true)
      setError(null)
      console.log('✅ ZXing scanner started successfully')

    } catch (err: any) {
      console.error('❌ Scanner start failed:', err)
      setError(`Failed to start scanner: ${err.message || err}`)
      throw err
    }
  }, [isReady, isScanning, onScan])

  const stopScanning = useCallback(async () => {
    if (!isScanning || !readerRef.current) return

    try {
      console.log('🛑 Stopping ZXing scanner...')
      
      await readerRef.current.reset()

      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setIsScanning(false)
      console.log('✅ ZXing scanner stopped')

    } catch (err) {
      console.warn('⚠️ Stop scanner error (ignored):', err)
      setIsScanning(false)
    }
  }, [isScanning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.reset().catch(() => {})
      }
    }
  }, [])

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
            className="w-full"
            style={{ 
              height: isScanning ? 'auto' : '300px',
              minHeight: '300px',
              maxHeight: '500px',
              objectFit: 'cover'
            }}
          />

          {/* Placeholder when not scanning */}
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
              <div className="text-center text-white">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  {error ? (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  ) : !isReady ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  ) : (
                    <Camera className="h-8 w-8 text-blue-500" />
                  )}
                </div>
                <p className="font-medium mb-2">
                  {error ? 'Scanner Error' :
                   !isReady ? 'Loading ZXing Scanner...' :
                   'Ready to Scan QR Codes'}
                </p>
                <p className="text-sm opacity-90">
                  {error ? 'Please refresh the page' :
                   !isReady ? 'Professional QR detection library' :
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
              
              {/* Status Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                <Badge className="bg-green-500 text-white animate-pulse">
                  🎯 ZXING SCANNING
                </Badge>
                {isProcessing && (
                  <Badge className="bg-blue-500 text-white">
                    ⏳ PROCESSING
                  </Badge>
                )}
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 text-white text-sm p-3 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">ZXing Professional Scanner</span>
                  </div>
                  <div className="text-xs opacity-90">
                    Point camera at QR code • Auto-detects instantly • Works on all devices
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
            onClick={stopScanning} 
            variant="outline" 
            className="flex-1"
            disabled={isProcessing}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Stop Scanner
          </Button>
        ) : (
          <Button 
            onClick={startScanning} 
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!isReady || isProcessing || disabled || !!error}
          >
            <Camera className="mr-2 h-4 w-4" />
            {!isReady && !error ? 'Loading ZXing...' : 
             error ? 'Scanner Error' : 
             'Start ZXing Scanner'}
          </Button>
        )}
      </div>

      {/* Status Messages */}
      {!isReady && !error && (
        <Alert className="bg-blue-50 border-blue-200">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <AlertDescription>
            <strong>Loading ZXing-JS...</strong> Professional QR code detection library loading...
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
            <strong>ZXing Ready!</strong> Professional QR scanner loaded and ready to detect codes.
          </AlertDescription>
        </Alert>
      )}

      {isScanning && (
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Scanning Active:</strong> ZXing is actively detecting QR codes. Point camera at any QR code for instant detection.
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
        <div className="font-medium mb-1">Scanner Details:</div>
        <div className="space-y-1">
          <div>• Library: ZXing-JS (Google's QR library)</div>
          <div>• Status: {isReady ? '✅ Ready' : error ? '❌ Error' : '⏳ Loading'}</div>
          <div>• Scanning: {isScanning ? '🎯 Active' : '⏸️ Stopped'}</div>
          <div>• Mobile Support: ✅ Excellent</div>
        </div>
      </div>
    </div>
  )
}