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

    // Si on a un subdomain forcé ou un domaine Vercel, chercher par subdomain
    if (forcedSubdomain || isVercelDomain) {
      const subdomain = forcedSubdomain || 'testcompany'
      const subdomainResponse = await fetch(`${API_URL}/api/public/tenant/${subdomain}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (subdomainResponse.ok) {
        const data = await subdomainResponse.json()
        return data
      }
    }

    // Essayer de récupérer par domaine pour les domaines custom
    const response = await fetch(`${API_URL}/api/public/tenant-by-domain/${host}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Important: désactiver le cache pour avoir toujours les données à jour
      cache: 'no-store'
    })

    if (response.ok) {
      const data = await response.json()
      return data.tenant
    }

    // Si pas trouvé par domaine et qu'on a un tenant header, essayer par subdomain
    if (tenant) {
      const subdomainResponse = await fetch(`${API_URL}/api/public/tenant/${tenant}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (subdomainResponse.ok) {
        const data = await subdomainResponse.json()
        return data
      }
    }

    // Fallback: extraire le subdomain du host
    const subdomain = host.split('.')[0]
    const fallbackResponse = await fetch(`${API_URL}/api/public/tenant/${subdomain}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      return data
    }

    return null
  } catch (error) {
    console.error('Failed to fetch tenant metadata:', error)
    return null
  }
}