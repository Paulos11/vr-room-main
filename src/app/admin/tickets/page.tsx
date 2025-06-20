// src/app/admin/tickets/page.tsx - Optimized with EMS colors and better performance
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  AlertCircle,
  QrCode,
  Plus,
  Filter
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  
  // Debounced search
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: search,
        status: statusFilter === 'all' ? '' : statusFilter,
        limit: '100'
      })

      const response = await fetch(`/api/admin/tickets?${params}`, {
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
  }, [search, statusFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleSearchChange = useCallback((value: string) => {
    if (searchDebounce) clearTimeout(searchDebounce)
    const timeout = setTimeout(() => setSearch(value), 300)
    setSearchDebounce(timeout)
  }, [searchDebounce])

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
        
        // Optimistic update
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? { 
                ...ticket, 
                status: getNewStatus(action), 
                [getTimestampField(action)]: new Date().toISOString() 
              }
            : ticket
        ))
        
        // Background refresh
        setTimeout(fetchTickets, 500)
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
  }, [fetchTickets])

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

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { className: string; icon: any }> = {
      GENERATED: { className: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock },
      SENT: { className: 'bg-blue-100 text-blue-700 border-blue-200', icon: Send },
      COLLECTED: { className: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
      USED: { className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      EXPIRED: { className: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
      CANCELLED: { className: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle }
    }

    const config = statusStyles[status] || statusStyles.GENERATED
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
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

  // Memoized statistics
  const statistics = useMemo(() => {
    return tickets.reduce((acc, ticket) => {
      acc.total = tickets.length
      acc[ticket.status.toLowerCase() as keyof typeof acc] = (acc[ticket.status.toLowerCase() as keyof typeof acc] || 0) + 1
      return acc
    }, {
      total: 0,
      generated: 0,
      sent: 0,
      collected: 0,
      used: 0,
      expired: 0,
      cancelled: 0
    })
  }, [tickets])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header with EMS styling */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 mb-4">
                Generate, manage and track all event tickets
              </p>
              
              {/* Compact stats */}
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Total: <strong>{statistics.total}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Generated: <strong>{statistics.generated}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Active: <strong>{statistics.sent + statistics.collected}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Used: <strong>{statistics.used}</strong></span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowGenerateDialog(true)}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Tickets
            </Button>
          </div>
        </div>

        {/* Main Table */}
        <Card className="shadow-sm border-green-100">
          <CardHeader className="pb-4 bg-gradient-to-r from-green-50/50 to-blue-50/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                  Ticket Overview
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Monitor ticket status and manage delivery
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchTickets} className="hover:bg-green-50">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Enhanced Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ticket number, customer name, or email..."
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-10 border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-10 border-2 border-gray-200 focus:border-blue-400">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="GENERATED">Generated</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="COLLECTED">Collected</SelectItem>
                  <SelectItem value="USED">Used</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-green-200">
                    <TableHead className="py-3 text-sm font-semibold text-gray-700">Ticket</TableHead>
                    <TableHead className="py-3 text-sm font-semibold text-gray-700">Customer</TableHead>
                    <TableHead className="py-3 text-sm font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="py-3 text-sm font-semibold text-gray-700">Generated</TableHead>
                    <TableHead className="py-3 text-sm font-semibold text-gray-700">Delivery</TableHead>
                    <TableHead className="py-3 text-sm font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j} className="py-4">
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : tickets.length > 0 ? (
                    tickets.map((ticket, index) => {
                      const isEven = index % 2 === 0
                      const rowBg = isEven ? 'bg-white' : 'bg-green-50/30'
                      const hoverBg = isEven ? 'hover:bg-green-50/50' : 'hover:bg-green-50/70'
                      
                      return (
                        <TableRow key={ticket.id} className={`${rowBg} ${hoverBg} transition-all duration-200 border-b border-green-100/50`}>
                          <TableCell className="py-3">
                            <div>
                              <p className="font-mono text-sm font-semibold text-gray-800">
                                {ticket.ticketNumber}
                              </p>
                              {ticket.sequence > 1 && (
                                <p className="text-xs text-gray-500">#{ticket.sequence}</p>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <p className="font-semibold text-sm text-gray-900">{ticket.customer.name}</p>
                              <p className="text-xs text-gray-600">{ticket.customer.email}</p>
                              <Badge 
                                variant={ticket.customer.isEmsClient ? "default" : "outline"}
                                className={`text-xs ${
                                  ticket.customer.isEmsClient 
                                    ? 'bg-green-500 text-white' 
                                    : 'border-blue-300 text-blue-700'
                                }`}
                              >
                                {ticket.customer.isEmsClient ? 'EMS' : 'Public'}
                              </Badge>
                            </div>
                          </TableCell>
                          
                          <TableCell className="py-3">
                            {getStatusBadge(ticket.status)}
                          </TableCell>
                          
                          <TableCell className="py-3">
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {formatDate(ticket.issuedAt)}
                            </span>
                          </TableCell>
                          
                          <TableCell className="py-3">
                            <div className="text-xs space-y-1">
                              {ticket.sentAt && (
                                <div className="text-blue-600">Sent: {formatDate(ticket.sentAt)}</div>
                              )}
                              {ticket.collectedAt && (
                                <div className="text-purple-600">
                                  Collected: {formatDate(ticket.collectedAt)}
                                  {ticket.collectedBy && <div className="text-gray-500">by {ticket.collectedBy}</div>}
                                </div>
                              )}
                              {!ticket.sentAt && !ticket.collectedAt && (
                                <span className="text-gray-400 italic">Not delivered</span>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="py-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadTicket(ticket.id)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                                title="Download PDF"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                    disabled={processingAction === ticket.id}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {ticket.status === 'GENERATED' && (
                                    <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'SEND')}>
                                      <Send className="w-4 h-4 mr-2 text-blue-600" />
                                      Mark as Sent
                                    </DropdownMenuItem>
                                  )}
                                  {(ticket.status === 'SENT' || ticket.status === 'GENERATED') && (
                                    <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'COLLECT')}>
                                      <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                                      Mark as Collected
                                    </DropdownMenuItem>
                                  )}
                                  {ticket.status === 'COLLECTED' && (
                                    <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'USE')}>
                                      <QrCode className="w-4 h-4 mr-2 text-green-600" />
                                      Check In
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'REGENERATE')}>
                                    <RefreshCw className="w-4 h-4 mr-2 text-orange-600" />
                                    Regenerate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleTicketAction(ticket.id, 'CANCEL')}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                            <Ticket className="w-8 h-8 text-green-600" />
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">No tickets found</p>
                            <p className="text-gray-400 text-sm mt-1">
                              {search || statusFilter !== 'all' 
                                ? 'Try adjusting your search filters' 
                                : 'Generate tickets for approved registrations'}
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

        <GenerateTicketDialog 
          open={showGenerateDialog}
          onOpenChange={setShowGenerateDialog}
          onSuccess={fetchTickets}
        />
      </div>
    </div>
  )
}