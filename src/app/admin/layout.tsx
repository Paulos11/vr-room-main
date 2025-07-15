// src/app/admin/layout.tsx - VR Room Malta Admin Layout
'use client'

import { usePathname } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AuthGuard } from '@/components/admin/AuthGuard'

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Don't wrap login page with AdminLayout
  if (pathname === '/admin/login') {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
          {children}
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  )
}