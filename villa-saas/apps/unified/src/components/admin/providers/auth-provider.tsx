'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

const publicRoutes = ['/admin', '/admin/login', '/admin/register', '/admin/signup']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname)
    const isAdminRoute = pathname.startsWith('/admin')

    if (!isAuthenticated && isAdminRoute && !isPublicRoute) {
      router.push('/admin/login')
    } else if (isAuthenticated && (pathname === '/admin/login' || pathname === '/admin/register')) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}