import { notFound } from 'next/navigation'
import { LocationPageModern } from '@/components/booking/property/location-page-modern'
import { RoomsPageModern } from '@/components/booking/property/rooms-page-modern'
import { ActivitiesPageModern } from '@/components/booking/property/activities-page-modern'
import { ServicesPageModern } from '@/components/booking/property/services-page-modern'
import { headers } from 'next/headers'

interface PageProps {
  params: {
    locale: string
    id: string
    page: string
  }
}

const pageComponents = {
  location: LocationPageModern,
  rooms: RoomsPageModern,
  activities: ActivitiesPageModern,
  services: ServicesPageModern,
  // reviews: ReviewsPage, // À créer plus tard
}

async function getProperty(id: string) {
  const headersList = headers()
  const tenant = headersList.get('x-tenant') || ''
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  
  try {
    const response = await fetch(`${apiUrl}/api/public/properties/${id}`, {
      headers: {
        'X-Tenant': tenant,
      },
      next: {
        revalidate: 3600,
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    return response.json()
  } catch (error) {
    console.error('Error fetching property:', error)
    return null
  }
}

export default async function PropertyCustomPage({ params }: PageProps) {
  const { id, page } = params

  // Vérifier que la page demandée existe
  const PageComponent = pageComponents[page as keyof typeof pageComponents]
  if (!PageComponent) {
    notFound()
  }

  // Récupérer la propriété
  const property = await getProperty(id)
  
  if (!property) {
    notFound()
  }

  // Vérifier si la page est activée pour cette propriété
  const customPages = property.customPagesSettings || property.customPages || {}
  const isPageEnabled = customPages[page as keyof typeof customPages] === true

  if (!isPageEnabled) {
    notFound()
  }

  return <PageComponent property={property} locale={params.locale} />
}

// Générer les métadonnées dynamiques
export async function generateMetadata({ params }: PageProps) {
  const { id, page } = params
  
  const property = await getProperty(id)
  
  if (!property) {
    return {
      title: 'Page non trouvée',
    }
  }

  const pageTitles = {
    location: 'Localisation',
    rooms: 'Chambres',
    activities: 'Activités',
    services: 'Services',
    reviews: 'Avis',
  }

  const pageTitle = pageTitles[page as keyof typeof pageTitles] || 'Info'

  return {
    title: `${pageTitle} - ${property.name}`,
    description: `${pageTitle} de ${property.name} à ${property.city}`,
  }
}