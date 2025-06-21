// src/components/admin/RegistrationsTable.tsx - Optimized with Add User functionality
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Plus, RefreshCw, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'

import { SearchFilters } from './SearchFilters'
import { RegistrationRow } from './RegistrationRow'
import { RegistrationDetailsModal } from './RegistrationDetailsModal'
import { AddUserDialog } from './AddUserDialog'

// Optimized interface with minimal data
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
  companyName?: string
  emsCustomerId?: string
  ticketCount: number
  tickets: Array<{
    id: string
    ticketNumber: string
    status: string
    issuedAt: string
    ticketSequence: number
  }>
  panelInterests: Array<{
    id: string
    panelType: string
    interestLevel: string
    status: string
    notes?: string
  }>
  latestEmail?: {
    emailType: string
    status: string
    sentAt: string
  }
}

interface SearchFilters {
  search: string
  status: string
  page: number
  limit: number
}

// Memoized status statistics component
const StatusStats = React.memo(({ stats }: { stats: any }) => (
  <div className="flex flex-wrap gap-4 text-sm">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full shadow-sm"></div>
      <span className="text-gray-700">Total: <strong className="text-gray-900">{stats.total}</strong></span>
    </div>
    <div className="flex items-center gap-2">
      <Clock className="w-3 h-3 text-orange-500" />
      <span className="text-gray-700">Pending: <strong className="text-orange-600">{stats.pending}</strong></span>
    </div>
    <div className="flex items-center gap-2">
      <CheckCircle className="w-3 h-3 text-green-500" />
      <span className="text-gray-700">Approved: <strong className="text-green-600">{stats.completed}</strong></span>
    </div>
    {stats.paymentPending > 0 && (
      <div className="flex items-center gap-2">
        <AlertCircle className="w-3 h-3 text-blue-500" />
        <span className="text-gray-700">Payment Due: <strong className="text-blue-600">{stats.paymentPending}</strong></span>
      </div>
    )}
  </div>
))

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
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [actionNotes, setActionNotes] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Debounced search to reduce API calls
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)

  // Optimized fetch with caching strategy
  const fetchRegistrations = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true)
      else setLoading(true)

      const params = new URLSearchParams({
        search: filters.search,
        status: filters.status === 'all' ? '' : filters.status,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })

      const response = await fetch(`/api/admin/registrations?${params}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
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
      setRefreshing(false)
    }
  }, [filters])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  // Optimized search with better debouncing
  const handleSearchChange = useCallback((value: string) => {
    if (searchDebounce) clearTimeout(searchDebounce)
    
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }))
    }, 250) // Reduced from 300ms to 250ms for faster response
    
    setSearchDebounce(timeout)
  }, [searchDebounce])

  const handleStatusChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, status: value, page: 1 }))
  }, [])

  // Optimized action handler with better error handling
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
          description: `Registration ${action.toLowerCase()}ed successfully`,
        })
        
        // Optimistic update for instant UI feedback
        setRegistrations(prev => prev.map(reg => 
          reg.id === registrationId 
            ? { 
                ...reg, 
                status: action === 'APPROVE' ? 'COMPLETED' as const : 'REJECTED' as const,
                verifiedAt: new Date().toISOString(),
                adminNotes: actionNotes || reg.adminNotes,
                tickets: result.data?.tickets || reg.tickets,
                ticketCount: result.data?.tickets?.length || reg.ticketCount
              }
            : reg
        ))
        
        setDialogOpen(false)
        setSelectedRegistration(null)
        setActionNotes('')
        
        // Background refresh after a short delay
        setTimeout(() => fetchRegistrations(), 1000)
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
    const registration = registrations.find(r => r.id === registrationId)
    if (registration) {
      setSelectedRegistration(registration)
      setActionNotes(registration.adminNotes || '')
      setDialogOpen(true)
    }
  }, [registrations])

  const handleRefresh = useCallback(() => {
    fetchRegistrations(true)
  }, [fetchRegistrations])

  // Memoized statistics for better performance
  const statistics = useMemo(() => {
    return registrations.reduce((acc, reg) => {
      acc.total = registrations.length
      const statusKey = reg.status.toLowerCase() as keyof typeof acc
      if (typeof acc[statusKey] === 'number') {
        acc[statusKey] = (acc[statusKey] as number) + 1
      }
      return acc
    }, {
      total: 0,
      pending: 0,
      completed: 0,
      rejected: 0,
      payment_pending: 0
    })
  }, [registrations])

  // Memoized loading skeleton
  const LoadingSkeleton = useMemo(() => (
    Array.from({ length: 8 }).map((_, i) => (
      <TableRow key={i} className="animate-pulse">
        {Array.from({ length: 8 }).map((_, j) => (
          <TableCell key={j} className="py-4">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer"></div>
          </TableCell>
        ))}
      </TableRow>
    ))
  ), [])

  return (
    <div className="space-y-4">
      {/* Enhanced Header with better visual hierarchy */}
      <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 p-6 rounded-xl border border-green-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
              Registration Management
            </h2>
            <p className="text-gray-600 mt-1">
              Manage event registrations, approvals, and ticket generation
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-green-50 hover:border-green-300 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => setAddUserOpen(true)}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-sm transition-all duration-200"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
        
        <StatusStats stats={{
          total: statistics.total,
          pending: statistics.pending,
          completed: statistics.completed,
          paymentPending: statistics.payment_pending
        }} />
      </div>
      
      <Card className="shadow-sm border-green-100 overflow-hidden">
        <CardContent className="p-0">
          {/* Enhanced Search filters */}
          <div className="p-6 bg-gradient-to-r from-gray-50/80 to-green-50/40 border-b border-green-100">
            <SearchFilters
              search={filters.search}
              status={filters.status}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Optimized Table with virtual scrolling consideration */}
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-b-2 border-green-200">
                  <TableHead className="py-4 text-sm font-semibold text-gray-700">Customer</TableHead>
                  <TableHead className="py-4 text-sm font-semibold text-gray-700">Contact</TableHead>
                  <TableHead className="py-4 text-sm font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="py-4 text-sm font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="py-4 text-sm font-semibold text-gray-700">Tickets</TableHead>
                  <TableHead className="py-4 text-sm font-semibold text-gray-700">Solar Interest</TableHead>
                  <TableHead className="py-4 text-sm font-semibold text-gray-700">Registered</TableHead>
                  <TableHead className="py-4 text-sm font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? LoadingSkeleton : registrations.length > 0 ? (
                  registrations.map((registration, index) => (
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
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-sm">
                          <Users className="w-10 h-10 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium text-lg">No registrations found</p>
                          <p className="text-gray-400 text-sm mt-2">
                            {filters.search || filters.status !== 'all' 
                              ? 'Try adjusting your search filters or add a new user' 
                              : 'Add your first user to get started with event management'}
                          </p>
                          <Button 
                            onClick={() => setAddUserOpen(true)}
                            variant="outline"
                            className="mt-4 hover:bg-green-50 hover:border-green-300"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New User
                          </Button>
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

      {/* Modals */}
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

      <AddUserDialog 
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSuccess={() => {
          fetchRegistrations()
          toast({
            title: "Success",
            description: "User added successfully",
          })
        }}
      />
    </div>
  )
}