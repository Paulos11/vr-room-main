// src/app/admin/tickets/page.tsx - Clean main page
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { TicketsHeader } from '@/components/tickets/TicketsHeader'
import { TicketsFilters } from '@/components/tickets/TicketsFilters'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { GenerateTicketDialog } from '@/components/admin/GenerateTicketDialog'

export interface TicketData {
  id: string
  ticketNumber: string
  status: string
  accessType: string
  sequence: number
  issuedAt: string
  sentAt?: string
  collectedAt?: string
  collectedBy?: string
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

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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

  // Filter tickets locally for instant search
  useEffect(() => {
    let filtered = tickets

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(ticket => 
        ticket.ticketNumber.toLowerCase().includes(searchLower) ||
        ticket.customer.name.toLowerCase().includes(searchLower) ||
        ticket.customer.email.toLowerCase().includes(searchLower) ||
        ticket.customer.phone.includes(search)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    setFilteredTickets(filtered)
  }, [tickets, search, statusFilter])

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
      'COLLECT': 'COLLECTED',
      'USE': 'USED',
      'CANCEL': 'CANCELLED',
      'REGENERATE': 'GENERATED'
    }
    return statusMap[action] || 'GENERATED'
  }

  const getTimestampField = (action: string) => {
    const fieldMap: Record<string, string> = {
      'SEND': 'sentAt',
      'COLLECT': 'collectedAt'
    }
    return fieldMap[action] || 'issuedAt'
  }

  return (
    <div className="space-y-4 p-8">
      <TicketsHeader 
        tickets={tickets}
        onRefresh={fetchTickets}
        onGenerateTickets={() => setShowGenerateDialog(true)}
        loading={loading}
      />

      <TicketsFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        resultCount={filteredTickets.length}
        totalCount={tickets.length}
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