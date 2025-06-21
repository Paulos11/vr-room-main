// src/components/admin/OptimizedRegistrationsTable.tsx - Speed optimized, compact table
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  Plus, RefreshCw, Search, Filter, Users, CheckCircle, Clock, AlertCircle,
  Building, Zap, Ticket, Copy, Eye, Check, X, CreditCard, Mail, Phone
} from 'lucide-react'
import { AddUserDialog } from './AddUserDialog'
import { RegistrationDetailsModal } from './RegistrationDetailsModal'
import { StatusBadge } from './StatusBadge'

// Minimal interface for performance
interface CompactRegistration {
  id: string
  name: string
  email: string
  phone: string
  idCardNumber: string
  status: string
  isEmsClient: boolean
  company?: string
  emsCustomerId?: string
  accountManager?: string
  ticketCount: number
  hasSolar: boolean
  createdAt: string
  lastTicket?: string
  adminNotes?: string
  verifiedAt?: string
  verifiedBy?: string
  rejectedReason?: string
  // Full data for modal
  firstName: string
  lastName: string
  tickets: Array<{
    id: string
    ticketNumber: string
    status: string
    ticketSequence: number
  }>
  panelInterests: Array<{
    id: string
    panelType: string
    interestLevel: string
    status: string
    notes?: string
  }>
}

interface TableStats {
  total: number
  pending: number
  completed: number
  paymentPending: number
}

