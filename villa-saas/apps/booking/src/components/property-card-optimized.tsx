'use client'

import { memo } from 'react'
import Link from 'next/link'
import { MapPin, Users, Bed } from 'lucide-react'
import { PropertyImage } from '@/components/ui/property-image'
import { formatPrice } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'

interface PropertyCardProps {
  property: {
    id: string
    name: string
    city: string
    country: string
    maxGuests: number
    bedrooms: number
    basePrice: number
    images: Array<{
      id: string
      url: string
      urls?: any
    }>
  }
  priority?: boolean
}

export const PropertyCard = memo(function PropertyCard({ property, priority = false }: PropertyCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  return (
    <Link
      href={`/${locale}/properties/${property.id}`}
      className="property-card group block"
      prefetch={false}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
        {property.images?.[0] && (
          <PropertyImage
            src={property.images[0].urls?.medium || property.images[0].url}
            alt={property.name}
            width={400}
            height={300}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={70}
          />
        )}
        <div className="absolute bottom-4 left-4">
          <span className="price-badge">
            {formatPrice(property.basePrice)} {t('booking.property.perNight')}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold line-clamp-1">{property.name}</h3>
        <div className="mb-3 flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">{property.city}, {property.country}</span>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            <span className="sr-only">{t('booking.property.maxGuests', { count: property.maxGuests })}</span>
            {property.maxGuests}
          </span>
          <span className="flex items-center">
            <Bed className="mr-1 h-4 w-4" />
            <span className="sr-only">{t('booking.property.bedrooms', { count: property.bedrooms })}</span>
            {property.bedrooms}
          </span>
        </div>
      </div>
    </Link>
  )
})