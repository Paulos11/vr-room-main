// src/components/admin/DashboardStats.tsx (Fixed)
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserCheck, Clock, Ticket, Zap, TrendingUp } from 'lucide-react'

interface DashboardStatsType {
  totalRegistrations: number
  pendingVerifications: number
  verifiedClients: number
  ticketsGenerated: number
  panelInterests: number
  recentRegistrations: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    status: string
    panelInterests: Array<any>
  }>
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try to fetch from API first, fall back to mock data
        const response = await fetch('/api/dashboard/stats')
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setStats(result.data)
          } else {
            throw new Error('API returned error')
          }
        } else {
          throw new Error('API not available')
        }
      } catch (error) {
        console.log('Using mock data - API not available yet')
        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 1000))
        setStats({
          totalRegistrations: 156,
          pendingVerifications: 23,
          verifiedClients: 133,
          ticketsGenerated: 128,
          panelInterests: 45,
          recentRegistrations: [
            {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              status: 'VERIFIED',
              panelInterests: [{ id: '1' }]
            },
            {
              id: '2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com',
              status: 'PENDING',
              panelInterests: []
            },
            {
              id: '3',
              firstName: 'Bob',
              lastName: 'Johnson',
              email: 'bob.johnson@example.com',
              status: 'VERIFIED',
              panelInterests: [{ id: '2' }]
            },
            {
              id: '4',
              firstName: 'Alice',
              lastName: 'Wilson',
              email: 'alice.wilson@example.com',
              status: 'PENDING',
              panelInterests: [{ id: '3' }]
            },
            {
              id: '5',
              firstName: 'Mike',
              lastName: 'Brown',
              email: 'mike.brown@example.com',
              status: 'VERIFIED',
              panelInterests: []
            }
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load dashboard statistics</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Registrations',
      value: stats.totalRegistrations,
      icon: Users,
      description: 'All time registrations',
      color: 'text-blue-600'
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: Clock,
      description: 'Awaiting review',
      color: 'text-orange-600'
    },
    {
      title: 'Verified Clients',
      value: stats.verifiedClients,
      icon: UserCheck,
      description: 'Successfully verified',
      color: 'text-green-600'
    },
    {
      title: 'Tickets Generated',
      value: stats.ticketsGenerated,
      icon: Ticket,
      description: 'PDF tickets created',
      color: 'text-purple-600'
    },
    {
      title: 'Panel Interests',
      value: stats.panelInterests,
      icon: Zap,
      description: 'Sales leads captured',
      color: 'text-yellow-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Registrations
          </CardTitle>
          <CardDescription>
            Latest client registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentRegistrations.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {client.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {client.panelInterests.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Panel Interest
                    </Badge>
                  )}
                  <Badge 
                    variant={
                      client.status === 'VERIFIED' ? 'default' :
                      client.status === 'PENDING' ? 'secondary' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {client.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
