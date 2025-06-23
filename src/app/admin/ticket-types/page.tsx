// src/app/admin/ticket-types/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { Plus, Ticket } from 'lucide-react'

import { TicketTypeCard } from '@/components/admin/ticket-types/TicketTypeCard'
import { TicketTypeDialog } from '@/components/admin/ticket-types/TicketTypeDialog'
import { TicketTypeStats } from '@/components/admin/ticket-types/TicketTypeStats'

// Import shared types
import { TicketType, TicketTypesResponse } from '@/types/ticket'

export default function TicketTypesPage() {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTicketTypes()
  }, [])

  const fetchTicketTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/ticket-types')
      const result: TicketTypesResponse = await response.json()
      
      if (result.success) {
        setTicketTypes(result.data.ticketTypes || [])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch ticket types",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching ticket types:', error)
      toast({
        title: "Error",
        description: "Failed to fetch ticket types",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingTicket(null)
    setDialogOpen(true)
  }

  const handleSave = () => {
    setDialogOpen(false)
    setEditingTicket(null)
    fetchTicketTypes()
  }

  const handleToggleStatus = async (ticketTypeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/ticket-types/${ticketTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Ticket type ${!currentStatus ? 'enabled' : 'disabled'}`,
        })
        fetchTicketTypes()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update ticket type status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating ticket type status:', error)
      toast({
        title: "Error", 
        description: "Failed to update ticket type status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (ticketTypeId: string) => {
    if (!confirm('Are you sure you want to delete this ticket type? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/ticket-types/${ticketTypeId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Ticket type deleted successfully",
        })
        fetchTicketTypes()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete ticket type",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting ticket type:', error)
      toast({
        title: "Error",
        description: "Failed to delete ticket type",
        variant: "destructive",
      })
    }
  }

  // Filter ticket types by search
  const filteredTicketTypes = ticketTypes.filter(ticket => 
    ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ticket.category && ticket.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-blue-600" />
            Ticket Types
          </h1>
          <p className="text-gray-600">Manage ticket types and pricing</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket Type
            </Button>
          </DialogTrigger>
          
          <TicketTypeDialog
            ticket={editingTicket}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Statistics */}
      <TicketTypeStats ticketTypes={ticketTypes} />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search ticket types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                All ({ticketTypes.length})
              </Button>
              <Button variant="outline" size="sm">
                Active ({ticketTypes.filter(t => t.isActive).length})
              </Button>
              <Button variant="outline" size="sm">
                Inactive ({ticketTypes.filter(t => !t.isActive).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Types Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading ticket types...
          </div>
        </div>
      ) : filteredTicketTypes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching ticket types' : 'No ticket types yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search term' : 'Create your first ticket type to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create First Ticket Type
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTicketTypes.map(ticket => (
            <TicketTypeCard
              key={ticket.id}
              ticket={ticket}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
