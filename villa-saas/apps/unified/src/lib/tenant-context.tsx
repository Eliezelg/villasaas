'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCookie } from './utils'

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
        // Récupérer le subdomain depuis le cookie
        const subdomain = getCookie('tenant')
        
        if (!subdomain) {
          throw new Error('No tenant found')
        }

        // Charger les infos du tenant depuis l'API
        const response = await fetch(`/api/tenant/${subdomain}`)
        
        if (!response.ok) {
          throw new Error('Failed to load tenant')
        }

        const data = await response.json()
        setTenant(data)
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