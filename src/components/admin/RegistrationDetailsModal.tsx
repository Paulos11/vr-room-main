
// src/components/admin/RegistrationDetailsModal.tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './StatusBadge'
import { Users, Building, Zap, Ticket, Copy } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface RegistrationDetailsModalProps {
  registration: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  processing: boolean
  notes: string
  onNotesChange: (notes: string) => void
}

export function RegistrationDetailsModal({
  registration,
  open,
  onOpenChange,
  onApprove,
  onReject,
  processing,
  notes,
  onNotesChange
}: RegistrationDetailsModalProps) {
  if (!registration) return null

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Registration Details
            <StatusBadge status={registration.status} />
          </DialogTitle>
          <DialogDescription>
            Registration ID: {registration.id}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(registration.id, 'Registration ID')}
              className="ml-2 h-6 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4" />
              Personal Details
            </div>
            <div className="space-y-2 text-sm bg-gray-50 p-3 rounded">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-medium">{registration.firstName} {registration.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-medium">{registration.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="font-medium">{registration.phone}</span>
              </div>
              <div className="flex justify-between">
                <span>ID Number:</span>
                <span className="font-mono text-xs">{registration.idCardNumber}</span>
              </div>
            </div>
          </div>

          {/* Status & Ticket */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Ticket className="h-4 w-4" />
              Status & Ticket
            </div>
            <div className="space-y-2 text-sm bg-gray-50 p-3 rounded">
              <div className="flex justify-between">
                <span>Status:</span>
                <StatusBadge status={registration.status} />
              </div>
              <div className="flex justify-between">
                <span>Registered:</span>
                <span>{new Date(registration.createdAt).toLocaleDateString()}</span>
              </div>
              {registration.ticket && (
                <>
                  <div className="flex justify-between">
                    <span>Ticket:</span>
                    <span className="font-mono text-xs">{registration.ticket.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ticket Status:</span>
                    <StatusBadge status={registration.ticket.status} compact />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* EMS Customer Info */}
        {registration.isEmsClient && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Building className="h-4 w-4" />
              EMS Customer Information
            </div>
            <div className="bg-green-50 p-3 rounded text-sm space-y-1">
              {registration.customerName && (
                <p><strong>Customer Name:</strong> {registration.customerName}</p>
              )}
              {registration.emsCustomerId && (
                <p><strong>Customer ID:</strong> {registration.emsCustomerId}</p>
              )}
            </div>
          </div>
        )}

        {/* Panel Interests */}
        {registration.panelInterests.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Zap className="h-4 w-4" />
              Panel Interests
            </div>
            <div className="space-y-2">
              {registration.panelInterests.map((interest: any) => (
                <div key={interest.id} className="bg-blue-50 p-3 rounded text-sm">
                  <div className="flex justify-between items-center">
                    <span className="capitalize font-medium">{interest.panelType} Panels</span>
                    <Badge variant="outline" className="text-xs">
                      {interest.interestLevel}
                    </Badge>
                  </div>
                  {interest.notes && (
                    <p className="text-gray-600 mt-1">{interest.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div className="space-y-2">
          <label className="font-medium text-sm">Admin Notes</label>
          <Textarea
            placeholder="Add notes about this registration..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
          />
        </div>

        {/* Actions */}
        {registration.status === 'PENDING' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={() => onApprove(registration.id)}
              disabled={processing}
              className="flex-1"
            >
              {processing ? 'Processing...' : 'Approve & Generate Ticket'}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => onReject(registration.id)}
              disabled={processing}
              className="flex-1"
            >
              Reject Registration
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
