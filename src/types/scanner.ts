// src/types/scanner.ts - Type definitions

export interface TicketData {
  ticketNumber: string
  customerName: string
  email: string
  phone?: string
  isEmsClient: boolean
  ticketType: string
  status: string
  eventDate?: string
  venue?: string
}

export interface VerificationResult {
  success: boolean
  canEnter: boolean
  message: string
  ticket?: TicketData
  checkIn?: {
    timestamp: string
    location: string
    checkedInBy: string
  }
}

export interface ScannerStats {
  scansToday: number
  validEntries: number
  deniedEntries: number
  duplicateScans: number
  lastScanTime: Date | null
}

export interface ScannerConfig {
  fps: number
  qrbox: { width: number; height: number }
  aspectRatio: number
  disableFlip: boolean
}

export interface QRScannerProps {
  onScan: (qrData: string) => void
  isProcessing: boolean
  disabled?: boolean
}

export interface ManualEntryProps {
  onSubmit: (ticketNumber: string) => void
  isProcessing: boolean
  disabled?: boolean
}

export interface VerificationDisplayProps {
  result: VerificationResult | null
  isProcessing: boolean
  onClear: () => void
}

export interface StatsCardProps {
  stats: ScannerStats
}

export interface HeaderProps {
  staffName: string
  onStaffNameChange: (name: string) => void
  stats: ScannerStats
}