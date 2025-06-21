// src/app/ticket-status/page.tsx - Hydration safe wrapper
'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Loading component that matches the page structure
const LoadingTicketStatus = () => (
  <div className="min-h-screen bg-white relative overflow-hidden">
    {/* Background Decorations */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-60"></div>
      <div className="absolute top-20 left-20 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-40"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full opacity-50"></div>
      <div className="absolute bottom-32 right-32 w-28 h-28 bg-gradient-to-br from-purple-100 to-green-100 rounded-full opacity-45"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-50 to-blue-50 rounded-full opacity-30 blur-3xl"></div>
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 opacity-60"></div>
    </div>

    <div className="relative z-10 container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="w-full max-w-2xl mx-auto bg-white shadow-lg border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Dynamically import the actual component with no SSR
const TicketStatusContent = dynamic(
  () => import('./TicketStatusContent'), 
  { 
    ssr: false,
    loading: () => <LoadingTicketStatus />
  }
)

export default function TicketStatusPage() {
  return (
    <Suspense fallback={<LoadingTicketStatus />}>
      <TicketStatusContent />
    </Suspense>
  )
}