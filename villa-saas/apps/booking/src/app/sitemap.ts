import { MetadataRoute } from 'next'
import { locales } from '@villa-saas/i18n'

const baseUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = []
  
  // Pages statiques pour chaque locale
  const staticPages = [
    '',
    'my-booking',
  ]
  
  // Ajouter les pages statiques pour chaque locale
  for (const locale of locales) {
    for (const page of staticPages) {
      routes.push({
        url: `${baseUrl}/${locale}${page ? `/${page}` : ''}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1 : 0.8,
      })
    }
  }
  
  try {
    // Récupérer toutes les propriétés publiques
    // Pour le sitemap, on utilise le tenant par défaut 'demo'
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/properties?limit=1000`, {
      headers: {
        'X-Tenant': 'demo',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      const properties = data.properties || []
      
      // Ajouter chaque propriété pour chaque locale
      for (const property of properties) {
        for (const locale of locales) {
          routes.push({
            url: `${baseUrl}/${locale}/properties/${property.id}`,
            lastModified: new Date(property.updatedAt || property.createdAt),
            changeFrequency: 'daily',
            priority: 0.9,
          })
        }
      }
    }
  } catch (error) {
    console.error('Error fetching properties for sitemap:', error)
  }
  
  return routes
}