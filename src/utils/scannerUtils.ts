// src/utils/scannerUtils.ts - Utility functions

/**
 * Extract ticket number from various QR code formats
 */
export function extractTicketNumber(qrData: string): string | null {
  try {
    // Method 1: Direct ticket number
    if (qrData.startsWith('TKT-')) {
      return qrData.trim()
    }

    // Method 2: URL format (/verify/TKT-2025-ABC123)
    if (qrData.includes('verify/')) {
      const match = qrData.match(/verify\/([^?&]+)/)
      return match ? match[1].trim() : null
    }

    // Method 3: JSON format
    if (qrData.startsWith('{')) {
      const data = JSON.parse(qrData)
      return data.ticketNumber || data.ticket || null
    }

    // Method 4: Pattern matching (TKT-YYYY-XXXXXX)
    const ticketMatch = qrData.match(/TKT-\d{4}-[A-Z0-9]{6,8}/)
    return ticketMatch ? ticketMatch[0] : null

  } catch (error) {
    console.error('QR extraction error:', error)
    return null
  }
}

/**
 * Validate ticket number format
 */
export function validateTicketNumber(ticketNumber: string): boolean {
  const pattern = /^TKT-\d{4}-[A-Z0-9]{6,8}$/
  return pattern.test(ticketNumber.trim())
}

/**
 * Play audio feedback for scan results
 */
export function playAudioFeedback(type: 'success' | 'error' | 'warning'): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    switch (type) {
      case 'success':
        // Happy beep: 800Hz -> 1000Hz
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.3)
        break
        
      case 'error':
        // Error beep: 400Hz -> 300Hz (longer)
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.15)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.5)
        break
        
      case 'warning':
        // Warning beep: 600Hz (short)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.2)
        break
    }
  } catch (error) {
    console.log('Audio not supported:', error)
  }
}

/**
 * Format date/time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Format scan count with proper pluralization
 */
export function formatScanCount(count: number): string {
  return `${count} scan${count !== 1 ? 's' : ''}`
}

/**
 * Generate unique element ID for scanner
 */
export function generateScannerId(): string {
  return `qr-scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if device has camera support
 */
export async function checkCameraSupport(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some(device => device.kind === 'videoinput')
  } catch (error) {
    console.error('Camera check failed:', error)
    return false
  }
}

/**
 * Request camera permissions
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop()) // Release immediately
    return true
  } catch (error) {
    console.error('Camera permission denied:', error)
    return false
  }
}