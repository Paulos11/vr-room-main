// src/components/admin/RegistrationsTable.tsx - Improved with EMS colors and better performance
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'

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

interface SearchFilters {
  search: string
  status: string
  page: number
  limit: number
}

export function RegistrationsTable() {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    status: 'all',
    page: 1,
    limit: 50
  })
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationData | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionNotes, setActionNotes] = useState('')

  // Debounced search to reduce API calls
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: filters.search,
        status: filters.status === 'all' ? '' : filters.status,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })

      const response = await fetch(`/api/admin/registrations?${params}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setRegistrations(result.data.registrations || [])
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
  }, [filters])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const handleSearchChange = useCallback((value: string) => {
    // Clear existing debounce
    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }

    // Set new debounce
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }))
    }, 300)

    setSearchDebounce(timeout)
  }, [searchDebounce])

  const handleStatusChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, status: value, page: 1 }))
  }, [])

  const handleAction = useCallback(async (registrationId: string, action: 'APPROVE' | 'REJECT') => {
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
        
        // Optimistic update for faster UI response
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
        
        // Refresh in background
        setTimeout(fetchRegistrations, 500)
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
  }, [actionNotes, fetchRegistrations])

  const handleView = useCallback((registrationId: string) => {
    const registration = registrations.find((r: RegistrationData) => r.id === registrationId)
    if (registration) {
      setSelectedRegistration(registration)
      setActionNotes(registration.adminNotes || '')
      setDialogOpen(true)
    }
  }, [registrations])

  // Memoized statistics for better performance
  const statistics = useMemo(() => {
    return registrations.reduce((acc, reg) => {
      acc.total = registrations.length
      acc[reg.status.toLowerCase() as keyof typeof acc] = (acc[reg.status.toLowerCase() as keyof typeof acc] || 0) + 1
      return acc
    }, {
      total: 0,
      pending: 0,
      completed: 0,
      rejected: 0,
      payment_pending: 0
    })
  }, [registrations])

  return (
    <div className="space-y-1">
      {/* Header with EMS colors */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
       
        
        {/* Quick stats in header */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Total: <strong>{statistics.total}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Pending: <strong>{statistics.pending}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Approved: <strong>{statistics.completed}</strong></span>
          </div>
        </div>
      </div>
      
      <Card className="shadow-sm border-green-100">
       
        <CardContent className="p-0">
          {/* Search filters with better styling */}
          <div className="p-6 bg-gray-50/50 border-b">
            <SearchFilters
              search={filters.search}
              status={filters.status}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
            />
          </div>

          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-green-200">
                  <TableHead className="py-3 text-sm font-semibold text-gray-700">Customer</TableHead>
                  <TableHead className="py-3 text-sm font-semibold text-gray-700">Contact</TableHead>
                  <TableHead className="py-3 text-sm font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="py-3 text-sm font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="py-3 text-sm font-semibold text-gray-700">Ticket</TableHead>
                  <TableHead className="py-3 text-sm font-semibold text-gray-700">Solar Interest</TableHead>
                  <TableHead className="py-3 text-sm font-semibold text-gray-700">Registered</TableHead>
                  <TableHead className="py-3 text-sm font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Enhanced loading skeleton
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j} className="py-4">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : registrations.length > 0 ? (
                  registrations.map((registration: RegistrationData, index) => (
                    <RegistrationRow
                      key={registration.id}
                      registration={registration}
                      onView={handleView}
                      onApprove={(id) => handleAction(id, 'APPROVE')}
                      onReject={(id) => handleAction(id, 'REJECT')}
                      processing={processingAction === registration.id}
                      index={index}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-2xl">📋</span>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">No registrations found</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {filters.search || filters.status !== 'all' 
                              ? 'Try adjusting your search filters' 
                              : 'Registrations will appear here when customers sign up'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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