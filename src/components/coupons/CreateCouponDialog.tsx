// src/components/coupons/CreateCouponDialog.tsx
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Tag, Percent, Euro, Calendar, Users, Building, Globe } from 'lucide-react'

interface CreateCouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface CouponFormData {
  code: string
  name: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: string
  minOrderAmount: string
  maxUses: string
  maxUsesPerUser: string
  validFrom: string
  validTo: string
  emsClientsOnly: boolean
  publicOnly: boolean
  notes: string
}

export function CreateCouponDialog({ open, onOpenChange, onSuccess }: CreateCouponDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    maxUsesPerUser: '1',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    emsClientsOnly: false,
    publicOnly: true, // Default to Public Only
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required'
    } else if (formData.code.length < 2) {
      newErrors.code = 'Code must be at least 2 characters'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Coupon name is required'
    }

    if (!formData.discountValue) {
      newErrors.discountValue = 'Discount value is required'
    } else {
      const value = parseFloat(formData.discountValue)
      if (isNaN(value) || value <= 0) {
        newErrors.discountValue = 'Discount value must be a positive number'
      }
      if (formData.discountType === 'PERCENTAGE' && value > 100) {
        newErrors.discountValue = 'Percentage cannot exceed 100%'
      }
    }

    if (formData.minOrderAmount && parseFloat(formData.minOrderAmount) < 0) {
      newErrors.minOrderAmount = 'Minimum order amount cannot be negative'
    }

    if (formData.maxUses && parseInt(formData.maxUses) < 1) {
      newErrors.maxUses = 'Maximum uses must be at least 1'
    }

    if (formData.maxUsesPerUser && parseInt(formData.maxUsesPerUser) < 1) {
      newErrors.maxUsesPerUser = 'Max uses per user must be at least 1'
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Start date is required'
    }

    if (formData.validTo && formData.validFrom && new Date(formData.validTo) <= new Date(formData.validFrom)) {
      newErrors.validTo = 'End date must be after start date'
    }

    if (formData.emsClientsOnly && formData.publicOnly) {
      newErrors.audience = 'Cannot be both EMS-only and Public-only'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: formData.discountType === 'PERCENTAGE' 
          ? parseInt(formData.discountValue)
          : Math.round(parseFloat(formData.discountValue) * 100), // Convert to cents
        minOrderAmount: formData.minOrderAmount ? Math.round(parseFloat(formData.minOrderAmount) * 100) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        maxUsesPerUser: parseInt(formData.maxUsesPerUser),
        validTo: formData.validTo || undefined
      }

      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Coupon created successfully",
        })
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create coupon",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '',
      maxUses: '',
      maxUsesPerUser: '1',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      emsClientsOnly: false,
      publicOnly: false,
      notes: ''
    })
    setErrors({})
  }

  const updateField = (field: keyof CouponFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    updateField('code', `SAVE${random}`)
  }

  const previewDiscount = () => {
    if (!formData.discountValue) return null
    const value = parseFloat(formData.discountValue)
    if (isNaN(value)) return null
    
    return formData.discountType === 'PERCENTAGE' 
      ? `${value}% off`
      : `€${value.toFixed(2)} off`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-green-600" />
            Create New Coupon
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                      placeholder="e.g., SAVE20"
                      className={errors.code ? 'border-red-300' : ''}
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Generate
                    </Button>
                  </div>
                  {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Display Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Summer Discount"
                    className={errors.name ? 'border-red-300' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief description of the coupon"
                />
              </div>
            </CardContent>
          </Card>

          {/* Discount Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Discount Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <Select 
                    value={formData.discountType} 
                    onValueChange={(value: 'PERCENTAGE' | 'FIXED_AMOUNT') => updateField('discountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Percentage
                        </div>
                      </SelectItem>
                      <SelectItem value="FIXED_AMOUNT">
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4" />
                          Fixed Amount
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Discount Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : '(€)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    min="0"
                    max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                    value={formData.discountValue}
                    onChange={(e) => updateField('discountValue', e.target.value)}
                    className={errors.discountValue ? 'border-red-300' : ''}
                  />
                  {errors.discountValue && <p className="text-sm text-red-600">{errors.discountValue}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Min Order (€)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => updateField('minOrderAmount', e.target.value)}
                    placeholder="Optional"
                    className={errors.minOrderAmount ? 'border-red-300' : ''}
                  />
                  {errors.minOrderAmount && <p className="text-sm text-red-600">{errors.minOrderAmount}</p>}
                </div>
              </div>

              {/* Discount Preview */}
              {previewDiscount() && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Preview:</strong> Customers will get <Badge className="bg-green-600">{previewDiscount()}</Badge>
                    {formData.minOrderAmount && ` on orders above €${parseFloat(formData.minOrderAmount).toFixed(2)}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Limits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usage Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Maximum Total Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => updateField('maxUses', e.target.value)}
                    placeholder="Unlimited"
                    className={errors.maxUses ? 'border-red-300' : ''}
                  />
                  {errors.maxUses && <p className="text-sm text-red-600">{errors.maxUses}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUsesPerUser">Max Uses Per User *</Label>
                  <Input
                    id="maxUsesPerUser"
                    type="number"
                    min="1"
                    value={formData.maxUsesPerUser}
                    onChange={(e) => updateField('maxUsesPerUser', e.target.value)}
                    className={errors.maxUsesPerUser ? 'border-red-300' : ''}
                  />
                  {errors.maxUsesPerUser && <p className="text-sm text-red-600">{errors.maxUsesPerUser}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Start Date *</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => updateField('validFrom', e.target.value)}
                    className={errors.validFrom ? 'border-red-300' : ''}
                  />
                  {errors.validFrom && <p className="text-sm text-red-600">{errors.validFrom}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validTo">End Date</Label>
                  <Input
                    id="validTo"
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => updateField('validTo', e.target.value)}
                    className={errors.validTo ? 'border-red-300' : ''}
                  />
                  {errors.validTo && <p className="text-sm text-red-600">{errors.validTo}</p>}
                  <p className="text-xs text-gray-500">Leave empty for no expiry</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Target Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
           

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Public Only</p>
                    <p className="text-xs text-gray-500">Restrict to public customers</p>
                  </div>
                </div>
                <Switch
                  checked={formData.publicOnly}
                  onCheckedChange={(checked) => updateField('publicOnly', checked)}
                />
              </div>

              {errors.audience && <p className="text-sm text-red-600">{errors.audience}</p>}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Internal notes about this coupon..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4 mr-2" />
                  Create Coupon
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
