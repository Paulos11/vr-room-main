// src/types/index.ts
import { Client, Ticket, PanelInterest, AdminUser, EmailLog } from '@prisma/client'

export type ClientWithRelations = Client & {
  tickets: Ticket[]
  panelInterests: PanelInterest[]
  emailLogs: EmailLog[]
}

export type TicketWithClient = Ticket & {
  client: Client
}

export type PanelInterestWithClient = PanelInterest & {
  client: Client
}

export interface DashboardStats {
  totalRegistrations: number
  pendingVerifications: number
  verifiedClients: number
  ticketsGenerated: number
  panelInterests: number
  recentRegistrations: Client[]
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
  clientName: string
  eventName: string
  eventDates: string
  venue: string
  boothLocation: string
  qrCode: string
  instructions: string
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
  idNumber: string
  panelInterest?: boolean
  panelType?: string
  interestLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
  acceptTerms: boolean
}

export interface SearchFilters {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

// Configuration types
export interface AppConfig {
  event: EventInfo
  panels: PanelInfo[]
  activities: ActivityInfo[]
  emailTemplates: EmailTemplate[]
}