'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useAuthRefresh } from '@/hooks/use-auth-refresh'

const publicRoutes = ['/admin', '/admin/login', '/admin/register', '/admin/signup']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, checkAuth, user } = useAuthStore()
  
  // Use the auth refresh hook
  useAuthRefresh()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname)
    const isAdminRoute = pathname.startsWith('/admin')

    // Rediriger vers login si non authentifié sur une route privée
    if (!isAuthenticated && isAdminRoute && !isPublicRoute) {
      router.push('/admin/login')
    } else if (isAuthenticated && (pathname === '/admin/login' || pathname === '/admin/register')) {
      // Si l'utilisateur est authentifié et essaie d'accéder aux pages de connexion/inscription
      // Rediriger directement vers le dashboard
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}