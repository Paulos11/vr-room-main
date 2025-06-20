// src/middleware.ts - Enhanced performance and caching middleware
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname, searchParams } = request.nextUrl

  // Early return for static assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') // Likely a static file
  ) {
    return response
  }

  // Performance timing header
  const startTime = Date.now()
  response.headers.set('X-Request-Start', startTime.toString())

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

  // API route optimizations
  if (pathname.startsWith('/api/')) {
    // Enhanced CORS for admin routes
    if (pathname.startsWith('/api/admin/')) {
      const origin = request.headers.get('origin')
      const allowedOrigins = [
        'http://localhost:3000',
        'https://tickets.ems.com.mt',
        // Add your production domains
      ]

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    }

    // Smart caching for different API endpoints
    if (pathname.includes('/registrations')) {
      // Short cache for registration data
      response.headers.set('Cache-Control', 'private, max-age=30, s-maxage=0, must-revalidate')
    } else if (pathname.includes('/stats')) {
      // Longer cache for stats
      response.headers.set('Cache-Control', 'private, max-age=300, s-maxage=60, stale-while-revalidate=600')
    } else if (pathname.includes('/tickets/verify')) {
      // No cache for ticket verification
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    } else if (pathname.includes('/settings')) {
      // Medium cache for settings
      response.headers.set('Cache-Control', 'private, max-age=600, s-maxage=300, stale-while-revalidate=1800')
    } else {
      // Default: minimal cache for most API operations
      response.headers.set('Cache-Control', 'private, max-age=0, s-maxage=0, must-revalidate')
    }

    // Rate limiting headers (you can implement actual rate limiting here)
    response.headers.set('X-RateLimit-Limit', '1000')
    response.headers.set('X-RateLimit-Window', '3600')
  }

  // Admin route security
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  }

  // Payment route security
  if (pathname.startsWith('/payment')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Registration flow optimization
  if (pathname.startsWith('/register')) {
    // Prefetch key resources for better UX
    response.headers.set('Link', '</api/register>; rel=prefetch')
  }

  // Performance monitoring
  const processingTime = Date.now() - startTime
  response.headers.set('X-Response-Time', `${processingTime}ms`)

  // Enhanced security for production
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

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}