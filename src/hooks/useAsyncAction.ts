// src/hooks/useAsyncAction.ts
import { useState, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'

interface UseAsyncActionOptions<T = any> {
  successMessage?: string
  errorMessage?: string
  onSuccess?: (result: T) => void
  onError?: (error: any) => void
}

export function useAsyncAction<T = any>(options: UseAsyncActionOptions<T> = {}) {
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (
    action: () => Promise<T>,
    optimisticUpdate?: () => void
  ): Promise<T | undefined> => {
    if (loading) return // Prevent double execution

    setLoading(true)
    
    // Apply optimistic update immediately
    optimisticUpdate?.()

    try {
      const result = await action()
      
      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        })
      }
      
      options.onSuccess?.(result)
      return result
    } catch (error) {
      console.error('Action failed:', error)
      
      toast({
        title: "Error",
        description: options.errorMessage || "Action failed. Please try again.",
        variant: "destructive",
      })
      
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [loading, options])

  return { execute, loading }
}