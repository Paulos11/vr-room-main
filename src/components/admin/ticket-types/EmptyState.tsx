// src/components/admin/ticket-types/EmptyState.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Ticket, Plus } from 'lucide-react'

interface EmptyStateProps {
  searchTerm: string
  filterCategory: string
  filterStatus: string
  onCreateFirst: () => void
}

export function EmptyState({ 
  searchTerm, 
  filterCategory, 
  filterStatus, 
  onCreateFirst 
}: EmptyStateProps) {
  const hasFilters = searchTerm || filterCategory !== 'all' || filterStatus !== 'all'

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          No Ticket Types Found
        </h3>
        <p className="text-gray-500 mb-4">
          {hasFilters
            ? 'Try adjusting your search or filters'
            : 'Create your first ticket type to get started'
          }
        </p>
        {!hasFilters && (
          <Button onClick={onCreateFirst} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create First Ticket Type
          </Button>
        )}
      </CardContent>
    </Card>
  )
}