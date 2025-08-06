import { headers } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface TenantMetadata {
  id: string
  name: string
  subdomain: string
  domain?: string
  logo?: string
  favicon?: string
  metadata?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
  }
  theme?: any
  defaultLocale?: string
  locales?: string[]
}

export async function getTenantMetadata(): Promise<TenantMetadata | null> {
  try {
    const headersList = headers()
    const host = headersList.get('host')
    const tenant = headersList.get('x-tenant')
    
    // Pour les domaines Vercel, forcer l'utilisation du subdomain
    const isVercelDomain = host?.includes('.vercel.app')
    const forcedSubdomain = process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN
    
    if (!host && !forcedSubdomain) {
      return null
    }

    // Stratégie optimisée : Un seul appel basé sur le contexte
    
    // 1. Si on a un subdomain forcé ou un domaine Vercel
    if (forcedSubdomain || isVercelDomain) {
      const subdomain = forcedSubdomain || 'testcompany'
      const response = await fetch(`${API_URL}/api/public/tenant/${subdomain}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
      return null // Stop ici si échec
    }

    // 2. Si on a un header x-tenant (priorité)
    if (tenant) {
      const response = await fetch(`${API_URL}/api/public/tenant/${tenant}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
      return null // Stop ici si échec
    }

    // 3. Pour les domaines personnalisés ou webpro200.fr
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'webpro200.fr'
    const isMainDomain = host?.includes(mainDomain)
    
    if (isMainDomain) {
      // Extraire le subdomain pour les sites clients
      const parts = host.split('.')
      if (parts.length >= 3 && parts[0] !== 'www') {
        const subdomain = parts[0]
        const response = await fetch(`${API_URL}/api/public/tenant/${subdomain}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        })

        if (response.ok) {
          const data = await response.json()
          return data
        }
      }
      return null // C'est www.webpro200.fr ou pas un sous-domaine
    }

    // 4. Pour les domaines personnalisés uniquement
    const response = await fetch(`${API_URL}/api/public/tenant-by-domain/${host}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (response.ok) {
      const data = await response.json()
      return data.tenant
    }

    return null
  } catch (error) {
    console.error('Failed to fetch tenant metadata:', error)
    return null
  }
}