// src/components/admin/RegistrationRow.tsx - Enhanced and optimized with better performance
import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Zap, Copy, Ticket, Users } from 'lucide-react'
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
  companyName?: string
  emsCustomerId?: string
  ticketCount: number
  tickets: Array<{
    id: string
    ticketNumber: string
    status: string
    ticketSequence: number
  }>
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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        className: 'bg-orange-100 text-orange-700 border-orange-300',
        label: 'Pending'
      },
      COMPLETED: {
        className: 'bg-green-100 text-green-700 border-green-300',
        label: 'Approved'
      },
      REJECTED: {
        className: 'bg-red-100 text-red-700 border-red-300',
        label: 'Rejected'
      },
      PAYMENT_PENDING: {
        className: 'bg-blue-100 text-blue-700 border-blue-300',
        label: 'Payment Due'
      },
      GENERATED: {
        className: 'bg-purple-100 text-purple-700 border-purple-300',
        label: 'Generated'
      },
      SENT: {
        className: 'bg-blue-100 text-blue-700 border-blue-300',
        label: 'Sent'
      },
      COLLECTED: {
        className: 'bg-teal-100 text-teal-700 border-teal-300',
        label: 'Collected'
      },
      USED: {
        className: 'bg-green-100 text-green-700 border-green-300',
        label: 'Used'
      }
    }
    return configs[status as keyof typeof configs] || {
      className: 'bg-gray-100 text-gray-700 border-gray-300',
      label: status
    }
  }

  const config = getStatusConfig(status)
  
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  )
}

// Memoized component for better performance
export const RegistrationRow = React.memo(function RegistrationRow({ 
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
        description: "Registration ID copied to clipboard",
        duration: 2000,
      })
    })
  }

  // Enhanced alternating colors with smooth transitions
  const isEven = index % 2 === 0
  const rowBg = isEven ? 'bg-white' : 'bg-gradient-to-r from-green-50/30 to-blue-50/20'
  const hoverBg = 'hover:bg-gradient-to-r hover:from-green-50/60 hover:to-blue-50/40 hover:shadow-sm'

  // Get the primary ticket for display
  const primaryTicket = registration.tickets?.[0]

  return (
    <TableRow className={`${rowBg} ${hoverBg} transition-all duration-300 border-b border-green-100/50 group`}>
      {/* Customer Information */}
      <TableCell className="py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-gray-900 group-hover:text-green-700 transition-colors">
              {registration.firstName} {registration.lastName}
            </p>
            {registration.isEmsClient && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                EMS
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
              {registration.id.slice(-8)}
            </p>
            <button
              onClick={copyRegistrationId}
              className="text-xs text-blue-600 hover:text-blue-800 p-1 rounded transition-all duration-200 hover:bg-blue-50 opacity-0 group-hover:opacity-100"
              title={`Copy full ID: ${registration.id}`}
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          
          {registration.companyName && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Building className="h-3 w-3" />
              <span className="truncate max-w-32">{registration.companyName}</span>
            </div>
          )}
        </div>
      </TableCell>
      
      {/* Contact Information */}
      <TableCell className="py-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
            {registration.email}
          </p>
          <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
            {registration.phone}
          </p>
        </div>
      </TableCell>
      
      {/* User Type */}
      <TableCell className="py-4">
        <div className="space-y-2">
          <Badge 
            variant={registration.isEmsClient ? "default" : "outline"} 
            className={`text-xs font-medium transition-all duration-200 ${
              registration.isEmsClient 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm' 
                : 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400'
            }`}
          >
            {registration.isEmsClient ? (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                EMS Customer
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                General Public
              </div>
            )}
          </Badge>
          
          {registration.emsCustomerId && (
            <p className="text-xs text-gray-600 font-mono bg-green-50 px-2 py-1 rounded">
              {registration.emsCustomerId}
            </p>
          )}
        </div>
      </TableCell>
      
      {/* Status */}
      <TableCell className="py-4">
        <StatusBadge status={registration.status} />
      </TableCell>
      
      {/* Tickets Information */}
      <TableCell className="py-4">
        <div className="space-y-2">
          {registration.ticketCount > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                  <Ticket className="h-3 w-3 mr-1" />
                  {registration.ticketCount} ticket{registration.ticketCount > 1 ? 's' : ''}
                </Badge>
              </div>
              
              {primaryTicket && (
                <div className="space-y-1">
                  <p className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {primaryTicket.ticketNumber}
                  </p>
                  <StatusBadge status={primaryTicket.status} />
                </div>
              )}
              
              {registration.ticketCount > 1 && (
                <p className="text-xs text-gray-500 italic">
                  +{registration.ticketCount - 1} more
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-2">
              <span className="text-xs text-gray-400 italic">No tickets</span>
              {registration.status === 'COMPLETED' && (
                <p className="text-xs text-blue-600 mt-1">Ready for generation</p>
              )}
            </div>
          )}
        </div>
      </TableCell>
      
      {/* Solar Panel Interest */}
      <TableCell className="py-4">
        {registration.panelInterests.length > 0 ? (
          <div className="space-y-2">
            <Badge 
              variant="outline" 
              className="text-xs border-orange-300 text-orange-700 bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-all duration-200"
            >
              <Zap className="h-3 w-3 mr-1 text-orange-600" />
              {registration.panelInterests[0].panelType.charAt(0).toUpperCase() + 
               registration.panelInterests[0].panelType.slice(1)}
            </Badge>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Interest:</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  registration.panelInterests[0].interestLevel === 'HIGH' 
                    ? 'border-red-300 text-red-700 bg-red-50' 
                    : registration.panelInterests[0].interestLevel === 'MEDIUM'
                    ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                    : 'border-gray-300 text-gray-700 bg-gray-50'
                }`}
              >
                {registration.panelInterests[0].interestLevel}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="text-xs text-gray-400 italic">No interest</span>
          </div>
        )}
      </TableCell>
      
      {/* Registration Date */}
      <TableCell className="py-4">
        <div className="text-center">
          <span className="text-xs text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-2 rounded-full font-medium">
            {formatDate(registration.createdAt)}
          </span>
        </div>
      </TableCell>
      
      {/* Actions */}
      <TableCell className="py-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(registration.id)}
            className="h-8 px-3 text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
          >
            View
          </Button>
          
          {registration.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                onClick={() => onApprove(registration.id)}
                disabled={processing}
                className="h-8 px-3 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm transition-all duration-200"
              >
                {processing ? 'Processing...' : 'Approve'}
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(registration.id)}
                disabled={processing}
                className="h-8 px-3 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
})