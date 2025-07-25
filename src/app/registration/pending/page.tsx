// src/app/registration/pending/page.tsx - Optimized to prevent client-side rendering

import { Suspense } from 'react'
import { RegistrationPendingContent } from '@/components/registration/RegistrationPendingContent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function RegistrationPendingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationPendingPage() {
  return (
    <Suspense fallback={<RegistrationPendingSkeleton />}>
      <RegistrationPendingContent />
    </Suspense>
  )
}