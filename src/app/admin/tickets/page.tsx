// src/app/admin/tickets/page.tsx - Complete tickets management page
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { 
  Ticket, 
  CheckCircle, 
  Send, 
  Download, 
  Clock, 
  Search,
  MoreHorizontal,
  RefreshCw,
  Users,
  AlertCircle,
  QrCode,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TicketStatsCards } from '@/components/admin/TicketStatsCards'
import { GenerateTicketDialog } from '@/components/admin/GenerateTicketDialog'

interface TicketData {
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

interface TicketStats {
  total: number
  generated: number
  sent: number
  collected: number
  used: number
  expired: number
  cancelled: number
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    generated: 0,
    sent: 0,
    collected: 0,
    used: 0,
    expired: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: search,
        status: statusFilter === 'all' ? '' : statusFilter,
        page: page.toString(),
        limit: '20'
      })

      const response = await fetch(`/api/admin/tickets?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setTickets(result.data.tickets)
        setStats(result.data.stats)
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
  }

  useEffect(() => {
    fetchTickets()
  }, [search, statusFilter, page])

  const handleTicketAction = async (ticketId: string, action: string) => {
    setProcessingAction(ticketId)
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminUser: 'Admin User' // You can get this from auth context
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        
        // Update ticket in list
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status: getNewStatus(action), [getTimestampField(action)]: new Date().toISOString() }
            : ticket
        ))
        
        // Refresh stats
        fetchTickets()
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
  }

  const getNewStatus = (action: string) => {
    switch (action) {
      case 'SEND': return 'SENT'
      case 'COLLECT': return 'COLLECTED'
      case 'USE': return 'USED'
      case 'CANCEL': return 'CANCELLED'
      case 'REGENERATE': return 'GENERATED'
      default: return 'GENERATED'
    }
  }

  const getTimestampField = (action: string) => {
    switch (action) {
      case 'SEND': return 'sentAt'
      case 'COLLECT': return 'collectedAt'
      default: return 'issuedAt'
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      GENERATED: { variant: 'outline', color: 'text-orange-600', icon: Clock },
      SENT: { variant: 'secondary', color: 'text-blue-600', icon: Send },
      COLLECTED: { variant: 'secondary', color: 'text-purple-600', icon: CheckCircle },
      USED: { variant: 'default', color: 'text-green-600', icon: CheckCircle },
      EXPIRED: { variant: 'destructive', color: 'text-red-600', icon: AlertCircle },
      CANCELLED: { variant: 'destructive', color: 'text-gray-600', icon: AlertCircle }
    }

    const config = variants[status] || variants.GENERATED
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const downloadTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/download/${ticketId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ticket-${ticketId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Success",
          description: "Ticket downloaded successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download ticket",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets Management</h1>
          <p className="mt-2 text-gray-600">
            Manage generated tickets, delivery status, and ticket operations
          </p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Tickets
        </Button>
      </div>

      {/* Stats Cards */}
      <TicketStatsCards stats={stats} loading={loading} />

      {/* Main Tickets Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Tickets</CardTitle>
          <CardDescription>
            View and manage all generated tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ticket number, customer name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="GENERATED">Generated</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="COLLECTED">Collected</SelectItem>
                <SelectItem value="USED">Used</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchTickets}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="py-2 text-xs">Ticket</TableHead>
                  <TableHead className="py-2 text-xs">Customer</TableHead>
                  <TableHead className="py-2 text-xs">Type</TableHead>
                  <TableHead className="py-2 text-xs">Status</TableHead>
                  <TableHead className="py-2 text-xs">Generated</TableHead>
                  <TableHead className="py-2 text-xs">Sent</TableHead>
                  <TableHead className="py-2 text-xs">Collected</TableHead>
                  <TableHead className="py-2 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j} className="py-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-gray-50">
                      <TableCell className="py-2">
                        <div>
                          <p className="font-mono text-sm font-medium">{ticket.ticketNumber}</p>
                          {ticket.sequence > 1 && (
                            <p className="text-xs text-gray-500">Seq: {ticket.sequence}</p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <div>
                          <p className="font-medium text-sm">{ticket.customer.name}</p>
                          <p className="text-xs text-gray-500">{ticket.customer.email}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant={ticket.customer.isEmsClient ? "default" : "outline"} className="text-xs">
                              {ticket.customer.isEmsClient ? 'EMS' : 'Public'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-xs">
                          {ticket.accessType}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <span className="text-xs text-gray-600">
                          {formatDate(ticket.issuedAt)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <span className="text-xs text-gray-600">
                          {ticket.sentAt ? formatDate(ticket.sentAt) : '-'}
                        </span>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <div className="text-xs">
                          {ticket.collectedAt ? (
                            <div>
                              <p className="text-gray-600">{formatDate(ticket.collectedAt)}</p>
                              <p className="text-gray-500">by {ticket.collectedBy}</p>
                            </div>
                          ) : '-'}
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadTicket(ticket.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                disabled={processingAction === ticket.id}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {ticket.status === 'GENERATED' && (
                                <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'SEND')}>
                                  <Send className="w-4 h-4 mr-2" />
                                  Mark as Sent
                                </DropdownMenuItem>
                              )}
                              {(ticket.status === 'SENT' || ticket.status === 'GENERATED') && (
                                <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'COLLECT')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Collected
                                </DropdownMenuItem>
                              )}
                              {ticket.status === 'COLLECTED' && (
                                <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'USE')}>
                                  <QrCode className="w-4 h-4 mr-2" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'REGENERATE')}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Regenerate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleTicketAction(ticket.id, 'CANCEL')}
                                className="text-red-600"
                              >
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && tickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tickets found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <GenerateTicketDialog 
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onSuccess={fetchTickets}
      />
    </div>
  )
}