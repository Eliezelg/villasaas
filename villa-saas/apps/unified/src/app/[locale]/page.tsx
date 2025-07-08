'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/lib/tenant-context'
import { apiClient } from '@/lib/api-client-booking'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Search, MapPin, Users, Bed, Calendar } from 'lucide-react'
import { PropertyFilters, type FilterValues } from '@/components/search/property-filters'
import { PropertyImage } from '@/components/ui/property-image'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageSelector } from '@/components/language-selector'
import * as gtag from '@/lib/gtag'
import * as fbpixel from '@/lib/fbpixel'
import { useRouter } from 'next/navigation'

interface Property {
  id: string
  name: string
  description: { [key: string]: string }
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

export default function HomePage() {
  const { tenant, loading: tenantLoading } = useTenant()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    search: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  })
  const [filters, setFilters] = useState<FilterValues>({})
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    loadProperties(true)
  }, [])

  async function loadProperties(isInitial = false) {
    setLoading(true)
    const response = await apiClient.getProperties({
      limit: 12,
      page: 1,
      ...filters,
    })
    
    if (response.data) {
      const fetchedProperties = response.data.properties || []
      setProperties(fetchedProperties)
      
      // Si une seule propriété est disponible et qu'on est au chargement initial, rediriger automatiquement
      if (fetchedProperties.length === 1 && isInitial) {
        router.push(`/${locale}/properties/${fetchedProperties[0].id}`)
      }
    }
    
    setLoading(false)
    if (isInitial) {
      setIsInitialLoad(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    // Track search
    if (searchParams.search) {
      gtag.trackSearch(searchParams.search, 0)
      fbpixel.fbTrackSearch(searchParams.search)
    }
    
    const response = await apiClient.getProperties({
      search: searchParams.search,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: searchParams.guests,
      limit: 12,
      page: 1,
      ...filters,
    })
    
    if (response.data) {
      const results = response.data.properties || []
      setProperties(results)
      
      // Track search results count
      if (searchParams.search) {
        gtag.trackSearch(searchParams.search, results.length)
      }
    }
    
    setLoading(false)
  }

  async function handleFiltersChange(newFilters: FilterValues) {
    setFilters(newFilters)
    setLoading(true)
    
    const response = await apiClient.getProperties({
      search: searchParams.search,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: searchParams.guests,
      limit: 12,
      page: 1,
      ...newFilters,
    })
    
    if (response.data) {
      setProperties(response.data.properties || [])
    }
    
    setLoading(false)
  }

  if (tenantLoading || (loading && properties.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">{t('common.messages.loading')}</p>
        </div>
      </div>
    )
  }
  
  // Si une seule propriété est chargée au chargement initial et qu'on est en train de rediriger, afficher le loader
  if (properties.length === 1 && isInitialLoad && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">{t('common.messages.redirecting', { defaultMessage: 'Redirection en cours...' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <span className="text-xl font-bold">{tenant?.name || 'Villa Booking'}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/my-booking`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t('booking.myBooking.title')}
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t('booking.hero.title')}
            </h1>
            <p className="mb-10 text-lg text-muted-foreground">
              {t('booking.hero.subtitle')}
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="rounded-lg bg-background p-4 shadow-lg">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label htmlFor="search" className="sr-only">
                    {t('booking.hero.searchPlaceholder')}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="search"
                      type="text"
                      placeholder={t('booking.hero.searchPlaceholder')}
                      value={searchParams.search}
                      onChange={(e) => setSearchParams({ ...searchParams, search: e.target.value })}
                      className="search-input pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="checkIn" className="sr-only">
                    {t('booking.hero.checkIn')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="checkIn"
                      type="date"
                      value={searchParams.checkIn}
                      onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                      className="search-input pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="checkOut" className="sr-only">
                    {t('booking.hero.checkOut')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="checkOut"
                      type="date"
                      value={searchParams.checkOut}
                      onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                      className="search-input pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-4">
                <div className="flex-1">
                  <label htmlFor="guests" className="sr-only">
                    {t('booking.hero.guests')}
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="guests"
                      type="number"
                      min="1"
                      placeholder={t('booking.hero.guests')}
                      value={searchParams.guests}
                      onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) || 1 })}
                      className="search-input pl-10"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="rounded-md bg-primary px-8 py-4 text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t('common.actions.search')}
                </button>
                
                <PropertyFilters
                  onFiltersChange={handleFiltersChange}
                  isLoading={loading}
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-8 text-3xl font-bold">{t('common.navigation.properties')}</h2>
          
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] rounded-lg bg-muted" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">{t('booking.search.noProperties', { defaultMessage: 'Aucune propriété disponible' })}</h3>
              <p className="text-muted-foreground">{t('booking.search.contactOwner', { defaultMessage: 'Veuillez contacter le propriétaire pour plus d\'informations.' })}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/${locale}/properties/${property.id}`}
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
                        {formatPrice(property.basePrice)} {t('booking.property.perNight')}
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
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {tenant?.name || 'Villa Booking'}. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}