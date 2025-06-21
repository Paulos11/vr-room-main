// src/app/admin/panels/page.tsx - Simplified working version
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Zap, 
  Users, 
  RefreshCw,
  Search,
  Building,
  Mail,
  Phone
} from 'lucide-react'

interface PanelLead {
  id: string
  customerName: string
  email: string
  phone: string
  isEmsClient: boolean
  companyName?: string
  panelType: string
  interestLevel: string
  leadStatus: string
  estimatedBudget?: string
  createdAt: string
}

export default function PanelLeadsPage() {
  const [leads, setLeads] = useState<PanelLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching panel leads...')
      
      const response = await fetch('/api/admin/panel-leads?limit=100')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API result:', result)
      
      if (result.success) {
        setLeads(result.data.leads || [])
        console.log(`Loaded ${result.data.leads?.length || 0} leads`)
      } else {
        setError(result.message || 'Failed to fetch leads')
      }
    } catch (err: any) {
      console.error('Error fetching leads:', err)
      setError(err.message || 'Failed to fetch panel leads')
    } finally {
      setLoading(false)
    }
  }

  // Simple client-side filtering
  const filteredLeads = leads.filter(lead => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      lead.customerName.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      (lead.companyName && lead.companyName.toLowerCase().includes(searchLower))
    )
  })

  const getInterestBadge = (level: string) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-700',
      HIGH: 'bg-orange-100 text-orange-700', 
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-gray-100 text-gray-700'
    }
    return colors[level as keyof typeof colors] || colors.LOW
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      NEW: 'bg-blue-100 text-blue-700',
      CONTACTED: 'bg-purple-100 text-purple-700',
      QUALIFIED: 'bg-green-100 text-green-700',
      CONVERTED: 'bg-emerald-100 text-emerald-700'
    }
    return colors[status as keyof typeof colors] || colors.NEW
  }

  if (error) {
    return (
      <div className="space-y-4 ">
        <h1 className="text-xl font-bold">Panel Interest Leads</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading panel leads</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={fetchLeads} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Panel Interest Leads</h1>
          <p className="text-gray-600 mt-1">
            Customers interested in EMS panel solutions
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchLeads}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-gray-500">Panel interest registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Interest</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {leads.filter(l => l.interestLevel === 'HIGH' || l.interestLevel === 'URGENT').length}
            </div>
            <p className="text-xs text-gray-500">Ready to purchase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EMS Customers</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leads.filter(l => l.isEmsClient).length}
            </div>
            <p className="text-xs text-gray-500">Existing customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Results */}
      {search && (
        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
          Showing <strong>{filteredLeads.length}</strong> of <strong>{leads.length}</strong> leads
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Panel Type</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading panel leads...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead, index) => (
                  <TableRow key={lead.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{lead.customerName}</p>
                          {lead.isEmsClient && (
                            <Badge className="bg-green-100 text-green-700 text-xs border-0">
                              EMS
                            </Badge>
                          )}
                        </div>
                        {lead.companyName && (
                          <p className="text-xs text-gray-600">{lead.companyName}</p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {lead.panelType}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`text-xs border-0 ${getInterestBadge(lead.interestLevel)}`}>
                        {lead.interestLevel}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`text-xs border-0 ${getStatusBadge(lead.leadStatus)}`}>
                        {lead.leadStatus}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-xs text-gray-600">
                        {lead.estimatedBudget || 'Not specified'}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-xs text-gray-600">
                        {new Date(lead.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Zap className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="text-gray-500 font-medium">No panel interest leads found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {search 
                            ? 'Try adjusting your search terms'
                            : 'Leads will appear when customers register with panel interest'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}    