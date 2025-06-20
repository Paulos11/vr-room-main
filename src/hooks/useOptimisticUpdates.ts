// src/hooks/useOptimisticUpdates.ts
import { useState, useCallback } from 'react'

export function useOptimisticUpdates<T extends { id: string }>(initialData: T[]) {
  const [data, setData] = useState<T[]>(initialData)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<T>>>(new Map())

  const updateOptimistically = useCallback((id: string, updates: Partial<T>) => {
    // Apply optimistic update immediately
    setOptimisticUpdates(prev => new Map(prev.set(id, { ...prev.get(id), ...updates })))
    
    // Update actual data
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }, [])

  const clearOptimisticUpdate = useCallback((id: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  const getOptimizedData = useCallback(() => {
    return data.map(item => ({
      ...item,
      ...optimisticUpdates.get(item.id)
    }))
  }, [data, optimisticUpdates])

  return {
    data: getOptimizedData(),
    updateOptimistically,
    clearOptimisticUpdate,
    setData
  }
}
