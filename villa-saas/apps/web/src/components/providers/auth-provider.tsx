'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

const publicRoutes = ['/', '/login', '/register']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login')
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}