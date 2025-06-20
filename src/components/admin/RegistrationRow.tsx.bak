// src/components/admin/RegistrationRow.tsx - Enhanced to show full ID on hover and better search
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './StatusBadge'
import { ActionButtons } from './ActionButtons'
import { Building, Zap, Copy } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface RegistrationData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  idCardNumber: string
  status: string
  createdAt: string
  isEmsClient: boolean
  customerName?: string
  ticket?: {
    ticketNumber: string
    status: string
  }
  panelInterests: Array<{
    panelType: string
    interestLevel: string
  }>
}

interface RegistrationRowProps {
  registration: RegistrationData
  onView: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  processing?: boolean
}

export function RegistrationRow({ 
  registration, 
  onView, 
  onApprove, 
  onReject, 
  processing 
}: RegistrationRowProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyRegistrationId = () => {
    navigator.clipboard.writeText(registration.id).then(() => {
      toast({
        title: "Copied!",
        description: "Full registration ID copied to clipboard",
      })
    })
  }

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="py-2">
        <div>
          <p className="font-medium text-sm">{registration.firstName} {registration.lastName}</p>
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500">ID: {registration.id.slice(-8)}</p>
            <button
              onClick={copyRegistrationId}
              className="text-xs text-blue-600 hover:text-blue-800 p-1"
              title={`Full ID: ${registration.id} (click to copy)`}
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="py-2">
        <div className="space-y-1">
          <p className="text-xs">{registration.email}</p>
          <p className="text-xs text-gray-500">{registration.phone}</p>
        </div>
      </TableCell>
      
      <TableCell className="py-2">
        <div className="space-y-1">
          <Badge variant={registration.isEmsClient ? "default" : "outline"} className="text-xs">
            {registration.isEmsClient ? 'EMS' : 'Public'}
          </Badge>
          {registration.customerName && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Building className="h-3 w-3" />
              {registration.customerName}
            </p>
          )}
        </div>
      </TableCell>
      
      <TableCell className="py-2">
        <StatusBadge status={registration.status} />
      </TableCell>
      
      <TableCell className="py-2">
        {registration.ticket ? (
          <div>
            <p className="font-mono text-xs">{registration.ticket.ticketNumber}</p>
            <StatusBadge status={registration.ticket.status} compact />
          </div>
        ) : (
          <span className="text-xs text-gray-400">No ticket</span>
        )}
      </TableCell>
      
      <TableCell className="py-2">
        {registration.panelInterests.length > 0 ? (
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {registration.panelInterests[0].panelType}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">None</span>
        )}
      </TableCell>
      
      <TableCell className="py-2">
        <span className="text-xs text-gray-600">{formatDate(registration.createdAt)}</span>
      </TableCell>
      
      <TableCell className="py-2">
        <ActionButtons
          registrationId={registration.id}
          status={registration.status}
          onView={onView}
          onApprove={onApprove}
          onReject={onReject}
          processing={processing}
        />
      </TableCell>
    </TableRow>
  )
}
