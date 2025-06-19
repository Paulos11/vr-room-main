
// src/app/admin/page.tsx
import { DashboardStats } from '@/components/admin/DashboardStats'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of EMS Trade Fair registrations and activities
        </p>
      </div>
      
      <DashboardStats />
    </div>
  )
}
