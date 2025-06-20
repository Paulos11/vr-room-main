// src/middleware.ts - API performance and caching middleware
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add performance headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // CORS for admin routes
    if (request.nextUrl.pathname.startsWith('/api/admin/')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
    
    // Cache control for different API endpoints
    if (request.nextUrl.pathname.includes('/registrations')) {
      // Short cache for registration data to keep it fresh
      response.headers.set('Cache-Control', 'private, max-age=30, must-revalidate')
    } else if (request.nextUrl.pathname.includes('/stats')) {
      // Longer cache for stats that don't change frequently
      response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')
    } else {
      // Default: no cache for sensitive operations
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
    }
  }
  
  // Add general performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  return response
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match admin routes for additional security
    '/admin/:path*',
  ],
}
