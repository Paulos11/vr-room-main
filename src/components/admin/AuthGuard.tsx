// src/components/admin/AuthGuard.tsx - Clean and compact with EMS colors
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { Loader2, Shield } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Don't protect the login page
        if (pathname === '/admin/login') {
          setIsLoading(false)
          setIsAuthenticated(true)
          return
        }

        const authService = AuthService.getInstance()
        const authenticated = authService.isAuthenticated()
        
        setIsAuthenticated(authenticated)
        setIsLoading(false)
        
        if (!authenticated) {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsLoading(false)
        router.push('/admin/login')
      }
    }

    // Small delay to ensure client-side hydration
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-green-600 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Verifying Access</h3>
          <p className="text-gray-600 text-sm">Checking your authentication status...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && pathname !== '/admin/login') {
    return null // Will redirect to login
  }

  return <>{children}</>
}
