// src/middleware.ts - Updated with maintenance mode support
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ServerAuthService } from '@/lib/server-auth'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

const MAINTENANCE_FILE = path.join(process.cwd(), '.maintenance')
const MAINTENANCE_CONFIG_FILE = path.join(process.cwd(), 'config', 'maintenance.json')

interface MaintenanceConfig {
  enabled: boolean
  message: string
  allowedIPs: string[]
  enabledAt: string
  enabledBy: string
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (clientIP) {
    return clientIP
  }
  
  // Fallback to connection remote address
  return request.ip || '127.0.0.1'
}

function isMaintenanceMode(clientIP: string): { isActive: boolean; config?: MaintenanceConfig } {
  if (!existsSync(MAINTENANCE_FILE)) {
    return { isActive: false }
  }

  let config: MaintenanceConfig = {
    enabled: true,
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    allowedIPs: [],
    enabledAt: '',
    enabledBy: ''
  }

  if (existsSync(MAINTENANCE_CONFIG_FILE)) {
    try {
      const configData = readFileSync(MAINTENANCE_CONFIG_FILE, 'utf-8')
      config = { ...config, ...JSON.parse(configData) }
    } catch (error) {
      console.error('Error reading maintenance config:', error)
    }
  }

  // Check if client IP is in allowed list
  if (config.allowedIPs.includes(clientIP)) {
    return { isActive: false, config }
  }

  return { isActive: true, config }
}

function createMaintenancePage(config: MaintenanceConfig): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Maintenance Mode - EMS Trade Fair</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          max-width: 600px;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        p {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }
        .refresh-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        .footer {
          margin-top: 2rem;
          font-size: 0.9rem;
          opacity: 0.7;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔧</div>
        <h1>Under Maintenance</h1>
        <p>${config.message}</p>
        <button class="refresh-btn" onclick="window.location.reload()">
          Try Again
        </button>
        <div class="footer">
          <p>EMS Trade Fair 2025 | MFCC Ta' Qali, Malta</p>
        </div>
      </div>
      <script>
        // Auto-refresh every 60 seconds
        setTimeout(() => {
          window.location.reload();
        }, 60000);
      </script>
    </body>
    </html>
  `
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const startTime = Date.now()
  const clientIP = getClientIP(request)

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

  // Check maintenance mode for non-admin routes
  if (!pathname.startsWith('/admin')) {
    const maintenanceCheck = isMaintenanceMode(clientIP)
    
    if (maintenanceCheck.isActive && maintenanceCheck.config) {
      return new NextResponse(
        createMaintenancePage(maintenanceCheck.config),
        {
          status: 503,
          headers: {
            'Content-Type': 'text/html',
            'Retry-After': '3600', // Suggest retry after 1 hour
            ...Object.fromEntries(Object.entries(securityHeaders))
          }
        }
      )
    }
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
  response.headers.set('X-Client-IP', clientIP)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}