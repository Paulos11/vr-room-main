// src/app/admin/registrations/page.tsx - Fixed version
import { Suspense } from 'react'
import { RegistrationsTable } from "@/components/admin/RegistrationsTable"

// Add this to prevent static generation for this admin page
export const dynamic = 'force-dynamic'

// Optional: Add these for better control
export const revalidate = 0 // Don't cache this page
export const fetchCache = 'force-no-store' // Don't cache API calls

function RegistrationsContent() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
        <p className="mt-2 text-gray-600">
          Manage client registrations and verification process
        </p>
      </div>
      
      <RegistrationsTable />
    </div>
  )
}

export default function RegistrationsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
          <p className="mt-2 text-gray-600">Loading registrations...</p>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <RegistrationsContent />
    </Suspense>
  )
}