'use client'

import { useEffect, useRef } from 'react'
import { MapPin, Navigation, Clock, Car, Footprints } from 'lucide-react'
import { BookingHeader } from '@/components/booking/layout/booking-header'
import { BookingFooter } from '@/components/booking/layout/booking-footer'
import { PageHeader } from '@/components/booking/page-header'
import { CustomPagesNav } from '@/components/booking/property/custom-pages-nav'
import { useTenant } from '@/lib/tenant-context'

interface LocationPageProps {
  property: {
    id: string
    name: string
    address: string
    city: string
    country: string
    latitude: number | null
    longitude: number | null
    images?: Array<{
      url: string
      urls?: any
    }>
    proximity?: any
    locationContent?: {
      description: {
        fr: string
        en: string
      }
      nearbyPlaces: Array<{
        name: {
          fr: string
          en: string
        }
        category: string
        distance: number
        walkingTime?: number
        description?: {
          fr: string
          en: string
        }
      }>
    }
    customPages?: any
  }
  locale: string
}

const categoryIcons: Record<string, string> = {
  beach: '🏖️',
  restaurant: '🍽️',
  shop: '🛒',
  supermarket: '🛍️',
  activity: '🎯',
  transport: '🚉',
  hospital: '🏥',
  attraction: '🏛️',
  other: '📍'
}

const nearbyPlaces = [
  { icon: '🏖️', name: 'Plage', key: 'beach', unit: 'm' },
  { icon: '🛒', name: 'Commerces', key: 'shops', unit: 'm' },
  { icon: '🍽️', name: 'Restaurants', key: 'restaurants', unit: 'm' },
  { icon: '✈️', name: 'Aéroport', key: 'airport', unit: 'km' },
  { icon: '🚉', name: 'Gare', key: 'train', unit: 'km' },
  { icon: '🏥', name: 'Hôpital', key: 'hospital', unit: 'km' },
]

export function LocationPageModern({ property, locale }: LocationPageProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const { tenant } = useTenant()

  // Convertir les coordonnées en nombres si nécessaire
  const latitude = property.latitude ? Number(property.latitude) : null
  const longitude = property.longitude ? Number(property.longitude) : null

  // Debug: vérifier les coordonnées
  console.log('Property coordinates:', {
    originalLat: property.latitude,
    originalLng: property.longitude,
    latitude: latitude,
    longitude: longitude,
    hasLat: !!latitude,
    hasLng: !!longitude
  })

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Check if coordinates are available
    if (!latitude || !longitude) {
      console.log('No coordinates available, skipping map init')
      return
    }

    // Importer Leaflet dynamiquement côté client
    const initMap = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      
      // Fix Leaflet icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })

      // Initialize map
      const map = L.map(mapRef.current!).setView(
        [latitude, longitude],
        14
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      // Add marker
      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(property.name)

      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, property.name])

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader siteName={property.name} />
      
      {/* Hero avec image de fond */}
      <PageHeader 
        title="Localisation"
        subtitle={`${property.city}, ${property.country}`}
        backgroundImage={property.images?.[0]?.urls?.large || property.images?.[0]?.url}
      />

      {/* Navigation des pages personnalisées */}
      <CustomPagesNav 
        propertyId={property.id}
        customPages={property.customPages}
        locale={locale}
      />

      <main className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-12">
            {/* Description Section */}
            {property.locationContent?.description && (
              <section className="bg-white rounded-2xl shadow-sm p-8">
                <p className="text-lg leading-relaxed text-gray-700">
                  {property.locationContent.description[locale as 'fr' | 'en'] || 
                   property.locationContent.description.fr}
                </p>
              </section>
            )}

            {/* Map Section */}
            {latitude && longitude ? (
              <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div ref={mapRef} className="h-[500px] w-full" />
              </section>
            ) : (
              <section className="bg-white rounded-2xl shadow-sm p-8">
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Coordonnées GPS non disponibles</p>
                </div>
              </section>
            )}

            {/* Nearby Places Section */}
            <section>
              <h2 className="text-2xl font-bold mb-8">À proximité</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {property.locationContent?.nearbyPlaces && property.locationContent.nearbyPlaces.length > 0 ? (
                  // Use custom nearby places
                  property.locationContent.nearbyPlaces.map((place: any, index: number) => {
                    const displayDistance = place.distance >= 1000 
                      ? `${(place.distance / 1000).toFixed(1)} km`
                      : `${place.distance} m`

                    return (
                      <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl flex-shrink-0">
                            {categoryIcons[place.category] || categoryIcons.other}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">
                              {place.name[locale as 'fr' | 'en'] || place.name.fr}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {displayDistance}
                              </span>
                              {place.walkingTime && (
                                <span className="flex items-center gap-1">
                                  <Footprints className="h-4 w-4" />
                                  {place.walkingTime} min
                                </span>
                              )}
                            </div>
                            {place.description && (
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {place.description[locale as 'fr' | 'en'] || place.description.fr}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  // Fallback to default places
                  nearbyPlaces.map((place) => {
                    const distance = property.proximity?.[place.key]
                    if (!distance) return null

                    const displayDistance = place.unit === 'km' 
                      ? `${(distance / 1000).toFixed(1)} km`
                      : `${distance} m`

                    return (
                      <div key={place.key} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{place.icon}</span>
                          <div>
                            <h3 className="font-semibold text-lg">{place.name}</h3>
                            <p className="text-sm text-gray-600">
                              {displayDistance}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            {/* Directions Section */}
            <section className="bg-white rounded-2xl shadow-sm p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Comment s'y rendre
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Car className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">En voiture</h4>
                    <p className="text-gray-600">
                      Parking gratuit disponible sur place
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Clock className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Check-in</h4>
                    <p className="text-gray-600">
                      Arrivée autonome avec boîte à clés sécurisée
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* GPS Coordinates Section */}
            <section className="bg-white rounded-2xl shadow-sm p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Coordonnées GPS
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Latitude</p>
                  <p className="font-mono text-lg font-semibold">{latitude?.toFixed(6) || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Longitude</p>
                  <p className="font-mono text-lg font-semibold">{longitude?.toFixed(6) || 'N/A'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <BookingFooter />
    </div>
  )
}