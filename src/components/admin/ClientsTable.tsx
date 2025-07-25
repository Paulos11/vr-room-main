// src/components/admin/ClientsTable.tsx - Updated with real data and text buttons
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import { Search, Eye, Clock, Users, UserCheck, AlertCircle, Zap, Building, Mail, Phone } from 'lucide-react'

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

export function ClientsTable() {
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
    limit: 10
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        
        // Update the registration in the list
        setRegistrations(prev => prev.map(reg => 
          reg.id === registrationId 
            ? { 
                ...reg, 
                status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'admin',
                adminNotes: actionNotes || reg.adminNotes,
                ticket: result.data?.ticket || reg.ticket
              }
            : reg
        ))
        
        setDialogOpen(false)
        setSelectedRegistration(null)
        setActionNotes('')
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'PENDING':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
      case 'PAYMENT_PENDING':
        return <Badge className="bg-blue-100 text-blue-800">Payment Pending</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeletons */}
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
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
              {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Verified customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paymentPending}</div>
            <p className="text-xs text-muted-foreground">Need payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Not verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Registrations</CardTitle>
          <CardDescription>
            Manage and verify client registrations for the EMS Trade Fair
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, or ID..."
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
                <SelectItem value="COMPLETED">Approved</SelectItem>
                <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Panel Interest</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{registration.firstName} {registration.lastName}</p>
                        <p className="text-sm text-gray-500">ID: {registration.idCardNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {registration.email}
                        </p>
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {registration.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant={registration.isEmsClient ? "default" : "outline"}>
                          {registration.isEmsClient ? 'EMS Customer' : 'General Public'}
                        </Badge>
                        {registration.customerName && (
                          <p className="text-xs text-gray-500 mt-1">{registration.customerName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(registration.status)}
                    </TableCell>
                    <TableCell>
                      {registration.ticket ? (
                        <div>
                          <p className="font-mono text-xs">{registration.ticket.ticketNumber}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {registration.ticket.status}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No ticket</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {registration.panelInterests.length > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          {registration.panelInterests[0].panelType}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(registration.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={dialogOpen && selectedRegistration?.id === registration.id} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedRegistration(registration)
                                setActionNotes(registration.adminNotes || '')
                                setDialogOpen(true)
                              }}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Registration Details</DialogTitle>
                              <DialogDescription>
                                Review and manage client registration
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRegistration && (
                              <RegistrationDetailsDialog 
                                registration={selectedRegistration}
                                onAction={handleAction}
                                processing={processingAction === selectedRegistration.id}
                                notes={actionNotes}
                                onNotesChange={setActionNotes}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {registration.status === 'PENDING' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleAction(registration.id, 'APPROVE')}
                              disabled={processingAction === registration.id}
                            >
                              {processingAction === registration.id ? 'Processing...' : 'Approve'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleAction(registration.id, 'REJECT')}
                              disabled={processingAction === registration.id}
                            >
                              Reject
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

          {registrations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No registrations found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Registration Details Dialog Component
function RegistrationDetailsDialog({ 
  registration, 
  onAction, 
  processing,
  notes,
  onNotesChange
}: { 
  registration: RegistrationData
  onAction: (id: string, action: 'APPROVE' | 'REJECT') => void
  processing: boolean
  notes: string
  onNotesChange: (notes: string) => void
}) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Personal Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-medium">{registration.firstName} {registration.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-medium">{registration.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="font-medium">{registration.phone}</span>
              </div>
              <div className="flex justify-between">
                <span>ID Number:</span>
                <span className="font-mono text-xs">{registration.idCardNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Type:</span>
                <span className="font-medium">
                  {registration.isEmsClient ? 'EMS Customer' : 'General Public'}
                </span>
              </div>
            </div>
          </div>

          {registration.isEmsClient && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Building className="h-4 w-4" />
                EMS Customer Info
              </h4>
              <div className="space-y-2 text-sm">
                {registration.customerName && (
                  <div className="flex justify-between">
                    <span>Customer Name:</span>
                    <span className="font-medium">{registration.customerName}</span>
                  </div>
                )}
                {registration.emsCustomerId && (
                  <div className="flex justify-between">
                    <span>Customer ID:</span>
                    <span className="font-medium">{registration.emsCustomerId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Registration Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                {getStatusBadge(registration.status)}
              </div>
              <div className="flex justify-between">
                <span>Registered:</span>
                <span>{new Date(registration.createdAt).toLocaleDateString()}</span>
              </div>
              {registration.verifiedAt && (
                <div className="flex justify-between">
                  <span>Verified:</span>
                  <span>{new Date(registration.verifiedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {registration.ticket && (
            <div>
              <h4 className="font-medium mb-2">Ticket Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Ticket Number:</span>
                  <span className="font-mono">{registration.ticket.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="outline">{registration.ticket.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Issued:</span>
                  <span>{new Date(registration.ticket.issuedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel Interests */}
      {registration.panelInterests.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Panel Interests
          </h4>
          {registration.panelInterests.map((interest) => (
            <div key={interest.id} className="bg-blue-50 p-3 rounded-lg mb-2">
              <div className="flex justify-between items-start mb-2">
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
                <p className="text-sm text-gray-600">{interest.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Notes */}
      <div>
        <h4 className="font-medium mb-2">Admin Notes</h4>
        <Textarea
          placeholder="Add notes about this registration..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="w-full"
        />
      </div>

      {/* Action Buttons */}
      {registration.status === 'PENDING' && (
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={() => onAction(registration.id, 'APPROVE')}
            disabled={processing}
            className="flex-1"
          >
            {processing ? 'Processing...' : 'Approve & Generate Ticket'}
          </Button>
          <Button 
            variant="destructive"
            onClick={() => onAction(registration.id, 'REJECT')}
            disabled={processing}
            className="flex-1"
          >
            {processing ? 'Processing...' : 'Reject Registration'}
          </Button>
        </div>
      )}
    </div>
  )

  function getStatusBadge(status: string) {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'PENDING':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
      case 'PAYMENT_PENDING':
        return <Badge className="bg-blue-100 text-blue-800">Payment Pending</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }
}