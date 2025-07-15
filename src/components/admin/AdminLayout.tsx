// src/components/admin/AdminLayout.tsx - VR Room Malta Theme with Dark Mode Toggle
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
  Calendar, 
  Settings, 
  Menu, 
  LogOut,
  Gamepad2,
  Package,
  Gift,
  PartyPopper,
  Moon,
  Sun
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

// VR-themed navigation with appropriate icons and labels
const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview & analytics'
  },
  {
    name: 'VR Bookings',
    href: '/admin/registrations',
    icon: Calendar,
    description: 'Experience reservations'
  },
  {
    name: 'VR Sessions',
    href: '/admin/tickets',
    icon: Gamepad2,
    description: 'Active & completed sessions'
  },
  {
    name: 'Experience Types',
    href: '/admin/ticket-types',
    icon: Package,
    description: 'VR games & packages'
  },
  {
    name: 'Promotions',
    href: '/admin/coupons',
    icon: Gift,
    description: 'Discounts & offers'
  },
  {
    name: 'Party Events',
    href: '/admin/panels',
    icon: PartyPopper,
    description: 'Birthday & group bookings'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration'
  }
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    try {
      const authService = AuthService.getInstance()
      setCurrentUser(authService.getCurrentUser())
    } catch (error) {
      console.error('Error getting current user:', error)
    }

    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('vr-admin-dark-mode')
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('vr-admin-dark-mode', JSON.stringify(newDarkMode))
  }

  const handleLogout = () => {
    try {
      const authService = AuthService.getInstance()
      authService.logout()
      
      toast({
        title: "Logged Out",
        description: "Thanks for managing VR Room Malta!",
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
              'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 border',
              isActive
                ? darkMode 
                  ? 'bg-[#01AEED]/10 text-[#01AEED] border-[#01AEED]/30 shadow-sm backdrop-blur-sm'
                  : 'bg-[#01AEED]/10 text-[#01AEED] border-[#01AEED]/30 shadow-sm'
                : darkMode
                  ? 'text-gray-300 hover:bg-white/10 hover:text-white border-transparent hover:border-white/20'
                  : 'text-gray-600 hover:bg-[#01AEED]/5 hover:text-gray-900 border-transparent hover:border-[#01AEED]/20'
            )}
          >
            <item.icon className={cn(
              'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
              isActive 
                ? 'text-[#01AEED]' 
                : darkMode 
                  ? 'text-gray-400 group-hover:text-white'
                  : 'text-gray-500 group-hover:text-[#01AEED]'
            )} />
            <div className="flex-1 min-w-0">
              <span className="truncate font-medium">{item.name}</span>
              <p className={cn(
                "text-xs truncate mt-0.5",
                isActive 
                  ? 'text-[#01AEED]/70' 
                  : darkMode 
                    ? 'text-gray-500 group-hover:text-gray-300'
                    : 'text-gray-500 group-hover:text-gray-600'
              )}>
                {item.description}
              </p>
            </div>
            {isActive && (
              <div className="w-2 h-2 bg-[#01AEED] rounded-full animate-pulse"></div>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const UserSection = ({ mobile = false }) => (
    <div className={cn(
      "border-t p-4",
      mobile ? 'p-3' : 'p-4',
      darkMode ? 'border-gray-700/50' : 'border-gray-200'
    )}>
      {currentUser && (
        <div className={cn(
          "mb-3 px-3 py-3 rounded-lg border",
          darkMode 
            ? 'bg-[#01AEED]/10 backdrop-blur-sm border-[#01AEED]/30'
            : 'bg-[#01AEED]/10 border-[#01AEED]/30'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-[#01AEED] rounded-full animate-pulse"></div>
            <p className="text-xs font-medium text-[#01AEED] uppercase tracking-wider">VR Admin</p>
          </div>
          <p className={cn(
            "text-sm font-semibold truncate",
            darkMode ? 'text-white' : 'text-gray-900'
          )}>
            {currentUser.firstName || currentUser.email || 'VR Manager'}
          </p>
        </div>
      )}
      
      {/* Dark Mode Toggle */}
      <Button
        variant="ghost"
        onClick={toggleDarkMode}
        className={cn(
          "w-full justify-start mb-2 transition-colors border border-transparent",
          darkMode 
            ? 'text-gray-300 hover:text-[#01AEED] hover:bg-[#01AEED]/10 hover:border-[#01AEED]/30'
            : 'text-gray-600 hover:text-[#01AEED] hover:bg-[#01AEED]/10 hover:border-[#01AEED]/30'
        )}
      >
        {darkMode ? (
          <>
            <Sun className="mr-3 h-4 w-4" />
            Light Mode
          </>
        ) : (
          <>
            <Moon className="mr-3 h-4 w-4" />
            Dark Mode
          </>
        )}
      </Button>

      <Button
        variant="ghost"
        onClick={handleLogout}
        className={cn(
          "w-full justify-start transition-colors border border-transparent",
          darkMode 
            ? 'text-gray-300 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30'
            : 'text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
        )}
      >
        <LogOut className="mr-3 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )

  const VRLogo = ({ size = 'normal' }: { size?: 'normal' | 'small' }) => (
    <div className="flex items-center gap-3">
      <div className={cn(
        "bg-gradient-to-r from-[#01AEED] to-blue-500 rounded-lg flex items-center justify-center",
        size === 'small' ? 'w-8 h-8' : 'w-10 h-10'
      )}>
        <span className={cn(
          "text-white font-bold",
          size === 'small' ? 'text-sm' : 'text-lg'
        )}>VR</span>
      </div>
      <div>
        <h1 className={cn(
          "font-bold",
          size === 'small' ? 'text-lg' : 'text-xl',
          darkMode ? 'text-white' : 'text-gray-900'
        )}>
          VR Room Malta
        </h1>
        <p className={cn(
          "text-xs",
          darkMode ? 'text-gray-400' : 'text-gray-500'
        )}>
          Admin Control Center
        </p>
      </div>
    </div>
  )

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    )}>
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <div className="hidden" />
        </SheetTrigger>
        <SheetContent side="left" className={cn(
          "p-0 w-64 border-r transition-colors duration-300",
          darkMode 
            ? 'bg-gray-900/95 backdrop-blur-md border-gray-700/50'
            : 'bg-white/95 backdrop-blur-md border-gray-200'
        )}>
          <div className="flex h-full flex-col">
            {/* Mobile Header */}
            <div className={cn(
              "flex h-14 items-center px-4 border-b",
              darkMode ? 'border-gray-700/50' : 'border-gray-200'
            )}>
              <VRLogo size="small" />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <NavItems mobile={true} onNavigate={() => setSidebarOpen(false)} />
            </div>
            
            <UserSection mobile={true} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className={cn(
          "flex min-h-0 flex-1 flex-col border-r shadow-lg transition-colors duration-300",
          darkMode 
            ? 'bg-gray-900/95 backdrop-blur-md border-gray-700/50'
            : 'bg-white/95 backdrop-blur-md border-gray-200'
        )}>
          {/* Desktop Header */}
          <div className={cn(
            "flex h-16 flex-shrink-0 items-center px-6 border-b",
            darkMode ? 'border-gray-700/50' : 'border-gray-200'
          )}>
            <VRLogo />
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
        <div className={cn(
          "sticky top-0 z-40 flex h-14 flex-shrink-0 items-center gap-x-4 border-b backdrop-blur-md px-4 shadow-sm sm:px-6 transition-colors duration-300",
          darkMode 
            ? 'border-gray-700/50 bg-gray-900/95'
            : 'border-gray-200 bg-white/95'
        )}>
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "lg:hidden -ml-2 border border-transparent transition-colors",
              darkMode 
                ? 'hover:bg-[#01AEED]/20 text-gray-300 hover:text-white hover:border-[#01AEED]/30'
                : 'hover:bg-[#01AEED]/10 text-gray-600 hover:text-[#01AEED] hover:border-[#01AEED]/30'
            )}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open VR admin menu</span>
          </Button>

          {/* Top Bar Content */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
              {/* Dark Mode Toggle in Top Bar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className={cn(
                  "transition-colors border border-transparent",
                  darkMode 
                    ? 'text-gray-300 hover:text-[#01AEED] hover:bg-[#01AEED]/10 hover:border-[#01AEED]/30'
                    : 'text-gray-600 hover:text-[#01AEED] hover:bg-[#01AEED]/10 hover:border-[#01AEED]/30'
                )}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <div className={cn(
                "hidden sm:block text-sm",
                darkMode ? 'text-gray-300' : 'text-gray-600'
              )}>
                <span className="font-medium text-[#01AEED]">Welcome,</span>{' '}
                <span className={cn(
                  "hidden md:inline",
                  darkMode ? 'text-white' : 'text-gray-900'
                )}>
                  {currentUser?.firstName || 'VR Manager'}
                </span>
                <span className={cn(
                  "md:hidden",
                  darkMode ? 'text-white' : 'text-gray-900'
                )}>
                  {(currentUser?.firstName || 'Admin').split(' ')[0]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#01AEED] rounded-full animate-pulse"></div>
                <span className={cn(
                  "text-xs hidden sm:block",
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                )}>Live</span>
              </div>
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