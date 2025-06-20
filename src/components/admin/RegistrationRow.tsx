// src/components/admin/RegistrationRow.tsx - Enhanced with EMS colors and smooth interactions
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
  index: number
}

export function RegistrationRow({ 
  registration, 
  onView, 
  onApprove, 
  onReject, 
  processing,
  index 
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

  // Alternating row colors with EMS theme
  const isEven = index % 2 === 0
  const rowBg = isEven ? 'bg-white' : 'bg-green-50/30'
  const hoverBg = isEven ? 'hover:bg-green-50/50' : 'hover:bg-green-50/70'

  return (
    <TableRow className={`${rowBg} ${hoverBg} transition-all duration-200 border-b border-green-100/50`}>
      <TableCell className="py-3">
        <div>
          <p className="font-semibold text-sm text-gray-900">
            {registration.firstName} {registration.lastName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500 font-mono">
              ID: {registration.id.slice(-8)}
            </p>
            <button
              onClick={copyRegistrationId}
              className="text-xs text-blue-600 hover:text-blue-800 p-1 rounded transition-colors hover:bg-blue-50"
              title={`Full ID: ${registration.id} (click to copy)`}
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="py-3">
        <div className="space-y-1">
          <p className="text-sm text-gray-700">{registration.email}</p>
          <p className="text-xs text-gray-500 font-mono">{registration.phone}</p>
        </div>
      </TableCell>
      
      <TableCell className="py-3">
        <div className="space-y-2">
          <Badge 
            variant={registration.isEmsClient ? "default" : "outline"} 
            className={`text-xs font-medium ${
              registration.isEmsClient 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
            }`}
          >
            {registration.isEmsClient ? 'EMS Customer' : 'General Public'}
          </Badge>
          {registration.customerName && (
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3 text-green-600" />
              <p className="text-xs text-gray-600 truncate max-w-24">
                {registration.customerName}
              </p>
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell className="py-3">
        <StatusBadge status={registration.status} />
      </TableCell>
      
      <TableCell className="py-3">
        {registration.ticket ? (
          <div className="space-y-1">
            <p className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
              {registration.ticket.ticketNumber}
            </p>
            <StatusBadge status={registration.ticket.status} compact />
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">No ticket issued</span>
        )}
      </TableCell>
      
      <TableCell className="py-3">
        {registration.panelInterests.length > 0 ? (
          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
            <Zap className="h-3 w-3 mr-1 text-orange-600" />
            Solar Panels
          </Badge>
        ) : (
          <span className="text-xs text-gray-400 italic">No interest</span>
        )}
      </TableCell>
      
      <TableCell className="py-3">
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {formatDate(registration.createdAt)}
        </span>
      </TableCell>
      
      <TableCell className="py-3">
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