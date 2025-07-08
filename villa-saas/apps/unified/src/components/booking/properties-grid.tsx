'use client'

import Link from 'next/link'
import { MapPin, Users, Bed } from 'lucide-react'
import { PropertyImage } from '@/components/ui/property-image'
import { formatPrice } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface Property {
  id: string
  name: string
  city: string
  country: string
  maxGuests: number
  bedrooms: number
  bathrooms: number
  basePrice: number
  images: Array<{
    id: string
    url: string
    urls?: {
      small?: string
      medium?: string
      large?: string
      original?: string
    }
  }>
}

interface PropertiesGridProps {
  properties: Property[]
  subdomain: string
}

export function PropertiesGrid({ properties, subdomain }: PropertiesGridProps) {
  const t = useTranslations()

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <Link
          key={property.id}
          href={`/${subdomain}/properties/${property.id}`}
          className="property-card group block"
        >
          <div className="relative">
            {property.images?.[0] && (
              <PropertyImage
                src={property.images[0].urls?.medium || property.images[0].url}
                alt={property.name}
                className="property-image"
              />
            )}
            <div className="absolute bottom-4 left-4">
              <span className="price-badge">
                {formatPrice(property.basePrice)} {t('booking.property.perNight', { defaultMessage: '/nuit' })}
              </span>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="mb-2 text-lg font-semibold">{property.name}</h3>
            <div className="mb-3 flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              {property.city}, {property.country}
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                {property.maxGuests} pers.
              </span>
              <span className="flex items-center">
                <Bed className="mr-1 h-4 w-4" />
                {property.bedrooms} ch.
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}