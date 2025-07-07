import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales } from '@villa-saas/i18n'

// Cache pour stocker les mappings domaine -> tenant
const tenantCache = new Map<string, { tenantId: string; subdomain: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Créer le middleware i18n
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'fr',
  localeDetection: false
})

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Extraire le sous-domaine ou domaine personnalisé
  let tenant = null
  
  // Pour le développement local avec sous-domaines
  if (hostname.includes('localhost:3002')) {
    const subdomain = hostname.split('.')[0]
    if (subdomain && subdomain !== 'localhost' && !subdomain.includes(':')) {
      tenant = subdomain
    } else {
      tenant = 'demo' // Tenant par défaut
    }
  } else {
    // Pour la production avec domaines personnalisés
    // Vérifier le cache d'abord
    const cached = tenantCache.get(hostname)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      tenant = cached.subdomain
    } else {
      // Si pas en cache, faire une requête API pour obtenir le tenant
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/public/tenant-by-domain/${hostname}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Court timeout pour ne pas bloquer
          signal: AbortSignal.timeout(2000),
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.tenant) {
            tenant = data.tenant.subdomain
            // Mettre en cache
            tenantCache.set(hostname, {
              tenantId: data.tenant.id,
              subdomain: data.tenant.subdomain,
              timestamp: Date.now()
            })
          }
        }
      } catch (error) {
        console.error('Error fetching tenant:', error)
      }
    }
  }
  
  // Si pas de tenant trouvé, utiliser 'demo' par défaut
  if (!tenant) {
    tenant = 'demo'
  }

  // D'abord exécuter le middleware i18n
  const response = intlMiddleware(request)
  
  // Ensuite ajouter les headers du tenant
  if (tenant) {
    response.headers.set('x-tenant', tenant)
    // Aussi l'ajouter aux cookies pour le client
    response.cookies.set('tenant', tenant, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 jours
    })
  }
  
  return response
}

// Configuration du matcher pour exclure les ressources statiques
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}