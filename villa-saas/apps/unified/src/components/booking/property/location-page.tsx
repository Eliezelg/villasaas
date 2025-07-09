'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Clock, Car } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LocationPageProps {
  property: {
    name: string
    address: string
    city: string
    latitude: number
    longitude: number
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

const categoryLabels: Record<string, string> = {
  beach: 'Plage',
  restaurant: 'Restaurant',
  shop: 'Commerce',
  supermarket: 'Supermarché',
  activity: 'Activité',
  transport: 'Transport',
  hospital: 'Hôpital',
  attraction: 'Attraction',
  other: 'Autre'
}

const nearbyPlaces = [
  { icon: '🏖️', name: 'Plage', key: 'beach', unit: 'm' },
  { icon: '🛒', name: 'Commerces', key: 'shops', unit: 'm' },
  { icon: '🍽️', name: 'Restaurants', key: 'restaurants', unit: 'm' },
  { icon: '✈️', name: 'Aéroport', key: 'airport', unit: 'km' },
  { icon: '🚉', name: 'Gare', key: 'train', unit: 'km' },
  { icon: '🏥', name: 'Hôpital', key: 'hospital', unit: 'km' },
]

export function LocationPage({ property, locale }: LocationPageProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Fix Leaflet icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    })

    // Initialize map
    const map = L.map(mapRef.current).setView(
      [property.latitude, property.longitude],
      14
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    // Add marker
    L.marker([property.latitude, property.longitude])
      .addTo(map)
      .bindPopup(property.name)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [property])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Localisation</h1>
          <p className="text-muted-foreground">
            {property.address}, {property.city}
          </p>
          {property.locationContent?.description && (
            <p className="mt-4 text-lg">
              {property.locationContent.description[locale as 'fr' | 'en'] || 
               property.locationContent.description.fr}
            </p>
          )}
        </div>

        {/* Map */}
        <Card className="overflow-hidden">
          <div ref={mapRef} className="h-[500px] w-full" />
        </Card>

        {/* Nearby Places */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">À proximité</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {property.locationContent?.nearbyPlaces && property.locationContent.nearbyPlaces.length > 0 ? (
              // Use custom nearby places
              property.locationContent.nearbyPlaces.map((place: any, index: number) => {
                const displayDistance = place.distance >= 1000 
                  ? `${(place.distance / 1000).toFixed(1)} km`
                  : `${place.distance} m`

                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <span className="text-3xl">
                          {categoryIcons[place.category] || categoryIcons.other}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">
                            {place.name[locale as 'fr' | 'en'] || place.name.fr}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{displayDistance}</span>
                            {place.walkingTime && (
                              <span>• {place.walkingTime} min à pied</span>
                            )}
                          </div>
                          {place.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {place.description[locale as 'fr' | 'en'] || place.description.fr}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card key={place.key}>
                    <CardContent className="flex items-center space-x-4 p-6">
                      <span className="text-3xl">{place.icon}</span>
                      <div>
                        <p className="font-medium">{place.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {displayDistance}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Directions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Comment s'y rendre
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">En voiture</p>
                  <p className="text-sm text-muted-foreground">
                    Parking gratuit disponible sur place
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Check-in</p>
                  <p className="text-sm text-muted-foreground">
                    Arrivée autonome avec boîte à clés sécurisée
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPS Coordinates */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Coordonnées GPS
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Latitude</p>
                <p className="font-mono">{property.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longitude</p>
                <p className="font-mono">{property.longitude.toFixed(6)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}