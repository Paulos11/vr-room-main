// src/components/admin/RegistrationStatusCard.tsx - Payment-Gated Ticket Status
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  CreditCard,
  Ticket,
  User,
  Play,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Shield
} from 'lucide-react'

interface RegistrationStatusProps {
  registrationId: string
  isEmsClient: boolean
  currentStatus: string
  paymentStatus?: string
  hasTickets: boolean
  onStatusChange?: () => void
}

interface TicketGenerationStatus {
  canGenerateTickets: boolean
  hasTickets: boolean
  reason: string
  nextSteps: string[]
  paymentStatus?: string
  registrationStatus: string
  progress: number
}

export function RegistrationStatusCard({ 
  registrationId, 
  isEmsClient, 
  currentStatus, 
  paymentStatus,
  hasTickets,
  onStatusChange 
}: RegistrationStatusProps) {
  const [status, setStatus] = useState<TicketGenerationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchTicketStatus()
  }, [registrationId, currentStatus, paymentStatus])

  const fetchTicketStatus = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would call your API
      // For now, we'll simulate the logic
      const mockStatus = calculateTicketStatus()
      setStatus(mockStatus)
      
    } catch (error) {
      console.error('Failed to fetch ticket status:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTicketStatus = (): TicketGenerationStatus => {
    let progress = 0
    let canGenerate = false
    let reason = ''
    let nextSteps: string[] = []

    if (hasTickets) {
      return {
        canGenerateTickets: false,
        hasTickets: true,
        reason: 'Tickets already generated and ready',
        nextSteps: ['View tickets', 'Resend to customer', 'Check customer in'],
        paymentStatus,
        registrationStatus: currentStatus,
        progress: 100
      }
    }

    if (isEmsClient) {
      // VIP Client Flow
      if (currentStatus === 'VERIFIED' || currentStatus === 'COMPLETED') {
        progress = 100
        canGenerate = true
        reason = 'VIP client ready for complimentary tickets'
        nextSteps = ['Generate free VR tickets', 'Send tickets to customer']
      } else if (currentStatus === 'PENDING') {
        progress = 50
        reason = 'VIP client pending verification'
        nextSteps = ['Verify VIP client status', 'Generate tickets after verification']
      } else {
        progress = 25
        reason = 'VIP client registration incomplete'
        nextSteps = ['Complete registration', 'Verify VIP status']
      }
    } else {
      // Public Customer Flow
      if (currentStatus === 'COMPLETED' && paymentStatus === 'SUCCEEDED') {
        progress = 100
        canGenerate = true
        reason = 'Payment completed - ready for ticket generation'
        nextSteps = ['Generate VR tickets automatically', 'Send tickets to customer']
      } else if (currentStatus === 'PAYMENT_PENDING' || paymentStatus === 'PENDING') {
        progress = 75
        reason = 'Waiting for payment completion'
        nextSteps = ['Customer needs to complete payment', 'Tickets will generate automatically after payment']
      } else if (currentStatus === 'VERIFIED') {
        progress = 50
        reason = 'Registration verified, awaiting payment'
        nextSteps = ['Send payment link to customer', 'Process payment', 'Generate tickets']
      } else if (currentStatus === 'PENDING') {
        progress = 25
        reason = 'Registration pending admin review'
        nextSteps = ['Review and verify registration', 'Process payment', 'Generate tickets']
      } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
        progress = 75
        reason = 'Payment failed - tickets blocked'
        nextSteps = ['Retry payment process', 'Contact customer', 'Admin override if needed']
      } else {
        progress = 10
        reason = 'Registration incomplete'
        nextSteps = ['Complete registration process', 'Verify customer', 'Process payment']
      }
    }

    return {
      canGenerateTickets: canGenerate,
      hasTickets: false,
      reason,
      nextSteps,
      paymentStatus,
      registrationStatus: currentStatus,
      progress
    }
  }

  const handleGenerateTickets = async () => {
    try {
      setGenerating(true)
      
      // Call ticket generation API
      const response = await fetch(`/api/admin/registrations/${registrationId}/generate-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminOverride: true })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "🎫 Tickets Generated",
          description: `Successfully generated ${result.ticketCount || 1} VR tickets`,
        })
        onStatusChange?.()
        fetchTicketStatus()
      } else {
        throw new Error(result.message || 'Failed to generate tickets')
      }
      
    } catch (error: any) {
      toast({
        title: "❌ Generation Failed",
        description: error.message || 'Could not generate VR tickets',
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
    if (!status) return <AlertCircle className="h-5 w-5 text-gray-400" />
    
    if (status.hasTickets) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (status.canGenerateTickets) return <Ticket className="h-5 w-5 text-[#01AEED]" />
    if (isEmsClient) return <Shield className="h-5 w-5 text-purple-600" />
    return <Clock className="h-5 w-5 text-orange-500" />
  }

  const getStatusColor = () => {
    if (!status) return 'text-gray-600'
    if (status.hasTickets) return 'text-green-600'
    if (status.canGenerateTickets) return 'text-[#01AEED]'
    if (status.progress < 50) return 'text-red-600'
    return 'text-orange-600'
  }

  const getProgressColor = () => {
    if (!status) return 'bg-gray-200'
    if (status.hasTickets || status.progress === 100) return 'bg-green-500'
    if (status.progress >= 75) return 'bg-[#01AEED]'
    if (status.progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="border-l-4 border-l-[#01AEED]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          VR Ticket Generation Status
          {isEmsClient && (
            <Badge className="bg-purple-100 text-purple-800 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              VIP Client
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress to VR Tickets</span>
            <span className="font-medium">{status?.progress || 0}%</span>
          </div>
          <Progress 
            value={status?.progress || 0} 
            className="h-2"
            style={{ 
              background: '#f3f4f6',
            }}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Registration</span>
            <span>Payment</span>
            <span>Tickets</span>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className={`mt-1 ${getStatusColor()}`}>
              {status?.hasTickets ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${getStatusColor()}`}>
                {status?.reason || 'Loading status...'}
              </p>
              
              {/* Payment Status for Public Customers */}
              {!isEmsClient && status?.paymentStatus && (
                <div className="mt-2 flex items-center gap-2">
                  <CreditCard className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">
                    Payment: 
                    <Badge variant="outline" className="ml-1 text-xs">
                      {status.paymentStatus}
                    </Badge>
                  </span>
                </div>
              )}

              {/* Registration Status */}
              <div className="mt-1 flex items-center gap-2">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">
                  Registration: 
                  <Badge variant="outline" className="ml-1 text-xs">
                    {status?.registrationStatus || currentStatus}
                  </Badge>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {status?.nextSteps && status.nextSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Next Steps
            </h4>
            <ul className="space-y-1">
              {status.nextSteps.map((step, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#01AEED] rounded-full"></div>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          {status?.canGenerateTickets && (
            <Button
              onClick={handleGenerateTickets}
              disabled={generating}
              className="flex-1 bg-[#01AEED] hover:bg-[#01AEED]/90"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  Generate VR Tickets
                </>
              )}
            </Button>
          )}

          {status?.hasTickets && (
            <Button
              variant="outline"
              onClick={() => window.open(`/admin/tickets?registration=${registrationId}`, '_blank')}
              className="flex-1 border-[#01AEED] text-[#01AEED] hover:bg-[#01AEED]/10"
            >
              <Play className="h-4 w-4 mr-2" />
              View VR Tickets
            </Button>
          )}

          {!status?.canGenerateTickets && !status?.hasTickets && !isEmsClient && (
            <Button
              variant="outline"
              onClick={() => window.open(`/admin/payments?registration=${registrationId}`, '_blank')}
              className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Manage Payment
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTicketStatus}
            disabled={loading}
            className="px-3"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Warning for Admin Override */}
        {!status?.canGenerateTickets && !status?.hasTickets && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium">Admin Override Available</p>
                <p className="mt-1">
                  Tickets can be manually generated regardless of payment status. 
                  Use the ticket management section for admin overrides.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIP Benefits Notice */}
        {isEmsClient && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-purple-600 mt-0.5" />
              <div className="text-xs text-purple-800">
                <p className="font-medium">VIP Client Benefits</p>
                <p className="mt-1">
                  • Complimentary VR tickets
                  • Priority booking
                  • No payment required
                  • Instant ticket generation upon verification
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}