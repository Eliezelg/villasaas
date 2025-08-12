'use client'

import { Bed, Users, Bath, Ruler } from 'lucide-react'
import { BookingHeader } from '@/components/booking/layout/booking-header'
import { BookingFooter } from '@/components/booking/layout/booking-footer'
import { PageHeader } from '@/components/booking/page-header'
import { CustomPagesNav } from '@/components/booking/property/custom-pages-nav'
import { useTenant } from '@/lib/tenant-context'

interface BedType {
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
  beds: BedType[]
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
    city: string
    country: string
    bedrooms: number
    bathrooms: number
    maxGuests: number
    images?: Array<{
      url: string
      urls?: any
    }>
    roomsContent?: Room[]
    customPages?: any
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

export function RoomsPageModern({ property, locale }: RoomsPageProps) {
  const rooms = property.roomsContent || []
  const { tenant } = useTenant()

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader siteName={property.name} />
      
      {/* Hero avec image de fond */}
      <PageHeader 
        title="Chambres"
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
            {/* Overview Stats Section */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="bg-gray-100 rounded-lg p-3 w-fit mx-auto mb-3">
                  <Bed className="h-8 w-8 text-gray-700" />
                </div>
                <p className="text-3xl font-bold mb-1">{property.bedrooms}</p>
                <p className="text-sm text-gray-600">
                  {locale === 'fr' ? 'Chambres' : 'Bedrooms'}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="bg-gray-100 rounded-lg p-3 w-fit mx-auto mb-3">
                  <Bath className="h-8 w-8 text-gray-700" />
                </div>
                <p className="text-3xl font-bold mb-1">{property.bathrooms}</p>
                <p className="text-sm text-gray-600">
                  {locale === 'fr' ? 'Salles de bain' : 'Bathrooms'}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="bg-gray-100 rounded-lg p-3 w-fit mx-auto mb-3">
                  <Users className="h-8 w-8 text-gray-700" />
                </div>
                <p className="text-3xl font-bold mb-1">{property.maxGuests}</p>
                <p className="text-sm text-gray-600">
                  {locale === 'fr' ? 'Personnes max' : 'Max guests'}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="bg-gray-100 rounded-lg p-3 w-fit mx-auto mb-3">
                  <Ruler className="h-8 w-8 text-gray-700" />
                </div>
                <p className="text-3xl font-bold mb-1">
                  {rooms.reduce((acc, room) => acc + (room.size || 0), 0) || '-'}
                </p>
                <p className="text-sm text-gray-600">
                  {locale === 'fr' ? 'm² chambres' : 'm² rooms'}
                </p>
              </div>
            </section>

            {/* Rooms List Section */}
            {rooms.length > 0 ? (
              <section>
                <h2 className="text-2xl font-bold mb-8">Détails des chambres</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {rooms.map((room, index) => (
                    <div 
                      key={index} 
                      className="bg-white rounded-2xl shadow-sm overflow-hidden"
                    >
                      <div className="p-8">
                        <h3 className="text-xl font-bold mb-4">
                          {room.name[locale as 'fr' | 'en'] || room.name.fr}
                        </h3>
                        
                        {/* Bed Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Bed className="h-5 w-5 text-gray-600" />
                              <span className="font-semibold">Lits</span>
                            </div>
                            {room.beds.map((bed, bedIndex) => (
                              bed.quantity > 0 && (
                                <div key={bedIndex} className="text-sm text-gray-600">
                                  {bed.quantity} {bedTypeLabels[bed.type]?.[locale as 'fr' | 'en'] || bedTypeLabels[bed.type]?.fr || bed.type}
                                </div>
                              )
                            ))}
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-5 w-5 text-gray-600" />
                              <span className="font-semibold">Capacité</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {room.maxOccupancy} {locale === 'fr' ? 'personnes' : 'guests'}
                            </div>
                            {room.size && (
                              <div className="text-sm text-gray-600 mt-1">
                                {room.size} m²
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amenities */}
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-3">Équipements</h4>
                            <div className="flex flex-wrap gap-2">
                              {room.amenities.map((amenity) => (
                                <span key={amenity} className="bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
                                  {amenityLabels[amenity]?.[locale as 'fr' | 'en'] || amenityLabels[amenity]?.fr || amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Private Amenities */}
                        {room.privateAmenities && Object.keys(room.privateAmenities).some(key => room.privateAmenities?.[key as keyof typeof room.privateAmenities]) && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-3">Espaces privés</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(room.privateAmenities).map(([key, value]) => (
                                value && (
                                  <span key={key} className="bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5 text-sm">
                                    {privateAmenityLabels[key]?.[locale as 'fr' | 'en'] || privateAmenityLabels[key]?.fr || key}
                                  </span>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {room.description && (
                          <p className="text-gray-600 leading-relaxed">
                            {room.description[locale as 'fr' | 'en'] || room.description.fr}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <p className="text-gray-600">
                  {locale === 'fr' 
                    ? 'Aucune information détaillée sur les chambres disponible.'
                    : 'No detailed room information available.'}
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
      
      <BookingFooter />
    </div>
  )
}