import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PropertyContent from './property-content'
import { SchemaScript } from '@/components/booking/seo/schema-script'
import { generatePropertySchema, generateBreadcrumbSchema } from '@/lib/schema-org'
import { headers } from 'next/headers'
import { CustomPagesNav } from '@/components/booking/property/custom-pages-nav'

interface Props {
  params: {
    id: string
    locale: string
  }
}

async function getProperty(id: string) {
  const headersList = headers()
  const tenant = headersList.get('x-tenant') || 'demo'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  
  try {
    const response = await fetch(`${apiUrl}/api/public/properties/${id}`, {
      headers: {
        'X-Tenant': tenant,
      },
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    })
    
    if (!response.ok) {
      console.error('getProperty - response not ok:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching property:', error)
    return null
  }
}

async function getTenant() {
  const headersList = headers()
  const tenantSubdomain = headersList.get('x-tenant') || 'demo'
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/tenant/${tenantSubdomain}`, {
      headers: {
        'X-Tenant': tenantSubdomain,
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
    console.error('Error fetching tenant:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await getProperty(params.id)
  const tenant = await getTenant()
  
  if (!property) {
    return {
      title: 'Property Not Found',
      description: 'The requested property could not be found.',
    }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'
  const propertyUrl = `${baseUrl}/${params.locale}/properties/${property.id}`
  
  return {
    title: `${property.name} - ${property.city}, ${property.country}`,
    description: property.description[params.locale] || property.description.fr || property.description.en,
    keywords: [
      property.name,
      property.city,
      property.country,
      'vacation rental',
      'holiday home',
      ...(Array.isArray(property.amenities) ? property.amenities : []),
      ...(Array.isArray(property.atmosphere) ? property.atmosphere : []),
    ],
    openGraph: {
      title: property.name,
      description: property.description[params.locale] || property.description.fr,
      type: 'website',
      locale: params.locale === 'fr' ? 'fr_FR' : 'en_US',
      url: propertyUrl,
      images: property.images?.map((img: any) => ({
        url: img.urls?.large || img.url,
        width: 1200,
        height: 800,
        alt: property.name,
      })) || [],
      siteName: tenant?.name || 'Villa Booking',
    },
    twitter: {
      card: 'summary_large_image',
      title: property.name,
      description: property.description[params.locale] || property.description.fr,
      images: property.images?.[0]?.urls?.large || property.images?.[0]?.url,
    },
    alternates: {
      canonical: propertyUrl,
      languages: {
        'fr': `${baseUrl}/fr/properties/${property.id}`,
        'en': `${baseUrl}/en/properties/${property.id}`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function PropertyPage({ params }: Props) {
  const property = await getProperty(params.id)
  const tenant = await getTenant()
  
  if (!property) {
    notFound()
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'
  
  // Generate schema.org data
  const propertySchema = generatePropertySchema(property, tenant)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `${baseUrl}/${params.locale}` },
    { name: property.city, url: `${baseUrl}/${params.locale}?city=${property.city}` },
    { name: property.name, url: `${baseUrl}/${params.locale}/properties/${property.id}` },
  ])
  
  return (
    <>
      <SchemaScript schema={propertySchema} />
      <SchemaScript schema={breadcrumbSchema} />
      <CustomPagesNav 
        propertyId={property.id}
        customPages={property.customPages}
        locale={params.locale}
      />
      <PropertyContent />
    </>
  )
}