// src/app/admin/settings/page.tsx - Clean settings page without dummy data
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { 
  Euro, 
  Shield, 
  Plus,
  Edit,
  Save,
  Eye,
  EyeOff,
  Trash2,
  UserPlus
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'BOOTH_STAFF' | 'SALES_MANAGER'
  isActive: boolean
  createdAt: string
}

interface TicketPricing {
  generalPrice: number
  currency: string
}

export default function SettingsPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [ticketPricing, setTicketPricing] = useState<TicketPricing>({
    generalPrice: 0,
    currency: 'EUR'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Add/Edit user state
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'ADMIN' as AdminUser['role']
  })

  useEffect(() => {
    fetchSettings()
    fetchAdminUsers()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/ticket-pricing')
      const result = await response.json()
      
      if (result.success) {
        setTicketPricing(result.data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchAdminUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      
      if (result.success) {
        setAdminUsers(result.data.users || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch admin users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching admin users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveTicketPricing = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings/ticket-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPricing),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Ticket pricing updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update pricing",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save pricing settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveAdminUser = async () => {
    try {
      if (!userForm.email || !userForm.password) {
        toast({
          title: "Error",
          description: "Email and password are required",
          variant: "destructive",
        })
        return
      }

      const isEditing = !!editingUser
      const url = isEditing ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Admin user ${isEditing ? 'updated' : 'created'} successfully`,
        })
        
        setUserDialogOpen(false)
        resetUserForm()
        fetchAdminUsers()
      } else {
        toast({
          title: "Error",
          description: result.message || `Failed to ${isEditing ? 'update' : 'create'} user`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingUser ? 'update' : 'create'} admin user`,
        variant: "destructive",
      })
    }
  }

  const deleteAdminUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this admin user?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Admin user deleted successfully",
        })
        fetchAdminUsers()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete admin user",
        variant: "destructive",
      })
    }
  }

  const openEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setUserForm({
      email: user.email,
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role
    })
    setUserDialogOpen(true)
  }

  const resetUserForm = () => {
    setEditingUser(null)
    setUserForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'ADMIN'
    })
  }

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      SUPER_ADMIN: 'bg-red-100 text-red-700',
      ADMIN: 'bg-blue-100 text-blue-700',
      BOOTH_STAFF: 'bg-green-100 text-green-700',
      SALES_MANAGER: 'bg-purple-100 text-purple-700'
    }
    return colors[role as keyof typeof colors] || colors.ADMIN
  }

  const handlePriceChange = (value: string) => {
    const numericValue = parseFloat(value) || 0
    if (numericValue >= 0) {
      setTicketPricing(prev => ({
        ...prev,
        generalPrice: numericValue
      }))
    }
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
         Manage admin users
        </p>
      </div>

    

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Admin Users
          </CardTitle>
          <CardDescription>
            Manage administrator accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add User Button */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {adminUsers.length} admin user{adminUsers.length !== 1 ? 's' : ''} configured
              </p>
              
              <Dialog  open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetUserForm}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Admin User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? 'Edit Admin User' : 'Add New Admin User'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Update admin user details and permissions' : 'Create a new administrator account'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={userForm.firstName}
                          onChange={(e) => setUserForm(prev => ({
                            ...prev,
                            firstName: e.target.value
                          }))}
                          placeholder="First name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={userForm.lastName}
                          onChange={(e) => setUserForm(prev => ({
                            ...prev,
                            lastName: e.target.value
                          }))}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">
                        Password * {editingUser && '(leave empty to keep current)'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({
                            ...prev,
                            password: e.target.value
                          }))}
                          placeholder="Enter password"
                          required={!editingUser}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        value={userForm.role} 
                        onValueChange={(value: AdminUser['role']) => setUserForm(prev => ({
                          ...prev,
                          role: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="BOOTH_STAFF">Booth Staff</SelectItem>
                          <SelectItem value="SALES_MANAGER">Sales Manager</SelectItem>
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={saveAdminUser} className="flex-1">
                        {editingUser ? 'Update User' : 'Create User'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setUserDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Loading admin users...
                </div>
              </div>
            ) : adminUsers.length > 0 ? (
              <div className="space-y-3">
                {adminUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.email
                            }
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getRoleBadgeColor(user.role)} border-0`}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                          
                          <Badge 
                            variant={user.isActive ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditUser(user)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAdminUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No admin users found</p>
                <p className="text-sm">Add your first admin user to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}