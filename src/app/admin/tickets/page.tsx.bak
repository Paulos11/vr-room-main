// src/app/admin/tickets/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Ticket, CheckCircle, Send, Download, AlertCircle, Clock } from 'lucide-react'

export default function TicketsPage() {
  const mockTickets = [
    {
      id: '1',
      ticketNumber: 'EMS-789123-ABC',
      clientName: 'John Doe',
      email: 'john.doe@example.com',
      status: 'SENT',
      generatedAt: '2025-06-15T11:00:00Z',
      sentAt: '2025-06-15T11:05:00Z',
      qrCode: 'QR789123ABC'
    },
    {
      id: '2',
      ticketNumber: 'EMS-456789-DEF',
      clientName: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      status: 'GENERATED',
      generatedAt: '2025-06-17T10:00:00Z',
      qrCode: 'QR456789DEF'
    },
    {
      id: '3',
      ticketNumber: 'EMS-321654-GHI',
      clientName: 'Alice Wilson',
      email: 'alice.wilson@example.com',
      status: 'COLLECTED',
      generatedAt: '2025-06-18T09:00:00Z',
      sentAt: '2025-06-18T09:05:00Z',
      collectedAt: '2025-06-18T14:30:00Z',
      qrCode: 'QR321654GHI'
    }
  ]

  const stats = {
    total: mockTickets.length,
    sent: mockTickets.filter(t => t.status === 'SENT').length,
    generated: mockTickets.filter(t => t.status === 'GENERATED').length,
    collected: mockTickets.filter(t => t.status === 'COLLECTED').length
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
        <p className="mt-2 text-gray-600">
          Manage generated tickets and delivery status
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All generated tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">Delivered to clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.generated}</div>
            <p className="text-xs text-muted-foreground">Ready to send</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collected}</div>
            <p className="text-xs text-muted-foreground">Picked up at event</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Tickets</CardTitle>
          <CardDescription>
            All tickets generated for verified clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      {ticket.ticketNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {ticket.clientName}
                    </TableCell>
                    <TableCell>{ticket.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          ticket.status === 'COLLECTED' ? 'default' :
                          ticket.status === 'SENT' ? 'secondary' : 'outline'
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(ticket.generatedAt)}</TableCell>
                    <TableCell>
                      {ticket.sentAt ? formatDate(ticket.sentAt) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        {ticket.status === 'GENERATED' && (
                          <Button size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
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
