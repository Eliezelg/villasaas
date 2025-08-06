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
  localeDetection: false,
  localePrefix: 'as-needed' // Only add locale prefix when needed
})

// Routes qui nécessitent une authentification
const protectedRoutes = [
  '/admin/dashboard',
  '/admin/settings',
  '/admin/onboarding'
]

// Routes publiques qui ne nécessitent pas d'auth
const publicRoutes = [
  '/admin',
  '/admin/login',
  '/admin/signup',
  '/admin/register'
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hostname = request.headers.get('host') || ''
  
  // Redirections pour les anciennes URLs et gestion des locales
  const pathSegments = pathname.split('/')
  const hasLocale = locales.includes(pathSegments[1] as any)
  const locale = hasLocale ? pathSegments[1] : 'fr'
  
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const newPath = pathname.replace('/dashboard', `/${locale}/admin/dashboard`)
    return NextResponse.redirect(new URL(newPath, request.url))
  }
  
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url))
  }
  
  if (pathname === '/register' || pathname === '/signup') {
    return NextResponse.redirect(new URL(`/${locale}/admin/signup`, request.url))
  }
  
  // 1. Déterminer le mode de l'application AVANT les redirections
  let mode: 'hub' | 'admin' | 'booking' = 'hub'
  let tenant = null
  
  // Vérifier d'abord si c'est un sous-domaine (pour éviter la redirection vers admin)
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'webpro200.com'
  const isSubdomain = hostname.endsWith(`.${mainDomain}`) && !hostname.startsWith('www.')
  
  if (isSubdomain) {
    const subdomain = hostname.split('.')[0]
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenant = subdomain
      mode = 'booking'
    }
  }
  
  // Redirection de la racine vers /admin/login SEULEMENT si ce n'est pas un site booking
  if (mode !== 'booking' && (pathname === '/' || pathname === `/${locale}`)) {
    return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url))
  }
  
  // Si c'est une route admin
  if (pathname.startsWith('/admin')) {
    mode = 'admin'
    
    // Appliquer le middleware i18n pour le mode admin
    const response = intlMiddleware(request as any)
    
    // Extraire le pathname sans la locale
    const pathSegments = pathname.split('/')
    const hasLocale = locales.includes(pathSegments[1] as any)
    const pathWithoutLocale = hasLocale 
      ? '/' + pathSegments.slice(2).join('/')
      : pathname
    
    // Vérifier si c'est une route publique
    const isPublicRoute = publicRoutes.some(route => pathWithoutLocale === route)
    if (isPublicRoute) {
      // Pour les routes publiques, on laisse passer
      return response
    }
    
    // Vérifier si c'est une route protégée
    const isProtectedRoute = protectedRoutes.some(route => pathWithoutLocale.startsWith(route))
    if (isProtectedRoute) {
      const token = request.cookies.get('access_token')
      
      if (!token) {
        // Rediriger vers la page de connexion avec la locale
        const locale = hasLocale ? pathSegments[1] : 'fr'
        const loginUrl = new URL(`/${locale}/admin/login`, request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
    
    // Si on est sur login/signup et qu'on est déjà connecté
    if ((pathWithoutLocale === '/admin/login' || pathWithoutLocale === '/admin/signup') && request.cookies.get('access_token')) {
      const locale = hasLocale ? pathSegments[1] : 'fr'
      return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, request.url))
    }
    
    // Pour les autres routes admin, retourner la réponse i18n
    return response
  }
  
  // 2. Vérifier si c'est un sous-domaine (mode booking)
  const isLocalhost = hostname.includes('localhost')
  
  if (isLocalhost) {
    // Pour le développement local avec sous-domaines
    const parts = hostname.split('.')
    if (parts.length > 2 || (parts.length === 2 && !parts[0].includes(':'))) {
      const subdomain = parts[0]
      if (subdomain && subdomain !== 'www') {
        tenant = subdomain
        mode = 'booking'
      }
    }
  } else {
    // Pour la production avec domaines personnalisés
    // Si ce n'est pas le domaine principal, c'est un domaine personnalisé
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'webpro200.com'
    
    // Ignorer les domaines Vercel preview
    const isVercelPreview = hostname.endsWith('.vercel.app') && hostname !== mainDomain
    
    if (hostname !== mainDomain && !hostname.endsWith(`.${mainDomain}`) && !isVercelPreview) {
      // C'est un domaine personnalisé, chercher le tenant
      const cached = tenantCache.get(hostname)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        tenant = cached.subdomain
        mode = 'booking'
      } else {
        // Faire une requête API pour obtenir le tenant/property
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const response = await fetch(`${apiUrl}/api/public/domain-lookup/${hostname}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(2000),
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.found) {
              tenant = data.tenant.subdomain
              mode = 'booking'
              // Mettre en cache
              tenantCache.set(hostname, {
                tenantId: data.tenant.id,
                subdomain: data.tenant.subdomain,
                timestamp: Date.now()
              })
              
              // Si c'est une propriété avec un domaine personnalisé et qu'on accède via le sous-domaine
              // on pourrait rediriger vers le domaine personnalisé
              if (data.type === 'property' && data.property.customDomain && hostname.includes(`.${mainDomain}`)) {
                return NextResponse.redirect(`https://${data.property.customDomain}${pathname}`)
              }
            }
          }
        } catch (error) {
          console.error('Error fetching tenant:', error)
        }
      }
    } else if (hostname.endsWith(`.${mainDomain}`)) {
      // C'est un sous-domaine du domaine principal
      const subdomain = hostname.split('.')[0]
      if (subdomain && subdomain !== 'www') {
        tenant = subdomain
        mode = 'booking'
      }
    }
  }
  
  // 3. Gérer selon le mode
  if (mode === 'booking') {
    // Appliquer le middleware i18n pour les sites booking
    const response = intlMiddleware(request as any)
    
    // Ajouter les headers du tenant
    if (tenant) {
      response.headers.set('x-tenant', tenant)
      response.cookies.set('tenant', tenant, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 jours
      })
    }
    
    return response
  }
  
  // 4. Mode hub (par défaut)
  // Pas d'i18n pour le hub pour l'instant
  return NextResponse.next()
}

// Configuration du matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon, apple-icon (favicon files)
     * - manifest (PWA files)
     * - robots.txt, sitemap.xml (SEO files)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|robots.txt|sitemap.xml|public).*)',
  ],
}