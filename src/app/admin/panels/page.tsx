
// src/app/admin/panels/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Zap, TrendingUp, Users, Target, Phone, Mail } from 'lucide-react'

export default function PanelLeadsPage() {
  const mockLeads = [
    {
      id: '1',
      clientName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+356 1234 5678',
      panelType: 'commercial',
      interestLevel: 'HIGH',
      status: 'NEW',
      createdAt: '2025-06-15T10:30:00Z',
      notes: 'Interested in 800A commercial panel for office building',
      followUpDate: '2025-06-20T09:00:00Z'
    },
    {
      id: '2',
      clientName: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      phone: '+356 5555 1234',
      panelType: 'residential',
      interestLevel: 'MEDIUM',
      status: 'CONTACTED',
      createdAt: '2025-06-17T09:15:00Z',
      notes: 'Looking for residential panel upgrade',
      followUpDate: '2025-06-22T14:00:00Z'
    },
    {
      id: '3',
      clientName: 'Alice Wilson',
      email: 'alice.wilson@example.com',
      phone: '+356 7777 8888',
      panelType: 'smart',
      interestLevel: 'HIGH',
      status: 'QUALIFIED',
      createdAt: '2025-06-18T08:45:00Z',
      notes: 'Interested in IoT-enabled smart panels for new construction',
      followUpDate: '2025-06-25T10:00:00Z'
    }
  ]

  const stats = {
    total: mockLeads.length,
    high: mockLeads.filter(l => l.interestLevel === 'HIGH').length,
    new: mockLeads.filter(l => l.status === 'NEW').length,
    qualified: mockLeads.filter(l => l.status === 'QUALIFIED').length
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel Leads</h1>
        <p className="mt-2 text-gray-600">
          Track and manage panel sales opportunities
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Panel interest leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Ready to purchase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
            <p className="text-xs text-muted-foreground">Need follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15%</div>
            <p className="text-xs text-muted-foreground">Lead to sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>Panel Interest Leads</CardTitle>
          <CardDescription>
            Clients interested in EMS panel solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Panel Type</TableHead>
                  <TableHead>Interest Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.clientName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {lead.panelType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          lead.interestLevel === 'HIGH' ? 'default' :
                          lead.interestLevel === 'MEDIUM' ? 'secondary' : 'outline'
                        }
                      >
                        {lead.interestLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(lead.followUpDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Contact
                        </Button>
                        <Button size="sm">
                          Update
                        </Button>
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
