// src/components/tickets/ticketUtils.ts - Utility functions for tickets
import { toast } from '@/components/ui/use-toast'
import { TicketData } from '@/app/admin/tickets/page'

/**
 * Download ticket PDF for a specific ticket
 */
export const downloadTicket = async (ticket: TicketData) => {
  try {
    console.log(`Downloading ticket for customer: ${ticket.customer.name}`)
    console.log(`Registration ID: ${ticket.customer.id}`)
    
    toast({
      title: "Downloading...",
      description: "Generating ticket PDF",
    })

    const response = await fetch(`/api/tickets/download?registrationId=${ticket.customer.id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    })
    
    console.log('Download response status:', response.status)
    
    if (!response.ok) {
      let errorMessage = 'Failed to download ticket'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(errorMessage)
    }
    
    // Check if response is actually a PDF
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/pdf')) {
      throw new Error('Invalid response format - expected PDF')
    }
    
    // Get the blob from response
    const blob = await response.blob()
    console.log('PDF blob size:', blob.size)
    
    if (blob.size === 0) {
      throw new Error('Empty PDF file received')
    }
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Set filename from response headers or use default
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `EMS_VIP_Ticket_${ticket.customer.name.replace(/\s+/g, '_')}.pdf`
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }
    
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 100)
    
    console.log(`Successfully downloaded: ${filename}`)
    
    toast({
      title: "Success",
      description: `Ticket downloaded: ${filename}`,
    })
  } catch (error: any) {
    console.error('Download error:', error)
    toast({
      title: "Download Failed",
      description: error.message || "Failed to download ticket",
      variant: "destructive",
    })
  }
}

/**
 * Format date for display in tickets
 */
export const formatTicketDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get ticket status configuration
 */
export const getTicketStatusConfig = (status: string) => {
  const statusConfigs = {
    GENERATED: {
      className: 'bg-orange-100 text-orange-700',
      label: 'Generated',
      description: 'Ticket created but not sent'
    },
    SENT: {
      className: 'bg-blue-100 text-blue-700',
      label: 'Sent',
      description: 'Ticket sent to customer'
    },
    COLLECTED: {
      className: 'bg-purple-100 text-purple-700',
      label: 'Collected',
      description: 'Ticket collected at booth'
    },
    USED: {
      className: 'bg-green-100 text-green-700',
      label: 'Used',
      description: 'Ticket used for entry'
    },
    EXPIRED: {
      className: 'bg-red-100 text-red-700',
      label: 'Expired',
      description: 'Ticket has expired'
    },
    CANCELLED: {
      className: 'bg-gray-100 text-gray-700',
      label: 'Cancelled',
      description: 'Ticket has been cancelled'
    }
  }
  
  return statusConfigs[status as keyof typeof statusConfigs] || statusConfigs.GENERATED
}

/**
 * Get available actions for a ticket based on its status
 */
export const getAvailableActions = (status: string) => {
  const actions = {
    GENERATED: ['SEND', 'COLLECT', 'REGENERATE', 'CANCEL'],
    SENT: ['COLLECT', 'REGENERATE', 'CANCEL'],
    COLLECTED: ['USE', 'REGENERATE', 'CANCEL'],
    USED: ['REGENERATE'],
    EXPIRED: ['REGENERATE', 'CANCEL'],
    CANCELLED: ['REGENERATE']
  }
  
  return actions[status as keyof typeof actions] || []
}

/**
 * Validate ticket data
 */
export const validateTicketData = (ticket: TicketData): boolean => {
  return !!(
    ticket.id &&
    ticket.ticketNumber &&
    ticket.customer?.id &&
    ticket.customer?.name &&
    ticket.customer?.email
  )
}