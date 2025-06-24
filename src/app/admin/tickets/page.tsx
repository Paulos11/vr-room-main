// UPDATED: src/app/admin/tickets/page.tsx - Include ticket type filter
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { TicketsHeader } from '@/components/tickets/TicketsHeader'
import { TicketsFilters } from '@/components/tickets/TicketsFilters'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { GenerateTicketDialog } from '@/components/admin/GenerateTicketDialog'

// ✅ UPDATED: Enhanced TicketData interface with ticket type
export interface TicketData {
  id: string
  ticketNumber: string
  status: string
  sequence: number
  issuedAt: string
  sentAt?: string
  collectedAt?: string
  collectedBy?: string
  // ✅ NEW: Ticket type information
  ticketType: {
    id: string
    name: string
    description?: string
    category?: string
    priceInCents: number
  }
  customer: {
    id: string
    name: string
    email: string
    phone: string
    isEmsClient: boolean
    registrationStatus: string
  }
  lastCheckIn?: {
    checkedInAt: string
    checkedInBy: string
    location: string
  }
}

// ✅ NEW: Ticket type interface
interface TicketType {
  id: string
  name: string
  category?: string
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([])
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]) // ✅ NEW: Ticket types state
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ticketTypeFilter, setTicketTypeFilter] = useState('all') // ✅ NEW: Ticket type filter state
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/tickets?limit=100', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      const result = await response.json()
      
      if (result.success) {
        setTickets(result.data.tickets || [])
        setTicketTypes(result.data.ticketTypes || []) // ✅ NEW: Set ticket types
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tickets",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      toast({
        title: "Error",
        description: "Failed to fetch tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ UPDATED: Filter tickets locally for instant search (including ticket type filter)
  useEffect(() => {
    let filtered = tickets

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(ticket => 
        ticket.ticketNumber.toLowerCase().includes(searchLower) ||
        ticket.customer.name.toLowerCase().includes(searchLower) ||
        ticket.customer.email.toLowerCase().includes(searchLower) ||
        ticket.customer.phone.includes(search) ||
        ticket.ticketType.name.toLowerCase().includes(searchLower) // ✅ NEW: Search by ticket type
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    // ✅ NEW: Apply ticket type filter
    if (ticketTypeFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.ticketType.id === ticketTypeFilter)
    }

    setFilteredTickets(filtered)
  }, [tickets, search, statusFilter, ticketTypeFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleTicketAction = useCallback(async (ticketId: string, action: string) => {
    setProcessingAction(ticketId)
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminUser: 'Admin User' }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        
        // Update local state
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? { 
                ...ticket, 
                status: getNewStatus(action), 
                [getTimestampField(action)]: new Date().toISOString() 
              }
            : ticket
        ))
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update ticket",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(null)
    }
  }, [])

  const getNewStatus = (action: string) => {
    const statusMap: Record<string, string> = {
      'SEND': 'SENT',
      'USE': 'USED', // ✅ UPDATED: Direct from SENT to USED (no COLLECT step)
      'CANCEL': 'CANCELLED',
      'REGENERATE': 'GENERATED'
    }
    return statusMap[action] || 'GENERATED'
  }

  const getTimestampField = (action: string) => {
    const fieldMap: Record<string, string> = {
      'SEND': 'sentAt'
      // ✅ REMOVED: 'COLLECT': 'collectedAt' (no longer used)
    }
    return fieldMap[action] || 'issuedAt'
  }

  return (
    <div className="space-y-4 p-8">
      <TicketsHeader 
        tickets={tickets}
        filteredCount={filteredTickets.length}
        onRefresh={fetchTickets}
        onGenerateTickets={() => setShowGenerateDialog(true)}
        loading={loading}
      />

      {/* ✅ UPDATED: Pass ticket type filter props */}
      <TicketsFilters
        search={search}
        statusFilter={statusFilter}
        ticketTypeFilter={ticketTypeFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onTicketTypeChange={setTicketTypeFilter}
        resultCount={filteredTickets.length}
        totalCount={tickets.length}
        ticketTypes={ticketTypes}
      />

      <TicketsTable
        tickets={filteredTickets}
        loading={loading}
        processingAction={processingAction}
        onTicketAction={handleTicketAction}
        onGenerateTickets={() => setShowGenerateDialog(true)}
      />

      <GenerateTicketDialog 
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onSuccess={fetchTickets}
      />
    </div>
  )
}