export function OptimizedRegistrationsTable() {
  const [allData, setAllData] = useState<CompactRegistration[]>([]) // Store all data
  const [filteredData, setFilteredData] = useState<CompactRegistration[]>([]) // Filtered view
  const [stats, setStats] = useState<TableStats>({ total: 0, pending: 0, completed: 0, paymentPending: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [processing, setProcessing] = useState<string | null>(null)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<CompactRegistration | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [actionNotes, setActionNotes] = useState('')

  // Optimized fetch - load all data once, filter client-side
  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setLoading(false) // Keep UI responsive during refresh
      else setLoading(true)

      // Fetch ALL data once (no search/status params for server)
      const response = await fetch('/api/admin/registrations/compact?all=true', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAllData(result.data.registrations)
        setStats(result.data.stats)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Instant client-side filtering
  const applyFilters = useMemo(() => {
    let filtered = allData

    // Apply status filter
    if (status && status !== 'all') {
      filtered = filtered.filter(reg => reg.status === status)
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      filtered = filtered.filter(reg => 
        reg.name.toLowerCase().includes(searchLower) ||
        reg.email.toLowerCase().includes(searchLower) ||
        reg.phone.toLowerCase().includes(searchLower) ||
        reg.id.toLowerCase().includes(searchLower) ||
        (reg.company && reg.company.toLowerCase().includes(searchLower)) ||
        (reg.emsCustomerId && reg.emsCustomerId.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [allData, search, status])

  // Update filtered data when filters change
  useEffect(() => {
    setFilteredData(applyFilters)
  }, [applyFilters])

  // Initial data load only
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fast action handler with optimistic updates
  const handleAction = useCallback(async (id: string, action: 'APPROVE' | 'REJECT') => {
    setProcessing(id)
    
    // Optimistic update on both datasets
    const updateRegistration = (reg: CompactRegistration) => 
      reg.id === id 
        ? { ...reg, status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED' }
        : reg

    setAllData(prev => prev.map(updateRegistration))
    setFilteredData(prev => prev.map(updateRegistration))
    
    try {
      const response = await fetch('/api/admin/approve-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registrationId: id, 
          action,
          notes: actionNotes
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Registration ${action.toLowerCase()}ed`,
        })
        
        // Update with real data from server
        const updateWithServerData = (reg: CompactRegistration) => 
          reg.id === id 
            ? { 
                ...reg, 
                status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
                ticketCount: result.data?.tickets?.length || reg.ticketCount,
                tickets: result.data?.tickets || reg.tickets
              }
            : reg

        setAllData(prev => prev.map(updateWithServerData))
        setFilteredData(prev => prev.map(updateWithServerData))
        
        // Close modal and refresh stats
        setDetailsOpen(false)
        setSelectedRegistration(null)
        setActionNotes('')
        setTimeout(() => fetchData(true), 500)
      } else {
        // Revert optimistic update
        const revertUpdate = (reg: CompactRegistration) => 
          reg.id === id 
            ? { ...reg, status: 'PENDING' }
            : reg

        setAllData(prev => prev.map(revertUpdate))
        setFilteredData(prev => prev.map(revertUpdate))
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Action failed",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }, [actionNotes, fetchData])

  // Handle view details
  const handleView = useCallback((id: string) => {
    const registration = allData.find(r => r.id === id) // Look in all data
    if (registration) {
      setSelectedRegistration(registration)
      setActionNotes(registration.adminNotes || '')
      setDetailsOpen(true)
    }
  }, [allData])

  // Memoized components for performance
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({ title: "Copied!", description: "ID copied to clipboard" })
  }

  // Instant search handler - no debouncing needed
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value) // Instant update
  }, [])

  // Instant status filter - no debouncing needed
  const handleStatusChange = useCallback((value: string) => {
    setStatus(value) // Instant update
  }, [])

  if (loading && allData.length === 0) {
    return (
      <div className="space-y-4">
        {/* Compact header skeleton */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg animate-pulse">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-9 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Table skeleton */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gray-50">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 border-b flex items-center px-4">
                <div className="flex-1 grid grid-cols-7 gap-4">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded"></div>
              Registrations
            </h2>
            <p className="text-sm text-gray-600">Manage event registrations</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData(true)}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setAddUserOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add User
            </Button>
          </div>
        </div>
        
        {/* Compact Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-500" />
            <span className="text-gray-700">Total: <strong>{allData.length}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-500" />
            <span className="text-gray-700">Filtered: <strong>{filteredData.length}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-orange-500" />
            <span className="text-gray-700">Pending: <strong className="text-orange-600">{stats.pending}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-gray-700">Approved: <strong className="text-green-600">{stats.completed}</strong></span>
          </div>
          {stats.paymentPending > 0 && (
            <div className="flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-blue-500" />
              <span className="text-gray-700">Payment: <strong className="text-blue-600">{stats.paymentPending}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Compact Filters */}
          <div className="p-4 bg-gray-50/50 border-b flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search registrations..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-9"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48 h-9">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Approved</SelectItem>
                <SelectItem value="PAYMENT_PENDING">Payment Due</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compact Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="py-3 text-xs font-semibold">Customer</TableHead>
                <TableHead className="py-3 text-xs font-semibold">Contact</TableHead>
                <TableHead className="py-3 text-xs font-semibold">Type</TableHead>
                <TableHead className="py-3 text-xs font-semibold">Status</TableHead>
                <TableHead className="py-3 text-xs font-semibold">Tickets</TableHead>
                <TableHead className="py-3 text-xs font-semibold">Date</TableHead>
                <TableHead className="py-3 text-xs font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? filteredData.map((reg, index) => (
                <TableRow 
                  key={reg.id} 
                  className={`h-12 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/30 transition-colors`}
                >
                  {/* Customer */}
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{reg.name}</p>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-gray-100 px-1 rounded">{reg.id.slice(-6)}</code>
                          <button onClick={() => copyId(reg.id)} className="text-xs text-blue-600 hover:text-blue-800">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {reg.isEmsClient && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">EMS</Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="py-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-700">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-32">{reg.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{reg.phone}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="py-2">
                    <div className="space-y-1">
                      <Badge variant={reg.isEmsClient ? "default" : "outline"} className="text-xs">
                        {reg.isEmsClient ? (
                          <><Building className="h-3 w-3 mr-1" />EMS</>
                        ) : (
                          <><Users className="h-3 w-3 mr-1" />Public</>
                        )}
                      </Badge>
                      {reg.company && (
                        <p className="text-xs text-gray-600 truncate max-w-24" title={reg.company}>
                          {reg.company}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-2">
                    <StatusBadge status={reg.status} />
                  </TableCell>

                  {/* Tickets */}
                  <TableCell className="py-2">
                    <div className="space-y-1">
                      {reg.ticketCount > 0 ? (
                        <>
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                            <Ticket className="h-3 w-3 mr-1" />
                            {reg.ticketCount}
                          </Badge>
                          {reg.lastTicket && (
                            <p className="text-xs font-mono text-gray-600">{reg.lastTicket}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                      {reg.hasSolar && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                          <Zap className="h-3 w-3 mr-1" />Solar
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="py-2">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {new Date(reg.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-2">
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleView(reg.id)}
                        className="h-7 px-2 text-xs hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      
                      {reg.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(reg.id, 'APPROVE')}
                            disabled={processing === reg.id}
                            className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600"
                          >
                            {processing === reg.id ? '...' : <Check className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(reg.id, 'REJECT')}
                            disabled={processing === reg.id}
                            className="h-7 px-2 text-xs"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-gray-500 font-medium">No registrations found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddUserDialog 
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSuccess={() => {
          fetchData()
          toast({ title: "Success", description: "User added successfully" })
        }}
      />

      <RegistrationDetailsModal
        registration={selectedRegistration}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onApprove={(id) => handleAction(id, 'APPROVE')}
        onReject={(id) => handleAction(id, 'REJECT')}
        processing={processing === selectedRegistration?.id}
        notes={actionNotes}
        onNotesChange={setActionNotes}
      />
    </div>
  )
}