
// src/app/admin/layout.tsx - Simplified and clean
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
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