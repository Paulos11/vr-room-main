// src/components/admin/ClientsTable.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import { Search, Eye, Check, X, Mail, Phone, CreditCard, Zap, Clock, Users, UserCheck, AlertCircle } from 'lucide-react'

interface ClientData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  idNumber: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  createdAt: string
  verifiedAt?: string
  verifiedBy?: string
  notes?: string
  tickets: Array<{
    id: string
    ticketNumber: string
    status: string
    generatedAt: string
    sentAt?: string
  }>
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

export function ClientsTable() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    status: '',
    page: 1,
    limit: 10
  })
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Mock data - replace with actual API call
  const mockClients: ClientData[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+356 1234 5678',
      idNumber: 'ID123456789',
      status: 'VERIFIED',
      createdAt: '2025-06-15T10:30:00Z',
      verifiedAt: '2025-06-15T11:00:00Z',
      verifiedBy: 'admin',
      tickets: [{
        id: 't1',
        ticketNumber: 'EMS-789123-ABC',
        status: 'SENT',
        generatedAt: '2025-06-15T11:00:00Z',
        sentAt: '2025-06-15T11:05:00Z'
      }],
      panelInterests: [{
        id: 'p1',
        panelType: 'commercial',
        interestLevel: 'HIGH',
        status: 'NEW',
        notes: 'Interested in 800A commercial panel for office building'
      }],
      emailLogs: [{
        id: 'e1',
        emailType: 'REGISTRATION',
        status: 'SENT',
        sentAt: '2025-06-15T10:35:00Z'
      }]
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+356 9876 5432',
      idNumber: 'ID987654321',
      status: 'PENDING',
      createdAt: '2025-06-16T14:20:00Z',
      tickets: [],
      panelInterests: [],
      emailLogs: [{
        id: 'e2',
        emailType: 'REGISTRATION',
        status: 'SENT',
        sentAt: '2025-06-16T14:25:00Z'
      }]
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '+356 5555 1234',
      idNumber: 'ID555123456',
      status: 'VERIFIED',
      createdAt: '2025-06-17T09:15:00Z',
      verifiedAt: '2025-06-17T10:00:00Z',
      verifiedBy: 'admin',
      tickets: [{
        id: 't2',
        ticketNumber: 'EMS-456789-DEF',
        status: 'GENERATED',
        generatedAt: '2025-06-17T10:00:00Z'
      }],
      panelInterests: [{
        id: 'p2',
        panelType: 'residential',
        interestLevel: 'MEDIUM',
        status: 'NEW',
        notes: 'Looking for residential panel upgrade'
      }],
      emailLogs: [{
        id: 'e3',
        emailType: 'REGISTRATION',
        status: 'SENT',
        sentAt: '2025-06-17T09:20:00Z'
      }]
    },
    {
      id: '4',
      firstName: 'Alice',
      lastName: 'Wilson',
      email: 'alice.wilson@example.com',
      phone: '+356 7777 8888',
      idNumber: 'ID777888999',
      status: 'PENDING',
      createdAt: '2025-06-18T08:45:00Z',
      tickets: [],
      panelInterests: [{
        id: 'p3',
        panelType: 'smart',
        interestLevel: 'HIGH',
        status: 'NEW',
        notes: 'Interested in IoT-enabled smart panels'
      }],
      emailLogs: [{
        id: 'e4',
        emailType: 'REGISTRATION',
        status: 'SENT',
        sentAt: '2025-06-18T08:50:00Z'
      }]
    },
    {
      id: '5',
      firstName: 'Mike',
      lastName: 'Brown',
      email: 'mike.brown@example.com',
      phone: '+356 2222 3333',
      idNumber: 'ID222333444',
      status: 'REJECTED',
      createdAt: '2025-06-18T12:00:00Z',
      notes: 'Invalid ID number provided',
      tickets: [],
      panelInterests: [],
      emailLogs: [{
        id: 'e5',
        emailType: 'REGISTRATION',
        status: 'SENT',
        sentAt: '2025-06-18T12:05:00Z'
      }]
    }
  ]

  const fetchClients = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Filter mock data based on current filters
      let filteredClients = mockClients
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredClients = filteredClients.filter(client => 
          client.firstName.toLowerCase().includes(searchLower) ||
          client.lastName.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.phone.includes(filters.search) ||
          client.idNumber.toLowerCase().includes(searchLower)
        )
      }
      
      if (filters.status) {
        filteredClients = filteredClients.filter(client => client.status === filters.status)
      }
      
      setClients(filteredClients)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [filters])

  const handleVerifyClient = async (clientId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => {
    setVerificationLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update client status in mock data
      const updatedClients = clients.map(client => 
        client.id === clientId 
          ? { 
              ...client, 
              status, 
              notes: notes || client.notes,
              verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : undefined,
              verifiedBy: status === 'VERIFIED' ? 'admin' : undefined
            }
          : client
      )
      
      setClients(updatedClients)
      
      toast({
        title: "Success",
        description: `Client ${status.toLowerCase()} successfully`,
      })
      
      setDialogOpen(false)
      setSelectedClient(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      })
    } finally {
      setVerificationLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const stats = {
    total: mockClients.length,
    pending: mockClients.filter(c => c.status === 'PENDING').length,
    verified: mockClients.filter(c => c.status === 'VERIFIED').length,
    rejected: mockClients.filter(c => c.status === 'REJECTED').length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeletons */}
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">Successfully verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Registration rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Registrations</CardTitle>
          <CardDescription>
            Manage and verify client registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Panel Interest</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="font-mono text-sm">{client.idNumber}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          client.status === 'VERIFIED' ? 'default' :
                          client.status === 'PENDING' ? 'secondary' : 'destructive'
                        }
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.panelInterests.length > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          {client.panelInterests[0].panelType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={dialogOpen && selectedClient?.id === client.id} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedClient(client)
                                setDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Client Details</DialogTitle>
                              <DialogDescription>
                                Review and verify client registration
                              </DialogDescription>
                            </DialogHeader>
                            {selectedClient && (
                              <ClientDetailsDialog 
                                client={selectedClient}
                                onVerify={handleVerifyClient}
                                loading={verificationLoading}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {client.status === 'PENDING' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleVerifyClient(client.id, 'VERIFIED')}
                              disabled={verificationLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleVerifyClient(client.id, 'REJECTED')}
                              disabled={verificationLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Client Details Dialog Component
function ClientDetailsDialog({ 
  client, 
  onVerify, 
  loading 
}: { 
  client: ClientData
  onVerify: (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => void
  loading: boolean 
}) {
  const [notes, setNotes] = useState('')

  return (
    <div className="space-y-6">
      {/* Client Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">Personal Details</span>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {client.firstName} {client.lastName}</p>
            <p><strong>ID Number:</strong> {client.idNumber}</p>
            <p><strong>Registered:</strong> {new Date(client.createdAt).toLocaleDateString()}</p>
            {client.verifiedAt && (
              <p><strong>Verified:</strong> {new Date(client.verifiedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="font-medium">Contact Information</span>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Email:</strong> {client.email}</p>
            <p><strong>Phone:</strong> {client.phone}</p>
          </div>
        </div>
      </div>

      {/* Panel Interests */}
      {client.panelInterests.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="font-medium">Panel Interests</span>
          </div>
          {client.panelInterests.map((interest) => (
            <div key={interest.id} className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium capitalize">{interest.panelType} Panels</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {interest.interestLevel} Interest
                  </Badge>
                </div>
                <Badge variant="secondary">
                  {interest.status}
                </Badge>
              </div>
              {interest.notes && (
                <p className="text-sm text-gray-600 mt-2">{interest.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tickets */}
      {client.tickets.length > 0 && (
        <div className="space-y-2">
          <span className="font-medium">Tickets</span>
          {client.tickets.map((ticket) => (
            <div key={ticket.id} className="bg-green-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Ticket #{ticket.ticketNumber}</p>
                  <p className="text-sm text-gray-600">
                    Generated: {new Date(ticket.generatedAt).toLocaleDateString()}
                  </p>
                  {ticket.sentAt && (
                    <p className="text-sm text-gray-600">
                      Sent: {new Date(ticket.sentAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Badge variant="outline">
                  {ticket.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {client.notes && (
        <div className="space-y-2">
          <span className="font-medium">Notes</span>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm">{client.notes}</p>
          </div>
        </div>
      )}

      {/* Verification Actions */}
      {client.status === 'PENDING' && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <label className="text-sm font-medium">Notes (Optional)</label>
            <textarea 
              className="w-full mt-1 p-2 border rounded-md text-sm"
              placeholder="Add any notes about this verification..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => onVerify(client.id, 'VERIFIED', notes)}
              disabled={loading}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Verify & Send Ticket
            </Button>
            <Button 
              variant="destructive"
              onClick={() => onVerify(client.id, 'REJECTED', notes)}
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Reject Registration
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}