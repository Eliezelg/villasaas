'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCookie, deleteCookie } from './utils'

interface TenantInfo {
  id: string
  subdomain: string
  name: string
  domain?: string
  logo?: string
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
  settings?: {
    currency?: string
    language?: string
    timezone?: string
  }
}

interface TenantContextType {
  tenant: TenantInfo | null
  loading: boolean
  error: string | null
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
})

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTenant() {
      try {
        // Ne pas charger le tenant sur les pages admin
        if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) {
          // Supprimer le cookie tenant sur les pages admin pour éviter les conflits
          deleteCookie('tenant')
          setLoading(false)
          return
        }

        // Récupérer le subdomain depuis le cookie
        const subdomain = getCookie('tenant')
        
        if (!subdomain) {
          // Si pas de cookie, essayer de détecter le subdomain depuis l'URL
          const hostname = window.location.hostname
          const parts = hostname.split('.')
          
          // Si on est sur localhost ou sur le domaine principal, pas de tenant
          if (hostname === 'localhost' || hostname.includes('localhost') || parts.length < 3) {
            setLoading(false)
            return
          }
          
          // Sinon, le premier élément est le subdomain
          const detectedSubdomain = parts[0]
          if (detectedSubdomain === 'www' || detectedSubdomain === 'app') {
            setLoading(false)
            return
          }
          
          // Utiliser le subdomain détecté
          const response = await fetch(`/api/tenant/${detectedSubdomain}`)
          
          if (!response.ok) {
            throw new Error('Failed to load tenant')
          }

          const data = await response.json()
          setTenant(data)
        } else {
          // Charger les infos du tenant depuis l'API avec le cookie
          const response = await fetch(`/api/tenant/${subdomain}`)
          
          if (!response.ok) {
            throw new Error('Failed to load tenant')
          }

          const data = await response.json()
          setTenant(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadTenant()
  }, [])

  // Appliquer le thème du tenant
  useEffect(() => {
    if (tenant?.theme) {
      const root = document.documentElement
      
      if (tenant.theme.primaryColor) {
        root.style.setProperty('--primary', tenant.theme.primaryColor)
      }
      
      if (tenant.theme.secondaryColor) {
        root.style.setProperty('--secondary', tenant.theme.secondaryColor)
      }
      
      if (tenant.theme.fontFamily) {
        root.style.setProperty('--font-family', tenant.theme.fontFamily)
      }
    }
  }, [tenant])

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}