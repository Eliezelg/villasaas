'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Home, Building2, Calendar, Users, Settings, LogOut, BarChart3, MessageSquare, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuthStore } from '@/store/auth.store'
import { AdminLanguageSelector } from '@/components/admin/language-selector'
import { cn } from '@/lib/utils'

const navigationItems = [
  { key: 'dashboard', href: '/admin/dashboard', icon: Home },
  { key: 'properties', href: '/admin/dashboard/properties', icon: Building2 },
  { key: 'bookings', href: '/admin/dashboard/bookings', icon: Calendar },
  { key: 'messages', href: '/admin/dashboard/messages', icon: MessageSquare },
  { key: 'analytics', href: '/admin/dashboard/analytics', icon: BarChart3 },
  { key: 'users', href: '/admin/dashboard/users', icon: Users },
  { key: 'settings', href: '/admin/dashboard/settings', icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, tenant, logout } = useAuthStore()
  const t = useTranslations('admin.navigation')
  const locale = useLocale()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push(`/${locale}/admin/login`)
  }

  const isActive = (href: string) => {
    return pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r bg-white pt-5">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold">Villa SaaS</h1>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.key}
                  href={`/${locale}${item.href}`}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive(item.href)
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5",
                    isActive(item.href)
                      ? "text-gray-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  )} />
                  {t(item.key)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  {tenant?.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between px-4 py-5 border-b">
              <h1 className="text-xl font-bold">Villa SaaS</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-grow">
              <nav className="px-2 py-4 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.key}
                    href={`/${locale}${item.href}`}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      isActive(item.href)
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-5 w-5",
                      isActive(item.href)
                        ? "text-gray-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    )} />
                    {t(item.key)}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    {tenant?.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-medium text-gray-900">
                {tenant?.name || 'Villa SaaS'}
              </h2>
            </div>
            <AdminLanguageSelector />
          </div>
        </div>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}