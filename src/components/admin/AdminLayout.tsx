// src/components/admin/AdminLayout.tsx - Fixed mobile responsiveness
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
  Settings, 
  Menu, 
  LogOut,
  Building2,
  Package,
  Gift
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    color: 'text-green-600'
  },
  {
    name: 'Registrations',
    href: '/admin/registrations',
    icon: Users,
    color: 'text-blue-600'
  },
  {
    name: 'Tickets',
    href: '/admin/tickets',
    icon: Ticket,
    color: 'text-purple-600'
  },
  {
    name: 'Ticket Types',
    href: '/admin/ticket-types',
    icon: Package,
    color: 'text-indigo-600'
  },
  {
    name: 'Coupons',
    href: '/admin/coupons',
    icon: Gift,
    color: 'text-pink-600'
  },
  {
    name: 'Panel Leads',
    href: '/admin/panels',
    icon: Zap,
    color: 'text-orange-600'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    color: 'text-gray-600'
  }
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

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
        description: "See you next time!",
      })
      
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/admin/login')
    }
  }

  const NavItems = ({ mobile = false, onNavigate }: { mobile?: boolean, onNavigate?: () => void }) => (
    <nav className={`space-y-1 ${mobile ? 'px-3 py-4' : 'px-3 py-6'}`}>
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
          (pathname.startsWith(item.href) && item.href !== '/admin')
        
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700 shadow-sm border-l-4 border-green-500'
                : 'text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 hover:text-gray-900'
            )}
          >
            <item.icon className={cn(
              'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
              isActive ? 'text-green-600' : item.color
            )} />
            <span className="truncate">{item.name}</span>
            {isActive && (
              <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const UserSection = ({ mobile = false }) => (
    <div className={`border-t border-gray-200 ${mobile ? 'p-3' : 'p-4'}`}>
      {currentUser && (
        <div className="mb-3 px-3 py-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Admin User</p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {currentUser.firstName || currentUser.email || 'Admin'}
          </p>
        </div>
      )}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut className="mr-3 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          {/* This trigger is hidden and controlled programmatically */}
          <div className="hidden" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-white border-r border-gray-200">
          <div className="flex h-full flex-col">
            {/* Mobile Header */}
            <div className="flex h-14 items-center px-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
              <Building2 className="h-6 w-6 text-green-600 mr-2" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                EMS Admin
              </h1>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <NavItems mobile={true} onNavigate={() => setSidebarOpen(false)} />
            </div>
            
            <UserSection mobile={true} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200 shadow-sm">
          {/* Desktop Header */}
          <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
            <Building2 className="h-7 w-7 text-green-600 mr-3" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              EMS Admin
            </h1>
          </div>
          
          <div className="flex flex-1 flex-col overflow-y-auto">
            <NavItems />
          </div>
          
          <UserSection />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-60">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-14 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm sm:px-6">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden hover:bg-green-50 -ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          {/* Top Bar Content */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
              <div className="hidden sm:block text-sm text-gray-600">
                <span className="font-medium text-green-600">Welcome,</span>{' '}
                <span className="hidden md:inline">
                  {currentUser?.firstName || 'Admin'}
                </span>
                <span className="md:hidden">
                  {(currentUser?.firstName || 'Admin').split(' ')[0]}
                </span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}