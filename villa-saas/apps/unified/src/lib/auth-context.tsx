'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { User } from '@villa-saas/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, tenantSubdomain?: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshAuth = async () => {
    try {
      const { data } = await authService.getMe()
      if (data) {
        setUser(data)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshAuth()
  }, [])

  const login = async (email: string, password: string, tenantSubdomain?: string) => {
    try {
      // Pour webpro200.fr, on doit d'abord identifier le tenant de l'utilisateur
      let subdomain = tenantSubdomain
      
      if (!subdomain && typeof window !== 'undefined') {
        const host = window.location.hostname
        
        // Si on est sur webpro200.fr, on devra chercher le tenant via l'email
        if (host === 'www.webpro200.fr' || host === 'webpro200.fr') {
          // TODO: Implémenter une route pour trouver le tenant par email
          // Pour l'instant, on utilise testcompany par défaut
          subdomain = 'testcompany'
        } else if (host.includes('.vercel.app')) {
          // Pour les domaines Vercel, utiliser testcompany
          subdomain = 'testcompany'
        } else {
          // Pour les autres domaines, extraire le subdomain
          subdomain = host.split('.')[0]
        }
      }

      const { data } = await authService.login(email, password, subdomain)
      if (data?.user) {
        setUser(data.user)
        
        // Rediriger vers le dashboard approprié
        if (data.user.tenant?.subdomain) {
          // Si on est sur webpro200.fr, rediriger vers le subdomain du tenant
          if (window.location.hostname.includes('webpro200.fr')) {
            // Option 1: Rediriger vers le subdomain
            // window.location.href = `https://${data.user.tenant.subdomain}.webpro200.fr/admin`
            
            // Option 2: Rester sur webpro200.fr mais avec le contexte du tenant
            router.push('/admin')
          } else {
            router.push('/admin')
          }
        } else {
          router.push('/admin')
        }
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      setUser(null)
      router.push('/admin/login')
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}