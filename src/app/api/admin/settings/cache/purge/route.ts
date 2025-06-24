// src/app/api/admin/settings/cache/purge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ServerAuthService } from '@/lib/server-auth'
import { revalidateTag, revalidatePath } from 'next/cache'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const CACHE_LOG_DIR = path.join(process.cwd(), 'logs')
const CACHE_LOG_FILE = path.join(CACHE_LOG_DIR, 'cache-purge.log')

interface CachePurgeLog {
  timestamp: string
  purgedBy: string
  success: boolean
  details: string[]
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const currentUser = ServerAuthService.getCurrentUser(request)
    if (!currentUser || !ServerAuthService.hasRole(currentUser, 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const purgeStartTime = Date.now()
    const purgeDetails: string[] = []
    let hasErrors = false

    try {
      // 1. Revalidate all pages
      const pagePaths = [
        '/',
        '/register',
        '/admin',
        '/admin/registrations',
        '/admin/tickets',
        '/admin/ticket-types',
        '/admin/coupons',
        '/admin/panels',
        '/admin/settings'
      ]

      for (const path of pagePaths) {
        try {
          revalidatePath(path, 'page')
          purgeDetails.push(`✓ Revalidated page: ${path}`)
        } catch (error) {
          purgeDetails.push(`✗ Failed to revalidate page: ${path}`)
          hasErrors = true
        }
      }

      // 2. Revalidate API routes with tags
      const apiTags = [
        'registrations',
        'tickets',
        'ticket-types',
        'coupons',
        'admin-users',
        'settings',
        'stats',
        'payments'
      ]

      for (const tag of apiTags) {
        try {
          revalidateTag(tag)
          purgeDetails.push(`✓ Revalidated tag: ${tag}`)
        } catch (error) {
          purgeDetails.push(`✗ Failed to revalidate tag: ${tag}`)
          hasErrors = true
        }
      }

      // 3. Clear specific API routes
      const apiPaths = [
        '/api/registrations',
        '/api/tickets',
        '/api/admin/stats',
        '/api/admin/registrations',
        '/api/admin/tickets',
        '/api/admin/users'
      ]

      for (const apiPath of apiPaths) {
        try {
          revalidatePath(apiPath, 'layout')
          purgeDetails.push(`✓ Revalidated API: ${apiPath}`)
        } catch (error) {
          purgeDetails.push(`✗ Failed to revalidate API: ${apiPath}`)
          hasErrors = true
        }
      }

      // 4. Clear layout cache
      try {
        revalidatePath('/', 'layout')
        revalidatePath('/admin', 'layout')
        purgeDetails.push('✓ Revalidated layout cache')
      } catch (error) {
        purgeDetails.push('✗ Failed to revalidate layout cache')
        hasErrors = true
      }

      const purgeEndTime = Date.now()
      const purgeDuration = purgeEndTime - purgeStartTime

      // Log the purge operation
      await logCachePurge({
        timestamp: new Date().toISOString(),
        purgedBy: currentUser.email || currentUser.id,
        success: !hasErrors,
        details: purgeDetails,
        error: hasErrors ? 'Some cache invalidation operations failed' : undefined
      })

      purgeDetails.push(`⏱️ Cache purge completed in ${purgeDuration}ms`)

      return NextResponse.json({
        success: true,
        message: hasErrors 
          ? 'Cache purge completed with some errors' 
          : 'All cache purged successfully',
        data: {
          duration: purgeDuration,
          details: purgeDetails,
          hasErrors,
          timestamp: new Date().toISOString()
        }
      })

    } catch (purgeError) {
      console.error('Cache purge error:', purgeError)
      
      await logCachePurge({
        timestamp: new Date().toISOString(),
        purgedBy: currentUser.email || currentUser.id,
        success: false,
        details: purgeDetails,
        error: purgeError instanceof Error ? purgeError.message : 'Unknown error during cache purge'
      })

      return NextResponse.json(
        { 
          success: false, 
          message: 'Cache purge failed',
          error: purgeError instanceof Error ? purgeError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in cache purge endpoint:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process cache purge request' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get cache purge history
    if (!existsSync(CACHE_LOG_FILE)) {
      return NextResponse.json({
        success: true,
        data: {
          lastPurged: null,
          history: []
        }
      })
    }

    const logData = await readFile(CACHE_LOG_FILE, 'utf-8')
    const logs: CachePurgeLog[] = logData
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(log => log !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const lastPurged = logs.length > 0 ? logs[0].timestamp : null

    return NextResponse.json({
      success: true,
      data: {
        lastPurged,
        history: logs.slice(0, 10) // Return last 10 purge operations
      }
    })
  } catch (error) {
    console.error('Error fetching cache history:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch cache history' },
      { status: 500 }
    )
  }
}

async function logCachePurge(logEntry: CachePurgeLog) {
  try {
    // Ensure logs directory exists
    if (!existsSync(CACHE_LOG_DIR)) {
      await mkdir(CACHE_LOG_DIR, { recursive: true })
    }

    const logLine = JSON.stringify(logEntry) + '\n'
    await writeFile(CACHE_LOG_FILE, logLine, { flag: 'a' })
  } catch (error) {
    console.error('Error logging cache purge:', error)
  }
}