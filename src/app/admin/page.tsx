// src/app/admin/page.tsx - VR Room Malta Admin Dashboard
import { DashboardStats } from '@/components/admin/DashboardStats'

function StatusIndicator({ 
  color, 
  label, 
  status 
}: { 
  color: string
  label: string
  status: string 
}) {
  return (
    <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg border border-gray-200/50 backdrop-blur-sm">
      <div className={`w-2 h-2 ${color} rounded-full`}></div>
      <span className="text-xs text-gray-600">{label}:</span>
      <span className="text-xs text-gray-800 font-medium">{status}</span>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#01AEED]/10 via-blue-50/50 to-[#01AEED]/10 backdrop-blur-sm p-6 rounded-xl border border-[#01AEED]/20 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#01AEED] to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">VR</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  VR Room Malta
                  <span className="text-sm bg-[#01AEED]/20 text-[#01AEED] px-3 py-1 rounded-full border border-[#01AEED]/30">
                    Admin Dashboard
                  </span>
                </h1>
                <p className="text-gray-600 text-sm">
                  Real-time monitoring for VR experiences, bookings & customer management
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Systems Online</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-[#01AEED] rounded-full"></div>
              <span className="text-xs text-gray-500">Bugibba, Malta</span>
            </div>
            <div className="text-xs text-gray-400">
              Last sync: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#01AEED]/20">
          <StatusIndicator 
            color="bg-green-400" 
            label="VR Rooms Active" 
            status="4/4"
          />
          <StatusIndicator 
            color="bg-[#01AEED]" 
            label="Booking System" 
            status="Online"
          />
          <StatusIndicator 
            color="bg-purple-400" 
            label="Payment Gateway" 
            status="Active"
          />
          <StatusIndicator 
            color="bg-orange-400" 
            label="Queue Status" 
            status="3 waiting"
          />
        </div>
      </div>
      
      <DashboardStats />
    </div>
  )
}