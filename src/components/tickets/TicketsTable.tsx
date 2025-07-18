// UPDATED: src/components/tickets/TicketsTable.tsx - Fixed button logic and download
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { 
  Ticket, Plus, Download, Send, CheckCircle, X, RotateCcw, RefreshCw,
  Building, Users, Copy, Phone, Mail, AlertTriangle, Tag
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

// ✅ UPDATED: Enhanced TicketData interface with ticket type
export interface TicketData {
  id: string
  ticketNumber: string
  status: string
  sequence: number
  issuedAt: string
  sentAt?: string
  collectedAt?: string
  collectedBy?: string
  // ✅ NEW: Ticket type information
  ticketType: {
    id: string
    name: string
    description?: string
    category?: string
    priceInCents: number
  }
  customer: {
    id: string
    name: string
    email: string
    phone: string
    isEmsClient: boolean
    registrationStatus: string
  }
  lastCheckIn?: {
    checkedInAt: string
    checkedInBy: string
    location: string
  }
}

interface TicketsTableProps {
  tickets: TicketData[]
  loading: boolean
  processingAction: string | null
  onTicketAction: (ticketId: string, action: string) => void
  onGenerateTickets: () => void
}

// Status Badge Component - ✅ REMOVED: COLLECTED status
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    GENERATED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', label: 'Generated', icon: '●' },
    SENT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', label: 'Sent', icon: '●' },
    // ✅ REMOVED: COLLECTED status completely
    USED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', label: 'Used', icon: '●' },
    EXPIRED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', label: 'Expired', icon: '●' },
    CANCELLED: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', label: 'Cancelled', icon: '●' },
    REFUNDED: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Refunded', icon: '●' }
  }[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', label: status, icon: '●' }

  return (
    <Badge variant="outline" className={`text-xs ${config.bg} ${config.text} ${config.border}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}

// Confirmation Dialog Component
const ConfirmationDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description, 
  confirmText, 
  variant = "destructive" 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string
  variant?: "destructive" | "default"
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${variant === "destructive" ? "text-red-500" : "text-orange-500"}`} />
          {title}
        </DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button 
          variant={variant} 
          onClick={() => {
            onConfirm()
            onOpenChange(false)
          }}
        >
          {confirmText}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Compact Ticket Row
const TicketRow = React.memo(({ ticket, index, processing, onAction }: {
  ticket: TicketData
  index: number
  processing: boolean
  onAction: (id: string, action: string) => void
}) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: string
    title: string
    description: string
    confirmText: string
    variant: "destructive" | "default"
  }>({
    open: false,
    action: '',
    title: '',
    description: '',
    confirmText: '',
    variant: 'destructive'
  })

  const copyTicketNumber = () => {
    navigator.clipboard.writeText(ticket.ticketNumber)
    toast({ title: "Copied!", description: "Ticket number copied to clipboard" })
  }

  // ✅ FIXED: Download all active tickets for this user (excluding USED)
  const handleDownload = () => {
    const downloadUrl = `/api/admin/tickets/download/${ticket.id}`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `tickets-${ticket.ticketNumber}.pdf` // Will be renamed by server
    link.target = '_blank' // Fallback: open in new tab
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Download Started",
      description: `Downloading active tickets for this customer (excluding used tickets)`,
    })
  }

  const handleActionWithConfirmation = (action: string) => {
    const actionConfigs = {
      CANCEL: {
        title: "Cancel Ticket",
        description: `Are you sure you want to cancel ticket ${ticket.ticketNumber}? This action cannot be undone and the customer will not be able to use this ticket.`,
        confirmText: "Cancel Ticket",
        variant: "destructive" as const
      }
    }

    const config = actionConfigs[action as keyof typeof actionConfigs]
    if (config) {
      setConfirmDialog({
        open: true,
        action,
        ...config
      })
    } else {
      onAction(ticket.id, action)
    }
  }

  const confirmAction = () => {
    onAction(ticket.id, confirmDialog.action)
  }

  const isEven = index % 2 === 0
  const rowBg = isEven ? 'bg-white' : 'bg-gray-50/30'

  return (
    <>
      <TableRow className={`h-14 ${rowBg} hover:bg-blue-50/30 transition-colors group`}>
        {/* Ticket Number & Type */}
        <TableCell className="py-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                {ticket.ticketNumber}
              </code>
              <button 
                onClick={copyTicketNumber}
                className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy ticket number"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
            {/* ✅ NEW: Show sequence and ticket type on same line */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Seq: #{ticket.sequence}</span>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3 text-purple-500" />
                <span className="text-purple-600 font-medium">{ticket.ticketType.name}</span>
              </div>
            </div>
          </div>
        </TableCell>

        {/* Customer */}
        <TableCell className="py-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-gray-900">{ticket.customer.name}</p>
              <Badge variant={ticket.customer.isEmsClient ? "default" : "outline"} className="text-xs">
                {ticket.customer.isEmsClient ? (
                  <><Building className="h-3 w-3 mr-1" />EMS</>
                ) : (
                  <><Users className="h-3 w-3 mr-1" />Public</>
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-32">{ticket.customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="h-3 w-3" />
              <span>{ticket.customer.phone}</span>
            </div>
          </div>
        </TableCell>

        {/* Status */}
        <TableCell className="py-2">
          <StatusBadge status={ticket.status} />
        </TableCell>

        {/* Generated */}
        <TableCell className="py-2">
          <div className="text-center">
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {new Date(ticket.issuedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </TableCell>

        {/* Delivery Status - ✅ UPDATED: Remove collected status */}
        <TableCell className="py-2">
          <div className="space-y-1">
            {ticket.sentAt && (
              <div className="text-xs text-blue-600">
                Sent: {new Date(ticket.sentAt).toLocaleDateString()}
              </div>
            )}
            {/* ✅ REMOVED: collectedAt display */}
            {!ticket.sentAt && (
              <span className="text-xs text-gray-400 italic">Not delivered</span>
            )}
          </div>
        </TableCell>

        {/* ✅ FIXED: Actions with correct button priority */}
        <TableCell className="py-2">
          <div className="flex gap-1">
            {/* Download Button - Always available */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="h-7 px-2 text-xs hover:bg-green-50"
              title="Download active tickets for this customer"
            >
              <Download className="h-3 w-3" />
            </Button>

            {/* ✅ FIXED: For GENERATED tickets - Show USE button first (primary), SEND second */}
            {ticket.status === 'GENERATED' && (
              <>
                {/* USE Button - Primary action (green) */}
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAction(ticket.id, 'USE')}
                  disabled={processing}
                  className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600 text-white"
                  title="Check-in ticket (mark as used)"
                >
                  {processing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                </Button>

                {/* Send Button - Secondary action (blue outline) */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(ticket.id, 'SEND')}
                  disabled={processing}
                  className="h-7 px-2 text-xs border-blue-500 text-blue-500 hover:bg-blue-50"
                  title="Mark as sent to customer"
                >
                  {processing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
              </>
            )}

            {/* ✅ FIXED: For SENT tickets - Show USE button only */}
            {ticket.status === 'SENT' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onAction(ticket.id, 'USE')}
                disabled={processing}
                className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600 text-white"
                title="Check-in ticket (mark as used)"
              >
                {processing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
              </Button>
            )}

            {/* Cancel Button - Available for active tickets */}
            {ticket.status !== 'USED' && ticket.status !== 'CANCELLED' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleActionWithConfirmation('CANCEL')}
                disabled={processing}
                className="h-7 px-2 text-xs"
                title="Cancel ticket"
              >
                <X className="h-3 w-3" />
              </Button>
            )}

            {/* ✅ NEW: Status indicators for completed tickets */}
            {ticket.status === 'USED' && (
              <div className="flex items-center text-green-600 text-xs font-medium px-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Used
              </div>
            )}

            {ticket.status === 'CANCELLED' && (
              <div className="flex items-center text-red-600 text-xs font-medium px-2">
                <X className="h-3 w-3 mr-1" />
                Cancelled
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        onConfirm={confirmAction}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </>
  )
})

export const TicketsTable = React.memo(function TicketsTable({
  tickets,
  loading,
  processingAction,
  onTicketAction,
  onGenerateTickets
}: TicketsTableProps) {
  return (
    <Card className="overflow-hidden shadow-sm border-green-100">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-b-2 border-green-200">
              <TableHead className="py-3 text-xs font-semibold text-gray-700">Ticket # & Type</TableHead>
              <TableHead className="py-3 text-xs font-semibold text-gray-700">Customer</TableHead>
              <TableHead className="py-3 text-xs font-semibold text-gray-700">Status</TableHead>
              <TableHead className="py-3 text-xs font-semibold text-gray-700">Generated</TableHead>
              <TableHead className="py-3 text-xs font-semibold text-gray-700">Delivery</TableHead>
              <TableHead className="py-3 text-xs font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Compact loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j} className="py-3">
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer"></div>
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
              // Enhanced empty state
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-sm">
                      <Ticket className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium text-lg">No tickets found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Generate tickets for approved registrations to get started
                      </p>
                      <Button 
                        onClick={onGenerateTickets}
                        variant="outline"
                        className="mt-4 hover:bg-green-50 hover:border-green-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate First Ticket
                      </Button>
                    </div>
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