'use client'

import { useState } from 'react'
import { Bed, Users, Bath, Ruler } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface Bed {
  type: string
  quantity: number
}

interface Room {
  name: {
    fr: string
    en: string
  }
  description: {
    fr: string
    en: string
  }
  beds: Bed[]
  maxOccupancy: number
  size?: number
  amenities: string[]
  privateAmenities?: {
    bathroom?: boolean
    toilet?: boolean
    balcony?: boolean
    terrace?: boolean
    kitchenette?: boolean
  }
}

interface RoomsPageProps {
  property: {
    id: string
    name: string
    bedrooms: number
    bathrooms: number
    maxGuests: number
    roomsContent?: Room[]
  }
  locale: string
}

const bedTypeLabels: Record<string, { fr: string; en: string }> = {
  single: { fr: 'Lit simple', en: 'Single bed' },
  double: { fr: 'Lit double', en: 'Double bed' },
  queen: { fr: 'Lit Queen', en: 'Queen bed' },
  king: { fr: 'Lit King', en: 'King bed' },
  sofa: { fr: 'Canapé-lit', en: 'Sofa bed' },
  bunk: { fr: 'Lits superposés', en: 'Bunk beds' },
}

const amenityLabels: Record<string, { fr: string; en: string }> = {
  air_conditioning: { fr: 'Climatisation', en: 'Air conditioning' },
  heating: { fr: 'Chauffage', en: 'Heating' },
  tv: { fr: 'Télévision', en: 'TV' },
  wifi: { fr: 'Wi-Fi', en: 'Wi-Fi' },
  desk: { fr: 'Bureau', en: 'Desk' },
  wardrobe: { fr: 'Armoire', en: 'Wardrobe' },
  safe: { fr: 'Coffre-fort', en: 'Safe' },
  minibar: { fr: 'Minibar', en: 'Minibar' },
  coffee_machine: { fr: 'Machine à café', en: 'Coffee machine' },
  hairdryer: { fr: 'Sèche-cheveux', en: 'Hairdryer' },
}

const privateAmenityLabels: Record<string, { fr: string; en: string }> = {
  bathroom: { fr: 'Salle de bain privée', en: 'Private bathroom' },
  toilet: { fr: 'WC privé', en: 'Private toilet' },
  balcony: { fr: 'Balcon', en: 'Balcony' },
  terrace: { fr: 'Terrasse', en: 'Terrace' },
  kitchenette: { fr: 'Kitchenette', en: 'Kitchenette' },
}

export function RoomsPage({ property, locale }: RoomsPageProps) {
  const rooms = property.roomsContent || []

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {locale === 'fr' ? 'Chambres' : 'Rooms'}
          </h1>
          <p className="text-muted-foreground">
            {property.bedrooms} {locale === 'fr' ? 'chambres' : 'bedrooms'} • 
            {property.bathrooms} {locale === 'fr' ? 'salles de bain' : 'bathrooms'} • 
            {property.maxGuests} {locale === 'fr' ? 'personnes max' : 'max guests'}
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Bed className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{property.bedrooms}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'Chambres' : 'Bedrooms'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Bath className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{property.bathrooms}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'Salles de bain' : 'Bathrooms'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{property.maxGuests}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'Personnes max' : 'Max guests'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Ruler className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">
                {rooms.reduce((acc, room) => acc + (room.size || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'm² chambres' : 'm² rooms'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rooms List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, index) => (
            <Card 
              key={index} 
              className="overflow-hidden"
            >
              {/* Room images would go here if available */}
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">
                  {room.name[locale as 'fr' | 'en'] || room.name.fr}
                </h3>
                
                {/* Bed Info */}
                <div className="space-y-2 mb-4">
                  {room.beds.map((bed, bedIndex) => (
                    bed.quantity > 0 && (
                      <div key={bedIndex} className="flex items-center gap-2 text-sm">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {bed.quantity} {bedTypeLabels[bed.type]?.[locale as 'fr' | 'en'] || bedTypeLabels[bed.type]?.fr || bed.type}
                        </span>
                      </div>
                    )
                  ))}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {room.maxOccupancy} {locale === 'fr' ? 'personnes max' : 'max guests'}
                    </span>
                  </div>
                  {room.size && (
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>{room.size} m²</span>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenityLabels[amenity]?.[locale as 'fr' | 'en'] || amenityLabels[amenity]?.fr || amenity}
                      </Badge>
                    ))}
                    {room.amenities.length > 3 && (
                      <Badge variant="outline">
                        +{room.amenities.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Description */}
                {room.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {room.description[locale as 'fr' | 'en'] || room.description.fr}
                  </p>
                )}

                {/* Private Amenities Badges */}
                {room.privateAmenities && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {Object.entries(room.privateAmenities).map(([key, value]) => (
                      value && (
                        <Badge key={key} variant="default">
                          {privateAmenityLabels[key]?.[locale as 'fr' | 'en'] || privateAmenityLabels[key]?.fr || key}
                        </Badge>
                      )
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {locale === 'fr' ? 'Informations supplémentaires' : 'Additional Information'}
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <ul>
                {locale === 'fr' ? (
                  <>
                    <li>Tous les lits sont équipés de draps de haute qualité</li>
                    <li>Serviettes de bain fournies pour chaque personne</li>
                    <li>Oreillers supplémentaires disponibles sur demande</li>
                    <li>Lit bébé et chaise haute disponibles gratuitement</li>
                    <li>Possibilité d'ajouter un lit d'appoint (supplément applicable)</li>
                  </>
                ) : (
                  <>
                    <li>All beds are equipped with high quality linens</li>
                    <li>Bath towels provided for each person</li>
                    <li>Extra pillows available upon request</li>
                    <li>Baby cot and high chair available free of charge</li>
                    <li>Extra bed can be added (additional charge applies)</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}