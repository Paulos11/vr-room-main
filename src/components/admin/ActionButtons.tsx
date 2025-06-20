
// src/components/admin/ActionButtons.tsx
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  registrationId: string
  status: string
  onView: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  processing?: boolean
}

export function ActionButtons({ 
  registrationId, 
  status, 
  onView, 
  onApprove, 
  onReject, 
  processing 
}: ActionButtonsProps) {
  return (
    <div className="flex gap-1">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onView(registrationId)}
        className="h-7 px-2 text-xs"
      >
        View
      </Button>
      
      {status === 'PENDING' && (
        <>
          <Button 
            size="sm" 
            onClick={() => onApprove(registrationId)}
            disabled={processing}
            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
          >
            {processing ? '...' : 'Approve'}
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => onReject(registrationId)}
            disabled={processing}
            className="h-7 px-2 text-xs"
          >
            Reject
          </Button>
        </>
      )}
    </div>
  )
}
