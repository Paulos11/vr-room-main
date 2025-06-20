// src/app/admin/page.tsx - Compact dashboard with EMS styling
import { DashboardStats } from '@/components/admin/DashboardStats'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EMS Tickets</h1>
          <p className="text-gray-600">
            Real-time overview of registrations, tickets, and activities
          </p>
          
          {/* Quick Actions */}
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700">System Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Last Updated: Just now</span>
            </div>
          </div>
        </div>
        
        <DashboardStats />
      </div>
    </div>
  )
}