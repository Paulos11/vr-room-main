// src/components/tickets/TicketRow.tsx
import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  MoreHorizontal,
  Send,
  CheckCircle,
  QrCode,
  RefreshCw,
  AlertCircle,
  Clock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TicketData } from '@/app/admin/tickets/page'
import { downloadTicket } from './ticketUtils'

interface TicketRowProps {
  ticket: TicketData
  index: number
  processing: boolean
  onAction: (ticketId: string, action: string) => void
}

export const TicketRow = React.memo(function TicketRow({
  ticket,
  index,
  processing,
  onAction
}: TicketRowProps) {
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { className: string; icon: any }> = {
      GENERATED: { className: 'bg-orange-100 text-orange-700', icon: Clock },
      SENT: { className: 'bg-blue-100 text-blue-700', icon: Send },
      COLLECTED: { className: 'bg-purple-100 text-purple-700', icon: CheckCircle },
      USED: { className: 'bg-green-100 text-green-700', icon: CheckCircle },
      EXPIRED: { className: 'bg-red-100 text-red-700', icon: AlertCircle },
      CANCELLED: { className: 'bg-gray-100 text-gray-700', icon: AlertCircle }
    }

    const config = statusStyles[status] || statusStyles.GENERATED
    const Icon = config.icon

    return (
      <Badge className={`text-xs font-medium ${config.className} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <TableRow 
      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/50 transition-colors`}
    >
      {/* Ticket Number */}
      <TableCell className="py-2">
        <div>
          <p className="font-mono text-sm font-semibold text-gray-800">
            {ticket.ticketNumber}
          </p>
          {ticket.sequence > 1 && (
            <p className="text-xs text-gray-500">#{ticket.sequence}</p>
          )}
        </div>
      </TableCell>
      
      {/* Customer */}
      <TableCell className="py-2">
        <div className="space-y-1">
          <p className="font-semibold text-sm">{ticket.customer.name}</p>
          <p className="text-xs text-gray-600">{ticket.customer.email}</p>
          <Badge 
            className={`text-xs ${
              ticket.customer.isEmsClient 
                ? 'bg-green-100 text-green-700 border-0' 
                : 'bg-blue-100 text-blue-700 border-0'
            }`}
          >
            {ticket.customer.isEmsClient ? 'EMS' : 'Public'}
          </Badge>
        </div>
      </TableCell>
      
      {/* Status */}
      <TableCell className="py-2">
        {getStatusBadge(ticket.status)}
      </TableCell>
      
      {/* Generated Date */}
      <TableCell className="py-2">
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {formatDate(ticket.issuedAt)}
        </span>
      </TableCell>
      
      {/* Delivery Info */}
      <TableCell className="py-2">
        <div className="text-xs space-y-1">
          {ticket.sentAt && (
            <div className="text-blue-600">Sent: {formatDate(ticket.sentAt)}</div>
          )}
          {ticket.collectedAt && (
            <div className="text-purple-600">
              Collected: {formatDate(ticket.collectedAt)}
              {ticket.collectedBy && <div className="text-gray-500">by {ticket.collectedBy}</div>}
            </div>
          )}
          {!ticket.sentAt && !ticket.collectedAt && (
            <span className="text-gray-400 italic">Not delivered</span>
          )}
        </div>
      </TableCell>
      
      {/* Actions */}
      <TableCell className="py-2">
        <div className="flex gap-1">
          {/* Download Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => downloadTicket(ticket)}
            className="h-7 w-7 p-0 hover:bg-blue-50 text-blue-600"
            title="Download PDF"
          >
            <Download className="h-3 w-3" />
          </Button>
          
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0 hover:bg-green-50"
                disabled={processing}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Status-specific actions */}
              {ticket.status === 'GENERATED' && (
                <DropdownMenuItem onClick={() => onAction(ticket.id, 'SEND')}>
                  <Send className="w-4 h-4 mr-2 text-blue-600" />
                  Mark as Sent
                </DropdownMenuItem>
              )}
              
              {(ticket.status === 'SENT' || ticket.status === 'GENERATED') && (
                <DropdownMenuItem onClick={() => onAction(ticket.id, 'COLLECT')}>
                  <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                  Mark as Collected
                </DropdownMenuItem>
              )}
              
              {ticket.status === 'COLLECTED' && (
                <DropdownMenuItem onClick={() => onAction(ticket.id, 'USE')}>
                  <QrCode className="w-4 h-4 mr-2 text-green-600" />
                  Check In
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Universal actions */}
              <DropdownMenuItem onClick={() => onAction(ticket.id, 'REGENERATE')}>
                <RefreshCw className="w-4 h-4 mr-2 text-orange-600" />
                Regenerate
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onAction(ticket.id, 'CANCEL')}
                className="text-red-600 focus:text-red-600"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
})