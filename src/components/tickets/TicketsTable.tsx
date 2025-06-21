// src/components/tickets/TicketsTable.tsx
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Ticket, Plus } from 'lucide-react'
import { TicketData } from '@/app/admin/tickets/page'
import { TicketRow } from './TicketRow'

interface TicketsTableProps {
  tickets: TicketData[]
  loading: boolean
  processingAction: string | null
  onTicketAction: (ticketId: string, action: string) => void
  onGenerateTickets: () => void
}

export const TicketsTable = React.memo(function TicketsTable({
  tickets,
  loading,
  processingAction,
  onTicketAction,
  onGenerateTickets
}: TicketsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="h-10 text-xs font-medium">Ticket #</TableHead>
              <TableHead className="h-10 text-xs font-medium">Customer</TableHead>
              <TableHead className="h-10 text-xs font-medium">Status</TableHead>
              <TableHead className="h-10 text-xs font-medium">Generated</TableHead>
              <TableHead className="h-10 text-xs font-medium">Delivery</TableHead>
              <TableHead className="h-10 text-xs font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j} className="py-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tickets.length > 0 ? (
              tickets.map((ticket, index) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                  processing={processingAction === ticket.id}
                  onAction={onTicketAction}
                />
              ))
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                      <Ticket className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">No tickets found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Generate tickets for approved registrations to get started
                      </p>
                    </div>
                    <Button 
                      onClick={onGenerateTickets}
                      variant="outline"
                      className="mt-2 hover:bg-green-50 hover:border-green-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate First Ticket
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
})