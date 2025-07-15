// src/app/admin/registrations/page.tsx - VR Room Malta Registrations Page
import { Suspense } from 'react'
import { OptimizedRegistrationsTable } from "@/components/admin/OptimizedRegistrationsTable"

// Force dynamic for admin pages
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Loading skeleton with VR theme
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-[#01AEED]/10 via-blue-50/50 to-[#01AEED]/10 p-6 rounded-xl animate-pulse border border-[#01AEED]/20">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
            <div>
              <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
          <div className="w-10 h-8 bg-gray-300 rounded"></div>
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Filters skeleton */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 animate-pulse">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded max-w-md"></div>
          <div className="w-48 h-10 bg-gray-200 rounded"></div>
          <div className="w-48 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
        <div className="p-0">
          {/* Table header */}
          <div className="bg-[#01AEED]/5 p-4 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
          
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-100">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main content component
function RegistrationsContent() {
  return (
    <div className="space-y-6">
      <OptimizedRegistrationsTable />
    </div>
  )
}

// Main page component
export default function RegistrationsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RegistrationsContent />
    </Suspense>
  )
}