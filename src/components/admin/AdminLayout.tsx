
// src/components/admin/AdminLayout.tsx (Fixed version with proper error handling)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { AuthService } from '@/lib/auth'
import { toast } from '@/components/ui/use-toast'
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Zap, 
  Mail, 
  Settings, 
  Menu, 
  LogOut 
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Registrations',
    href: '/admin/registrations',
    icon: Users
  },
  {
    name: 'Tickets',
    href: '/admin/tickets',
    icon: Ticket
  },
  {
    name: 'Panel Leads',
    href: '/admin/panels',
    icon: Zap
  },
  {
    name: 'Communications',
    href: '/admin/communications',
    icon: Mail
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings
  }
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    try {
      const authService = AuthService.getInstance()
      setCurrentUser(authService.getCurrentUser())
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }, [])

  const handleLogout = () => {
    try {
      const authService = AuthService.getInstance()
      authService.logout()
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
      
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
              <h1 className="text-xl font-bold">EMS Admin</h1>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t p-4">
              {currentUser && (
                <div className="mb-3 px-3">
                  <p className="text-xs text-gray-500">Logged in as</p>
                  <p className="text-sm font-medium">{currentUser.email}</p>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 flex-shrink-0 items-center border-b border-gray-200 px-6">
            <h1 className="text-xl font-bold text-gray-900">EMS Admin</h1>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t p-4">
              {currentUser && (
                <div className="mb-3 px-3">
                  <p className="text-xs text-gray-500">Logged in as</p>
                  <p className="text-sm font-medium">{currentUser.email}</p>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="text-sm text-gray-600">
                Welcome, {currentUser?.firstName || 'Admin'}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}