import { apiCache } from "./api-cache"

// src/lib/api-helpers.ts - Performance utilities for API routes
export function withPerformance<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheKey?: string,
  cacheTTL = 60
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now()
    
    // Try cache first if key provided
    if (cacheKey) {
      const cached = apiCache.get(cacheKey)
      if (cached) {
        console.log(`Cache hit for ${cacheKey} (${Date.now() - start}ms)`)
        return cached
      }
    }
    
    try {
      const result = await fn(...args)
      
      // Cache successful results
      if (cacheKey && result) {
        apiCache.set(cacheKey, result, cacheTTL)
      }
      
      console.log(`API call completed in ${Date.now() - start}ms`)
      return result
    } catch (error) {
      console.error(`API call failed after ${Date.now() - start}ms:`, error)
      throw error
    }
  }
}

export function createCacheKey(prefix: string, params: Record<string, any>) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  return `${prefix}:${sortedParams}`
}