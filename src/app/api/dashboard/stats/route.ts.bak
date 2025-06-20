
// src/app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock data for demonstration
    // In a real app, this would fetch from your database
    const stats = {
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
          createdAt: new Date().toISOString(),
          panelInterests: [{ id: '1', panelType: 'commercial' }]
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          panelInterests: []
        },
        {
          id: '3',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          status: 'VERIFIED',
          createdAt: new Date().toISOString(),
          panelInterests: [{ id: '2', panelType: 'residential' }]
        },
        {
          id: '4',
          firstName: 'Alice',
          lastName: 'Wilson',
          email: 'alice.wilson@example.com',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          panelInterests: [{ id: '3', panelType: 'smart' }]
        },
        {
          id: '5',
          firstName: 'Mike',
          lastName: 'Brown',
          email: 'mike.brown@example.com',
          status: 'VERIFIED',
          createdAt: new Date().toISOString(),
          panelInterests: []
        }
      ]
    }
    
    return NextResponse.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
