// src/app/admin/registrations/page.tsx - Optimized for speed
import { Suspense } from 'react'
import { OptimizedRegistrationsTable } from "@/components/admin/OptimizedRegistrationsTable"

// Force dynamic for admin pages
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Compact loading skeleton
function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white rounded-lg border animate-pulse">
        <div className="p-4 border-b">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 flex items-center px-4">
              <div className="flex-1 grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RegistrationsContent() {
  return (
    <div className="p-6 space-y-4">
      <OptimizedRegistrationsTable />
    </div>
  )
}

export default function RegistrationsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RegistrationsContent />
    </Suspense>
  )
}