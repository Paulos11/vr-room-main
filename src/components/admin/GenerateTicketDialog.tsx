
// src/components/admin/GenerateTicketDialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Plus, Search } from 'lucide-react'

interface GenerateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketsGenerated: () => void
}

interface RegistrationOption {
  id: string
  name: string
  email: string
  isEmsClient: boolean
  status: string
  ticketCount: number
}

export function GenerateTicketDialog({ open, onOpenChange, onTicketsGenerated }: GenerateTicketDialogProps) {
  const [registrationSearch, setRegistrationSearch] = useState('')
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationOption | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [searchResults, setSearchResults] = useState<RegistrationOption[]>([])
  const [searching, setSearching] = useState(false)

  const searchRegistrations = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/registrations/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()
      
      if (result.success) {
        setSearchResults(result.data.map((reg: any) => ({
          id: reg.id,
          name: `${reg.firstName} ${reg.lastName}`,
          email: reg.email,
          isEmsClient: reg.isEmsClient,
          status: reg.status,
          ticketCount: reg.ticketCount || 0
        })))
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedRegistration) {
      toast({
        title: "Error",
        description: "Please select a registration",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/admin/tickets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: selectedRegistration.id,
          quantity,
          adminUser: 'Admin User' // Get from auth context
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        
        onTicketsGenerated()
        onOpenChange(false)
        
        // Reset form
        setSelectedRegistration(null)
        setRegistrationSearch('')
        setQuantity(1)
        setSearchResults([])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to generate tickets",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate tickets",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate New Tickets</DialogTitle>
          <DialogDescription>
            Generate additional tickets for existing registrations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Registration Search */}
          <div>
            <Label htmlFor="registration">Search Registration</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="registration"
                placeholder="Search by name, email..."
                value={registrationSearch}
                onChange={(e) => {
                  setRegistrationSearch(e.target.value)
                  searchRegistrations(e.target.value)
                }}
                className="pl-9"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                {searchResults.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => {
                      setSelectedRegistration(reg)
                      setRegistrationSearch(`${reg.name} (${reg.email})`)
                      setSearchResults([])
                    }}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-medium text-sm">{reg.name}</div>
                    <div className="text-xs text-gray-500">{reg.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        reg.isEmsClient ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reg.isEmsClient ? 'EMS' : 'Public'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {reg.ticketCount} existing ticket{reg.ticketCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Registration */}
          {selectedRegistration && (
            <div className="p-3 bg-green-50 rounded-md">
              <div className="font-medium text-sm">{selectedRegistration.name}</div>
              <div className="text-xs text-gray-600">{selectedRegistration.email}</div>
              <div className="text-xs text-gray-500 mt-1">
                Current tickets: {selectedRegistration.ticketCount}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Number of Tickets</Label>
            <Select 
              value={quantity.toString()} 
              onValueChange={(value) => setQuantity(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} ticket{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={!selectedRegistration || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate {quantity} Ticket{quantity > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// src/app/api/admin/registrations/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }
    
    const registrations = await prisma.registration.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ],
        status: {
          in: ['COMPLETED', 'PENDING', 'PAYMENT_PENDING']
        }
      },
      include: {
        tickets: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    
    const formattedResults = registrations.map(reg => ({
      id: reg.id,
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email,
      isEmsClient: reg.isEmsClient,
      status: reg.status,
      ticketCount: reg.tickets.length,
      createdAt: reg.createdAt
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedResults
    })
    
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, message: 'Search failed', error: error.message },
      { status: 500 }
    )
  }
}