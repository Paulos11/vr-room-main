// src/components/admin/RegistrationsTable.tsx - Main component with proper types
'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'

import { StatsCards } from './StatsCards'
import { SearchFilters } from './SearchFilters'
import { RegistrationRow } from './RegistrationRow'
import { RegistrationDetailsModal } from './RegistrationDetailsModal'

// Define proper types
interface RegistrationData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'PAYMENT_PENDING'
  createdAt: string
  verifiedAt?: string
  verifiedBy?: string
  adminNotes?: string
  isEmsClient: boolean
  customerName?: string
  emsCustomerId?: string
  ticket?: {
    id: string
    ticketNumber: string
    status: string
    issuedAt: string
  }
  panelInterests: Array<{
    id: string
    panelType: string
    interestLevel: string
    status: string
    notes?: string
  }>
  emailLogs: Array<{
    id: string
    emailType: string
    status: string
    sentAt: string
  }>
}

interface StatsData {
  total: number
  pending: number
  completed: number
  rejected: number
  paymentPending: number
}

interface SearchFilters {
  search: string
  status: string
  page: number
  limit: number
}

export function RegistrationsTable() {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([])
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    paymentPending: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    status: 'all',
    page: 1,
    limit: 20
  })
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationData | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionNotes, setActionNotes] = useState('')

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: filters.search,
        status: filters.status === 'all' ? '' : filters.status,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })

      const response = await fetch(`/api/admin/registrations?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setRegistrations(result.data.registrations)
        setStats(result.data.stats)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch registrations",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [filters])

  const handleAction = async (registrationId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingAction(registrationId)
    try {
      const response = await fetch('/api/admin/approve-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          action,
          notes: actionNotes
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Registration ${action.toLowerCase()}d successfully`,
        })
        
        // Update the registration in the list with proper types
        setRegistrations((prev: RegistrationData[]) => prev.map((reg: RegistrationData) => 
          reg.id === registrationId 
            ? { 
                ...reg, 
                status: action === 'APPROVE' ? 'COMPLETED' as const : 'REJECTED' as const,
                verifiedAt: new Date().toISOString(),
                adminNotes: actionNotes || reg.adminNotes,
                ticket: result.data?.ticket || reg.ticket
              }
            : reg
        ))
        
        setDialogOpen(false)
        setSelectedRegistration(null)
        setActionNotes('')
        
        // Refresh stats
        fetchRegistrations()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update registration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update registration",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleView = (registrationId: string) => {
    const registration = registrations.find((r: RegistrationData) => r.id === registrationId)
    if (registration) {
      setSelectedRegistration(registration)
      setActionNotes(registration.adminNotes || '')
      setDialogOpen(true)
    }
  }

  return (
    <div className="space-y-4">
      <StatsCards stats={stats} loading={loading} />
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Registrations</CardTitle>
          <CardDescription>
            Manage client registrations and verification process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchFilters
            search={filters.search}
            status={filters.status}
            onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value, page: 1 }))}
            onStatusChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
          />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="py-2 text-xs">Customer</TableHead>
                  <TableHead className="py-2 text-xs">Contact</TableHead>
                  <TableHead className="py-2 text-xs">Type</TableHead>
                  <TableHead className="py-2 text-xs">Status</TableHead>
                  <TableHead className="py-2 text-xs">Ticket</TableHead>
                  <TableHead className="py-2 text-xs">Panel Interest</TableHead>
                  <TableHead className="py-2 text-xs">Registered</TableHead>
                  <TableHead className="py-2 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j} className="py-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  registrations.map((registration: RegistrationData) => (
                    <RegistrationRow
                      key={registration.id}
                      registration={registration}
                      onView={handleView}
                      onApprove={(id) => handleAction(id, 'APPROVE')}
                      onReject={(id) => handleAction(id, 'REJECT')}
                      processing={processingAction === registration.id}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && registrations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No registrations found.
            </div>
          )}
        </CardContent>
      </Card>

      <RegistrationDetailsModal
        registration={selectedRegistration}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApprove={(id) => handleAction(id, 'APPROVE')}
        onReject={(id) => handleAction(id, 'REJECT')}
        processing={processingAction === selectedRegistration?.id}
        notes={actionNotes}
        onNotesChange={setActionNotes}
      />
    </div>
  )
}