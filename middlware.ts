// src/middleware.ts - Complete authentication and security middleware
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ServerAuthService } from '@/lib/server-auth'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const startTime = Date.now()

  // Early return for static assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') && !pathname.includes('/api/')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // Security headers for all routes
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-DNS-Prefetch-Control': 'on',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Production security enhancements
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    response.headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://api.stripe.com; " +
      "frame-src https://js.stripe.com;"
    )
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const currentUser = ServerAuthService.getCurrentUser(request)
    
    if (!currentUser || !currentUser.isActive) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Add security headers for admin routes
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  }

  // Admin API route protection
  if (pathname.startsWith('/api/admin') && !pathname.includes('/auth/login')) {
    const currentUser = ServerAuthService.getCurrentUser(request)
    
    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check role-based permissions for sensitive operations
    if (pathname.includes('/users') && !ServerAuthService.hasRole(currentUser, 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }
  }

  // API route optimizations
  if (pathname.startsWith('/api/')) {
    // CORS for admin routes
    if (pathname.startsWith('/api/admin/')) {
      const origin = request.headers.get('origin')
      const allowedOrigins = [
        'http://localhost:3000',
        'https://tickets.ems.com.mt',
        process.env.NEXT_PUBLIC_SITE_URL
      ].filter(Boolean)

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Max-Age', '86400')
    }

    // Smart caching for different API endpoints
    if (pathname.includes('/registrations')) {
      response.headers.set('Cache-Control', 'private, max-age=30, s-maxage=0, must-revalidate')
    } else if (pathname.includes('/stats')) {
      response.headers.set('Cache-Control', 'private, max-age=300, s-maxage=60, stale-while-revalidate=600')
    } else if (pathname.includes('/tickets/verify')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    } else if (pathname.includes('/settings')) {
      response.headers.set('Cache-Control', 'private, max-age=600, s-maxage=300, stale-while-revalidate=1800')
    } else {
      response.headers.set('Cache-Control', 'private, max-age=0, s-maxage=0, must-revalidate')
    }
  }

  // Payment route security
  if (pathname.startsWith('/payment')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
  }

  // Performance monitoring
  const processingTime = Date.now() - startTime
  response.headers.set('X-Response-Time', `${processingTime}ms`)
  response.headers.set('X-Request-Start', startTime.toString())

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
