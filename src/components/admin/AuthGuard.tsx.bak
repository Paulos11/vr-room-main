
// src/components/admin/AuthGuard.tsx (Fixed version)
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && pathname !== '/admin/login') {
    return null // Will redirect to login
  }

  return <>{children}</>
}
