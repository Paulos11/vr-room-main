
// src/components/admin/StatusBadge.tsx
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: string
  compact?: boolean
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { 
          variant: 'default' as const, 
          className: 'bg-green-100 text-green-800 border-green-300',
          label: compact ? 'Approved' : 'Approved'
        }
      case 'PENDING':
        return { 
          variant: 'secondary' as const, 
          className: 'bg-orange-100 text-orange-800 border-orange-300',
          label: compact ? 'Pending' : 'Pending'
        }
      case 'PAYMENT_PENDING':
        return { 
          variant: 'outline' as const, 
          className: 'bg-blue-100 text-blue-800 border-blue-300',
          label: compact ? 'Payment' : 'Payment Due'
        }
      case 'REJECTED':
        return { 
          variant: 'destructive' as const, 
          className: '',
          label: compact ? 'Rejected' : 'Rejected'
        }
      default:
        return { 
          variant: 'secondary' as const, 
          className: '',
          label: status
        }
    }
  }

  const config = getStatusConfig(status)
  
  return (
    <Badge variant={config.variant} className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}
