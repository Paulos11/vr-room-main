// src/components/admin/ticket-types/TicketTypeCard.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Power, 
  PowerOff, 
  Trash2, 
  Users, 
  Calendar,
  Tag,
  AlertTriangle
} from 'lucide-react'

// Import shared types
import { TicketTypeCardProps } from '@/types/ticket'

export function TicketTypeCard({ ticket, onEdit, onToggleStatus, onDelete }: TicketTypeCardProps) {
  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const salesPercentage = ticket.totalStock > 0 ? (ticket.soldStock / ticket.totalStock) * 100 : 0
  const isLowStock = ticket.availableStock <= 10 && ticket.availableStock > 0
  const isOutOfStock = ticket.availableStock === 0

  return (
    <Card className={`transition-all duration-200 ${
      ticket.isActive 
        ? 'border-green-200 hover:border-green-300' 
        : 'border-gray-200 opacity-60'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {ticket.name}
              {ticket.featured && (
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              )}
            </CardTitle>
            
            {ticket.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {ticket.description}
              </p>
            )}
            
            <div className="text-2xl font-bold text-green-600 mt-2">
              {formatPrice(ticket.priceInCents)}
            </div>
          </div>
          
          <div className="flex flex-col gap-1 items-end">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              ticket.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {ticket.isActive ? 'Active' : 'Disabled'}
            </div>
            
            {isOutOfStock && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Out of Stock
              </div>
            )}
            
            {isLowStock && !isOutOfStock && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Low Stock
              </div>
            )}
          </div>
        </div>

        {/* Category and Tags */}
        {(ticket.category || ticket.tags) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {ticket.category && (
              <Badge variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {ticket.category}
              </Badge>
            )}
            {ticket.tags && JSON.parse(ticket.tags).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Target Audience */}
        {(ticket.emsClientsOnly || ticket.publicOnly) && (
          <div className="mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>
                {ticket.emsClientsOnly ? 'EMS Clients Only' : 
                 ticket.publicOnly ? 'Public Only' : 'All Customers'}
              </span>
            </div>
          </div>
        )}

        {/* Stock Info */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Total Stock:</span>
            <span className="font-medium">{ticket.totalStock}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Sold:</span>
            <span className="font-medium text-green-600">{ticket.soldStock}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Available:</span>
            <span className={`font-medium ${
              isOutOfStock ? 'text-red-600' : 
              isLowStock ? 'text-yellow-600' : 'text-blue-600'
            }`}>
              {ticket.availableStock}
            </span>
          </div>
          {ticket.reservedStock > 0 && (
            <div className="flex justify-between text-sm">
              <span>Reserved:</span>
              <span className="font-medium text-orange-600">{ticket.reservedStock}</span>
            </div>
          )}
        </div>

        {/* Sales Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Sales Progress</span>
            <span>{salesPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                salesPercentage >= 90 ? 'bg-green-500' :
                salesPercentage >= 70 ? 'bg-blue-500' :
                salesPercentage >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(salesPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Revenue */}
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-lg font-bold text-green-600">
            {formatPrice(ticket.soldStock * ticket.priceInCents)}
          </div>
        </div>

        {/* Availability Dates */}
        {(ticket.availableFrom || ticket.availableUntil) && (
          <div className="mb-4 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-1 text-sm text-blue-700 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Availability</span>
            </div>
            {ticket.availableFrom && (
              <div className="text-xs text-blue-600">
                From: {formatDate(ticket.availableFrom)}
              </div>
            )}
            {ticket.availableUntil && (
              <div className="text-xs text-blue-600">
                Until: {formatDate(ticket.availableUntil)}
              </div>
            )}
          </div>
        )}

        {/* Order Limits */}
        {(ticket.minPerOrder > 1 || ticket.maxPerOrder < 10) && (
          <div className="mb-4 text-xs text-gray-600">
            Order limits: {ticket.minPerOrder} - {ticket.maxPerOrder} per order
          </div>
        )}

        {/* Warnings */}
        {isOutOfStock && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-1 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Out of stock - customers cannot purchase</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(ticket)}
            className="flex-1"
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          
          <Button
            variant={ticket.isActive ? "destructive" : "default"}
            size="sm"
            onClick={() => onToggleStatus(ticket.id, ticket.isActive)}
            className="flex-1"
          >
            {ticket.isActive ? (
              <>
                <PowerOff className="mr-1 h-3 w-3" />
                Disable
              </>
            ) : (
              <>
                <Power className="mr-1 h-3 w-3" />
                Enable
              </>
            )}
          </Button>
          
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(ticket.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Admin Notes */}
        {ticket.notes && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
            <div className="text-xs text-yellow-700 font-medium mb-1">Admin Notes:</div>
            <div className="text-xs text-yellow-600">{ticket.notes}</div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-3 text-xs text-gray-500 border-t pt-2">
          <div>Created: {formatDate(ticket.createdAt)}</div>
          <div>Updated: {formatDate(ticket.updatedAt)}</div>
          <div>Sort Order: {ticket.sortOrder}</div>
        </div>
      </CardContent>
    </Card>
  )
}
