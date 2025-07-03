'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/lib/tenant-context'
import { apiClient } from '@/lib/api-client'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Search, MapPin, Users, Bed, Calendar } from 'lucide-react'
import { PropertyFilters, type FilterValues } from '@/components/search/property-filters'

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
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    search: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  })
  const [filters, setFilters] = useState<FilterValues>({})

  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    setLoading(true)
    const response = await apiClient.getProperties({
      limit: 12,
      page: 1,
      ...filters,
    })
    
    if (response.data) {
      setProperties(response.data.properties || [])
    }
    
    setLoading(false)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
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
      setProperties(response.data.properties || [])
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

  if (tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">{tenant?.name || 'Villa Booking'}</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Trouvez votre villa de rêve
            </h1>
            <p className="mb-10 text-lg text-muted-foreground">
              Découvrez notre sélection de villas exceptionnelles pour des vacances inoubliables
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="rounded-lg bg-background p-4 shadow-lg">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label htmlFor="search" className="sr-only">
                    Destination
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="search"
                      type="text"
                      placeholder="Où souhaitez-vous aller ?"
                      value={searchParams.search}
                      onChange={(e) => setSearchParams({ ...searchParams, search: e.target.value })}
                      className="search-input pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="checkIn" className="sr-only">
                    Arrivée
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
                    Départ
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
                    Voyageurs
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="guests"
                      type="number"
                      min="1"
                      placeholder="Nombre de voyageurs"
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
                  Rechercher
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
          <h2 className="mb-8 text-3xl font-bold">Nos propriétés</h2>
          
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
              <p className="text-muted-foreground">Aucune propriété trouvée</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="property-card group block"
                >
                  <div className="relative">
                    {property.images?.[0] && (
                      <Image
                        src={property.images[0].urls?.medium || property.images[0].url}
                        alt={property.name}
                        width={400}
                        height={300}
                        className="property-image"
                      />
                    )}
                    <div className="absolute bottom-4 left-4">
                      <span className="price-badge">
                        {formatPrice(property.basePrice)} / nuit
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