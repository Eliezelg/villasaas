'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/lib/tenant-context'
import { PropertyImage } from '@/components/ui/property-image'
import { apiClient } from '@/lib/api-client-booking'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { MapPin, Users, Bed, Bath, Home, Calendar, Check, ChevronLeft } from 'lucide-react'
import { AvailabilityCalendar } from '@/components/booking/availability/availability-calendar'
import { useTranslations, useLocale } from 'next-intl'
import * as gtag from '@/lib/gtag'
import * as fbpixel from '@/lib/fbpixel'
import { BookingHeader } from '@/components/booking/layout/booking-header'
import { BookingFooter } from '@/components/booking/layout/booking-footer'
import { PageHeader } from '@/components/booking/page-header'

interface Property {
  id: string
  name: string
  description: { [key: string]: string }
  city: string
  country: string
  address: any
  maxGuests: number
  bedrooms: number
  bathrooms: number
  surfaceArea: number
  basePrice: number
  cleaningFee: number
  weekendPremium: number
  minNights: number
  checkInTime: string
  checkOutTime: string
  amenities: string[]
  atmosphere: string[]
  images: Array<{
    id: string
    url: string
    urls?: any
  }>
  periods: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    basePrice: number
  }>
}

export default function PropertyContent() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations()
  const { tenant } = useTenant()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDates, setSelectedDates] = useState<{
    checkIn: Date | null
    checkOut: Date | null
  }>({ checkIn: null, checkOut: null })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    loadProperty()
  }, [params.id])

  useEffect(() => {
    if (property) {
      gtag.trackPropertyView(property.id, property.name)
      fbpixel.fbTrackPropertyView(property.id, property.name, property.basePrice)
    }
  }, [property])

  async function loadProperty() {
    try {
      const response = await apiClient.getProperty(params.id as string)
      if (response.data) {
        setProperty(response.data)
      }
    } catch (error) {
      console.error('Failed to load property:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (checkIn: Date, checkOut: Date) => {
    setSelectedDates({ checkIn, checkOut })
  }

  const handleBooking = () => {
    if (selectedDates.checkIn && selectedDates.checkOut && property) {
      const checkIn = format(selectedDates.checkIn, 'yyyy-MM-dd')
      const checkOut = format(selectedDates.checkOut, 'yyyy-MM-dd')
      
      gtag.trackBookingStarted(property.id, property.name)
      fbpixel.fbTrackBookingStarted(property.basePrice)
      
      router.push(`/${locale}/booking/${property.id}?checkIn=${checkIn}&checkOut=${checkOut}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-gray-600">{t('common.messages.loading')}</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BookingHeader siteName={tenant?.name || 'Maison Aviv'} />
        <div className="container py-20 text-center">
          <p className="text-gray-600">{t('common.messages.error')}</p>
        </div>
        <BookingFooter />
      </div>
    )
  }

  const nights = selectedDates.checkIn && selectedDates.checkOut 
    ? Math.floor((selectedDates.checkOut.getTime() - selectedDates.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader siteName={property.name} />
      
      {/* Hero avec image principale */}
      <PageHeader 
        title={property.name}
        subtitle={`${property.city}, ${property.country}`}
        backgroundImage={property.images?.[selectedImageIndex]?.urls?.large || property.images?.[selectedImageIndex]?.url}
      />

      <main className="py-16">
        <div className="container mx-auto px-4">
          {/* Galerie d'images */}
          <section className="mb-16">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <div className="relative overflow-hidden rounded-lg shadow-xl">
                  <PropertyImage
                    src={property.images?.[selectedImageIndex]?.urls?.large || property.images?.[selectedImageIndex]?.url}
                    alt={property.name}
                    className="w-full h-[500px] object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4">
                {property.images?.slice(0, 4).map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative overflow-hidden rounded-lg shadow-md transition-all w-full",
                      selectedImageIndex === index && "ring-2 ring-accent"
                    )}
                  >
                    <PropertyImage
                      src={image.urls?.small || image.url}
                      alt={`${property.name} - ${index + 1}`}
                      className="w-full h-24 object-cover hover:scale-110 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Informations principales */}
            <div className="md:col-span-2">
              {/* Stats rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="font-playfair text-2xl text-primary">{property.maxGuests}</p>
                  <p className="text-sm text-gray-600">Personnes</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <Bed className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="font-playfair text-2xl text-primary">{property.bedrooms}</p>
                  <p className="text-sm text-gray-600">Chambres</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <Bath className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="font-playfair text-2xl text-primary">{property.bathrooms}</p>
                  <p className="text-sm text-gray-600">Salles de bain</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <Home className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="font-playfair text-2xl text-primary">{property.surfaceArea}</p>
                  <p className="text-sm text-gray-600">m²</p>
                </div>
              </div>

              {/* Description */}
              <section className="mb-12">
                <h2 className="font-playfair text-3xl text-primary mb-6">À propos de cette propriété</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {property.description[locale] || property.description.fr}
                </p>
              </section>

              {/* Équipements */}
              {property.amenities && property.amenities.length > 0 && (
                <section className="mb-12">
                  <h2 className="font-playfair text-3xl text-primary mb-6">Équipements</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                        <Check className="h-5 w-5 text-accent mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{t(`booking.amenities.${amenity}`)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Règles de la maison */}
              <section className="mb-12">
                <h2 className="font-playfair text-3xl text-primary mb-6">Informations pratiques</h2>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Horaires</h3>
                      <div className="space-y-2">
                        <p className="text-gray-700">
                          <span className="text-gray-500">Arrivée :</span> {property.checkInTime}
                        </p>
                        <p className="text-gray-700">
                          <span className="text-gray-500">Départ :</span> {property.checkOutTime}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Règles</h3>
                      <div className="space-y-2">
                        <p className="text-gray-700">
                          <span className="text-gray-500">Séjour minimum :</span> {property.minNights} nuits
                        </p>
                        <p className="text-gray-700">
                          <span className="text-gray-500">Capacité max :</span> {property.maxGuests} personnes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Widget de réservation */}
            <div>
              <div className="sticky top-24">
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-playfair text-2xl text-primary">Réserver</h3>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatPrice(property.basePrice)}</p>
                      <p className="text-sm text-gray-500">par nuit</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <AvailabilityCalendar
                      propertyId={property.id}
                      onDateSelect={handleDateSelect}
                      basePrice={property.basePrice}
                      minNights={property.minNights}
                    />
                  </div>

                  {selectedDates.checkIn && selectedDates.checkOut && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Arrivée</span>
                        <span className="font-medium">{format(selectedDates.checkIn, 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Départ</span>
                        <span className="font-medium">{format(selectedDates.checkOut, 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">{formatPrice(property.basePrice)} × {nights} nuits</span>
                          <span className="font-medium">{formatPrice(property.basePrice * nights)}</span>
                        </div>
                        {property.cleaningFee > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Frais de ménage</span>
                            <span className="font-medium">{formatPrice(property.cleaningFee)}</span>
                          </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
                          <span className="font-semibold">Total</span>
                          <span className="font-bold text-lg text-primary">
                            {formatPrice((property.basePrice * nights) + property.cleaningFee)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={!selectedDates.checkIn || !selectedDates.checkOut}
                    className={cn(
                      "w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all",
                      selectedDates.checkIn && selectedDates.checkOut
                        ? "bg-accent text-white hover:bg-accent/90 shadow-lg hover:shadow-xl"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {selectedDates.checkIn && selectedDates.checkOut 
                      ? 'Réserver maintenant'
                      : 'Sélectionnez vos dates'
                    }
                  </button>
                </div>

                {/* Informations supplémentaires */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Réservation sans engagement :</strong> Vous ne serez débité qu'après confirmation du propriétaire.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BookingFooter 
        siteName={tenant?.name || 'Maison Aviv'}
        address={property.city + ', ' + property.country}
        phone={tenant?.phone || '+33 3 88 00 00 00'}
        email={tenant?.email || 'contact@maisonaviv.fr'}
      />
    </div>
  )
}