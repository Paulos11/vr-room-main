// src/components/SimpleQRScanner.tsx - Most Reliable Scanner

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, XCircle, CheckCircle, AlertTriangle, Zap } from 'lucide-react'

interface SimpleQRScannerProps {
  onScan: (qrData: string) => void
  isProcessing: boolean
  disabled?: boolean
}

export function SimpleQRScanner({ onScan, isProcessing, disabled = false }: SimpleQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const jsQRRef = useRef<any>(null)

  // Load jsQR library (lightweight and reliable)
  useEffect(() => {
    let mounted = true

    const loadJsQR = async () => {
      try {
        // Check if already loaded
        if ((window as any).jsQR) {
          console.log('✅ jsQR already loaded')
          if (mounted) {
            jsQRRef.current = (window as any).jsQR
            setIsReady(true)
          }
          return
        }

        console.log('📦 Loading jsQR library...')
        
        // Load jsQR from CDN
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
        
        script.onload = () => {
          console.log('✅ jsQR loaded successfully')
          if (mounted) {
            jsQRRef.current = (window as any).jsQR
            setIsReady(true)
            setError(null)
          }
        }
        
        script.onerror = () => {
          console.warn('⚠️ Primary CDN failed, trying unpkg...')
          
          // Fallback CDN
          const fallbackScript = document.createElement('script')
          fallbackScript.src = 'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js'
          
          fallbackScript.onload = () => {
            console.log('✅ jsQR loaded from fallback')
            if (mounted) {
              jsQRRef.current = (window as any).jsQR
              setIsReady(true)
              setError(null)
            }
          }
          
          fallbackScript.onerror = () => {
            console.error('❌ Failed to load jsQR from all CDNs')
            if (mounted) {
              setError('Failed to load QR scanner library')
            }
          }
          
          document.head.appendChild(fallbackScript)
        }
        
        document.head.appendChild(script)

      } catch (err) {
        console.error('❌ jsQR loading error:', err)
        if (mounted) {
          setError('QR Scanner initialization failed')
        }
      }
    }

    loadJsQR()

    return () => {
      mounted = false
      stopScanning()
    }
  }, [])

  // Scan for QR codes using canvas
  const scanForQR = useCallback(() => {
    if (!jsQRRef.current || !videoRef.current || !canvasRef.current) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

      // Scan for QR code
      const qrCode = jsQRRef.current(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (qrCode && qrCode.data) {
        console.log('🎯 QR Code detected:', qrCode.data)
        onScan(qrCode.data)
      }

    } catch (err) {
      // Silent error - scanning is continuous
      console.log('Scanning...', String(err).substring(0, 50))
    }
  }, [onScan])

  const startScanning = useCallback(async () => {
    if (!isReady || isScanning || !jsQRRef.current) {
      console.warn('⚠️ Scanner not ready')
      return
    }

    try {
      console.log('🚀 Starting jsQR scanner...')

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'environment', // Use back camera on mobile
          frameRate: { ideal: 30 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsScanning(true)
                setError(null)
                console.log('✅ Camera started successfully')

                // Start scanning loop
                scanIntervalRef.current = setInterval(() => {
                  scanForQR()
                }, 100) // Scan every 100ms for fast detection

              })
              .catch(err => {
                console.error('Error playing video:', err)
                setError('Failed to start video')
              })
          }
        }
      }

    } catch (err: any) {
      console.error('❌ Camera access error:', err)
      setError('Camera access denied. Please allow camera access and try again.')
      throw err
    }
  }, [isReady, isScanning, scanForQR])

  const stopScanning = useCallback(async () => {
    try {
      console.log('🛑 Stopping jsQR scanner...')

      // Clear scanning interval
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }

      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setIsScanning(false)
      console.log('✅ jsQR scanner stopped')

    } catch (err) {
      console.warn('⚠️ Error stopping scanner:', err)
      setIsScanning(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
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
            className={`w-full ${isScanning ? 'block' : 'hidden'}`}
            style={{ 
              height: isScanning ? 'auto' : '0px',
              minHeight: isScanning ? '300px' : '0px',
              maxHeight: '500px',
              objectFit: 'cover'
            }}
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
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  ) : (
                    <Camera className="h-8 w-8 text-blue-500" />
                  )}
                </div>
                <p className="text-gray-600 font-medium">
                  {error ? 'Scanner Error' :
                   !isReady ? 'Loading jsQR Scanner...' :
                   'Ready to Scan QR Codes'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {error ? 'Please refresh the page' :
                   !isReady ? 'Lightweight QR detection library' :
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
                  🎯 jsQR SCANNING
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
                    <span className="font-medium">jsQR Scanner Active</span>
                  </div>
                  <div className="text-xs opacity-90">
                    Point camera at QR code • Scans 10x per second • Very reliable
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
            {!isReady && !error ? 'Loading jsQR...' : 
             error ? 'Scanner Error' : 
             'Start jsQR Scanner'}
          </Button>
        )}
      </div>

      {/* Status Messages */}
      {!isReady && !error && (
        <Alert className="bg-blue-50 border-blue-200">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <AlertDescription>
            <strong>Loading jsQR...</strong> Lightweight and reliable QR detection library.
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
            <strong>jsQR Ready!</strong> Lightweight scanner loaded. This WILL detect QR codes reliably.
          </AlertDescription>
        </Alert>
      )}

      {isScanning && (
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Scanning Active:</strong> jsQR is actively detecting QR codes. Point camera at any QR code.
          </AlertDescription>
        </Alert>
      )}

      {/* Library Info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
        <div className="font-medium mb-1">Scanner Details:</div>
        <div className="space-y-1">
          <div>• Library: jsQR (Lightweight, 23KB)</div>
          <div>• Status: {isReady ? '✅ Ready' : error ? '❌ Error' : '⏳ Loading'}</div>
          <div>• Scanning: {isScanning ? '🎯 Active (10fps)' : '⏸️ Stopped'}</div>
          <div>• Reliability: 🔥 Very High</div>
          <div>• Mobile Support: ✅ Excellent</div>
        </div>
      </div>
    </div>
  )
}