// src/types/index.ts
import { Registration, Ticket, PanelInterest, AdminUser, EmailLog, Payment } from '@prisma/client'

export type RegistrationWithRelations = Registration & {
  tickets: Ticket[]
  panelInterests: PanelInterest[]
  emailLogs: EmailLog[]
  payment?: Payment
}

export type TicketWithRegistration = Ticket & {
  registration: Registration
}

export type PanelInterestWithRegistration = PanelInterest & {
  registration: Registration
}

export type PaymentWithRegistration = Payment & {
  registration: Registration
}

export interface DashboardStats {
  totalRegistrations: number
  pendingVerifications: number
  verifiedRegistrations: number
  completedRegistrations: number
  ticketsGenerated: number
  panelInterests: number
  recentRegistrations: Registration[]
  paymentStats: {
    totalPaid: number
    pendingPayments: number
    failedPayments: number
  }
}

export interface EventInfo {
  name: string
  startDate: string
  endDate: string
  venue: string
  address: string
  boothLocation: string
}

export interface PanelInfo {
  id: string
  name: string
  description: string
  features: string[]
  price?: string
  image?: string
}

export interface ActivityInfo {
  id: string
  name: string
  description: string
  time?: string
  image?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  variables: string[]
}

export interface TicketData {
  ticketNumber: string
  registrationName: string
  eventName: string
  eventDates: string
  venue: string
  boothLocation: string
  qrCode: string
  instructions: string
  accessType: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

// Form types for components
export interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  isEmsClient?: boolean
  companyName?: string
  emsCustomerId?: string
  accountManager?: string
  panelInterest?: boolean
  panelType?: string
  interestLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT'
  estimatedBudget?: string
  timeframe?: string
  notes?: string
  acceptTerms: boolean
}

export interface SearchFilters {
  search?: string
  status?: string
  isEmsClient?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

// Admin interface types
export interface AdminStats {
  totalRegistrations: number
  byStatus: Record<string, number>
  ticketStats: Record<string, number>
  paymentStats: Record<string, number>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: Date
  }>
}

export interface TicketValidation {
  valid: boolean
  message: string
  ticket?: TicketWithRegistration
  qrData?: any
}

// Configuration types
export interface AppConfig {
  event: EventInfo
  panels: PanelInfo[]
  activities: ActivityInfo[]
  emailTemplates: EmailTemplate[]
}

// Enum types for better type safety
export type RegistrationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAYMENT_PENDING' | 'COMPLETED'
export type TicketStatus = 'GENERATED' | 'SENT' | 'COLLECTED' | 'USED' | 'EXPIRED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type AccessType = 'STANDARD' | 'VIP' | 'PRESS' | 'EXHIBITOR'
export type InterestLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATING' | 'CONVERTED' | 'LOST' | 'CLOSED'
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'BOOTH_STAFF' | 'SALES_MANAGER'
export type EmailType = 'REGISTRATION_CONFIRMATION' | 'ADMIN_APPROVAL_NEEDED' | 'REGISTRATION_APPROVED' | 'REGISTRATION_REJECTED' | 'PAYMENT_REQUIRED' | 'PAYMENT_CONFIRMATION' | 'TICKET_DELIVERY' | 'EVENT_REMINDER' | 'PANEL_FOLLOWUP' | 'CHECK_IN_CONFIRMATION'
export type EmailStatus = 'SENT' | 'FAILED' | 'OPENED' | 'CLICKED' | 'BOUNCED'