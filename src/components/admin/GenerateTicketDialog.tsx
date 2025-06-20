// src/components/admin/GenerateTicketDialog.tsx - Compact and optimized
'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Plus, Search, User, Building } from 'lucide-react'

interface GenerateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface RegistrationOption {
  id: string
  name: string
  email: string
  isEmsClient: boolean
  status: string
  ticketCount: number
}

export function GenerateTicketDialog({ open, onOpenChange, onSuccess }: GenerateTicketDialogProps) {
  const [registrationSearch, setRegistrationSearch] = useState('')
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationOption | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [searchResults, setSearchResults] = useState<RegistrationOption[]>([])
  const [searching, setSearching] = useState(false)

  const searchRegistrations = useCallback(async (query: string) => {
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
  }, [])

  const handleGenerate = useCallback(async () => {
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
          adminUser: 'Admin User'
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `${quantity} ticket(s) generated successfully`,
        })
        
        onSuccess()
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
  }, [selectedRegistration, quantity, onSuccess, onOpenChange])

  const selectRegistration = (reg: RegistrationOption) => {
    setSelectedRegistration(reg)
    setRegistrationSearch(`${reg.name} (${reg.email})`)
    setSearchResults([])
  }

  const clearSelection = () => {
    setSelectedRegistration(null)
    setRegistrationSearch('')
    setSearchResults([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-0 bg-white shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
            Generate New Tickets
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Create additional tickets for existing registrations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Registration Search */}
          <div>
            <Label htmlFor="registration" className="text-sm font-medium text-gray-700">
              Find Registration
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="registration"
                placeholder="Search by name or email..."
                value={registrationSearch}
                onChange={(e) => {
                  setRegistrationSearch(e.target.value)
                  searchRegistrations(e.target.value)
                }}
                className="pl-10 h-10 border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-green-500" />
              )}
              {registrationSearch && !searching && (
                <button
                  onClick={clearSelection}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Compact Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border-2 border-green-100 rounded-lg bg-white shadow-lg">
                {searchResults.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => selectRegistration(reg)}
                    className="w-full p-3 text-left hover:bg-green-50 border-b border-green-50 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                          {reg.isEmsClient ? (
                            <Building className="h-4 w-4 text-green-600" />
                          ) : (
                            <User className="h-4 w-4 text-blue-600" />
                          )}
                          {reg.name}
                        </div>
                        <div className="text-xs text-gray-600">{reg.email}</div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          reg.isEmsClient 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {reg.isEmsClient ? 'EMS' : 'Public'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {reg.ticketCount} existing
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Registration Display */}
          {selectedRegistration && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedRegistration.isEmsClient ? (
                    <Building className="h-5 w-5 text-green-600" />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {selectedRegistration.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {selectedRegistration.email}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRegistration.isEmsClient 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedRegistration.isEmsClient ? 'EMS Customer' : 'General Public'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedRegistration.ticketCount} existing tickets
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div>
            <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Number of Tickets
            </Label>
            <Select 
              value={quantity.toString()} 
              onValueChange={(value) => setQuantity(parseInt(value))}
            >
              <SelectTrigger className="mt-1 h-10 border-2 border-gray-200 focus:border-blue-400">
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
          <div className="pt-2">
            <Button 
              onClick={handleGenerate}
              disabled={!selectedRegistration || generating}
              className="w-full h-11 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 font-semibold transition-all duration-200"
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
            
            {!selectedRegistration && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Please search and select a registration above
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// src/app/api/admin/registrations/search/route.ts - Optimized search API
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
        tickets: {
          select: { id: true }
        }
      },
      take: 10,
      orderBy: [
        { status: 'asc' }, // Prioritize COMPLETED registrations
        { createdAt: 'desc' }
      ]
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