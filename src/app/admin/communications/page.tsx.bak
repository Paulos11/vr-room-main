
// src/app/admin/communications/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Mail, Send, CheckCircle, AlertCircle, Clock, Users } from 'lucide-react'

export default function CommunicationsPage() {
  const mockEmails = [
    {
      id: '1',
      type: 'REGISTRATION',
      subject: 'Registration Confirmation - EMS Trade Fair',
      recipient: 'john.doe@example.com',
      status: 'SENT',
      sentAt: '2025-06-15T10:35:00Z',
      openedAt: '2025-06-15T10:45:00Z'
    },
    {
      id: '2',
      type: 'TICKET',
      subject: 'Your VIP Ticket - EMS Trade Fair',
      recipient: 'john.doe@example.com',
      status: 'SENT',
      sentAt: '2025-06-15T11:05:00Z',
      openedAt: '2025-06-15T11:15:00Z'
    },
    {
      id: '3',
      type: 'REGISTRATION',
      subject: 'Registration Confirmation - EMS Trade Fair',
      recipient: 'jane.smith@example.com',
      status: 'SENT',
      sentAt: '2025-06-16T14:25:00Z'
    },
    {
      id: '4',
      type: 'REMINDER',
      subject: 'Event Reminder - EMS Trade Fair Tomorrow',
      recipient: 'all_verified@batch.com',
      status: 'PENDING',
      scheduledFor: '2025-07-25T09:00:00Z'
    }
  ]

  const templates = [
    {
      id: '1',
      name: 'Registration Confirmation',
      type: 'REGISTRATION',
      subject: 'Registration Confirmation - EMS Trade Fair',
      lastUsed: '2025-06-18T08:50:00Z'
    },
    {
      id: '2',
      name: 'Ticket Delivery',
      type: 'TICKET',
      subject: 'Your VIP Ticket - EMS Trade Fair',
      lastUsed: '2025-06-17T10:05:00Z'
    },
    {
      id: '3',
      name: 'Event Reminder',
      type: 'REMINDER',
      subject: 'Don\'t Miss the EMS Trade Fair!',
      lastUsed: '2025-06-10T16:00:00Z'
    }
  ]

  const stats = {
    totalSent: mockEmails.filter(e => e.status === 'SENT').length,
    pending: mockEmails.filter(e => e.status === 'PENDING').length,
    opened: mockEmails.filter(e => e.openedAt).length,
    templates: templates.length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
        <p className="mt-2 text-gray-600">
          Manage email campaigns and communication templates
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Scheduled to send</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opened</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opened}</div>
            <p className="text-xs text-muted-foreground">Email engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Mail className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.templates}</div>
            <p className="text-xs text-muted-foreground">Available templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Email History */}
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>
            Recent email communications and delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEmails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <Badge variant="outline">{email.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {email.subject}
                    </TableCell>
                    <TableCell>{email.recipient}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          email.status === 'SENT' ? 'default' :
                          email.status === 'PENDING' ? 'secondary' : 'destructive'
                        }
                      >
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {email.sentAt ? new Date(email.sentAt).toLocaleString() : 
                       email.scheduledFor ? `Scheduled: ${new Date(email.scheduledFor).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {email.openedAt ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : email.status === 'SENT' ? (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Manage and customize email templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{template.subject}</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Last used: {new Date(template.lastUsed).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm">Use</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
