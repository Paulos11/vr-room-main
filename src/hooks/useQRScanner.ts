// src/hooks/useQRScanner.ts - QR Scanner custom hook

import { useState, useEffect, useRef, useCallback } from 'react'
import { generateScannerId } from '../utils/scannerUtils'
import type { ScannerConfig } from '../types/scanner'

interface UseQRScannerReturn {
  isScanning: boolean
  isReady: boolean
  scannerId: string
  startScanning: (onScan: (data: string) => void) => Promise<void>
  stopScanning: () => Promise<void>
  error: string | null
}

export function useQRScanner(config?: Partial<ScannerConfig>): UseQRScannerReturn {
  const [isScanning, setIsScanning] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  const scannerId = useRef(generateScannerId())

  const defaultConfig: ScannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    disableFlip: false,
    ...config
  }

  // Initialize QR library
  useEffect(() => {
    let mounted = true

    const loadLibrary = async () => {
      try {
        // Check if already loaded
        if (typeof (window as any).Html5QrcodeScanner !== 'undefined') {
          console.log('✅ QR Scanner already available')
          if (mounted) setIsReady(true)
          return
        }

        // Check if script already exists
        if (document.querySelector('script[src*="html5-qrcode"]')) {
          // Wait for it to load
          const checkLoaded = () => {
            if (typeof (window as any).Html5QrcodeScanner !== 'undefined') {
              console.log('✅ QR Scanner loaded from existing script')
              if (mounted) setIsReady(true)
            } else {
              setTimeout(checkLoaded, 100)
            }
          }
          checkLoaded()
          return
        }

        // Load the library
        console.log('📦 Loading QR Scanner library...')
        
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js'
        
        script.onload = () => {
          console.log('✅ html5-qrcode loaded successfully')
          if (mounted) {
            setIsReady(true)
            setError(null)
          }
        }
        
        script.onerror = () => {
          console.warn('⚠️ Primary CDN failed, trying fallback...')
          
          // Fallback CDN
          const fallbackScript = document.createElement('script')
          fallbackScript.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/minified/html5-qrcode.min.js'
          
          fallbackScript.onload = () => {
            console.log('✅ html5-qrcode loaded from fallback CDN')
            if (mounted) {
              setIsReady(true)
              setError(null)
            }
          }
          
          fallbackScript.onerror = () => {
            console.error('❌ Failed to load QR scanner library from all CDNs')
            if (mounted) {
              setError('Failed to load QR scanner. Please refresh the page.')
            }
          }
          
          document.head.appendChild(fallbackScript)
        }
        
        document.head.appendChild(script)

      } catch (err) {
        console.error('❌ QR Scanner initialization error:', err)
        if (mounted) {
          setError('QR Scanner initialization failed')
        }
      }
    }

    loadLibrary()

    return () => {
      mounted = false
      stopScanning()
    }
  }, [])

  const startScanning = useCallback(async (onScan: (data: string) => void) => {
    if (!isReady || isScanning) {
      console.warn('⚠️ Scanner not ready or already scanning')
      return
    }

    try {
      const Html5QrcodeScanner = (window as any).Html5QrcodeScanner
      
      if (!Html5QrcodeScanner) {
        throw new Error('QR Scanner library not available')
      }

      // Clear any existing scanner
      const container = document.getElementById(scannerId.current)
      if (container) {
        container.innerHTML = ''
      }

      console.log('🚀 Starting QR Scanner...')

      scannerRef.current = new Html5QrcodeScanner(
        scannerId.current,
        {
          fps: defaultConfig.fps,
          qrbox: defaultConfig.qrbox,
          aspectRatio: defaultConfig.aspectRatio,
          disableFlip: defaultConfig.disableFlip,
          videoConstraints: {
            facingMode: 'environment'
          }
        },
        false
      )

      scannerRef.current.render(
        (decodedText: string) => {
          console.log('🎯 QR Code detected:', decodedText)
          onScan(decodedText)
        },
        (error: any) => {
          // Suppress common scanning errors (NotFoundException)
          if (!error.toString().includes('NotFoundException')) {
            console.log('📷 Scanning...', error.toString().substring(0, 50))
          }
        }
      )

      setIsScanning(true)
      setError(null)
      console.log('✅ QR Scanner started successfully')

    } catch (err) {
      console.error('❌ Failed to start scanner:', err)
      setError(`Failed to start scanner: ${err}`)
      throw err
    }
  }, [isReady, isScanning, defaultConfig])

  const stopScanning = useCallback(async () => {
    if (!scannerRef.current || !isScanning) {
      return
    }

    try {
      console.log('🛑 Stopping QR Scanner...')
      
      await scannerRef.current.stop()
      scannerRef.current.clear()
      scannerRef.current = null
      
      setIsScanning(false)
      console.log('✅ QR Scanner stopped successfully')

    } catch (err) {
      console.warn('⚠️ Error stopping scanner (ignored):', err)
      // Force reset state even if stop fails
      setIsScanning(false)
      scannerRef.current = null
    }
  }, [isScanning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return {
    isScanning,
    isReady,
    scannerId: scannerId.current,
    startScanning,
    stopScanning,
    error
  }
}