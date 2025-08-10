'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTenant } from '@/lib/tenant-context'
import { PropertyImage } from '@/components/ui/property-image'
import { apiClient } from '@/lib/api-client-booking'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { MapPin, Users, Bed, Bath, Home, Calendar, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AvailabilityCalendar } from '@/components/booking/availability/availability-calendar'
import { useTranslations, useLocale } from 'next-intl'
import * as gtag from '@/lib/gtag'
import * as fbpixel from '@/lib/fbpixel'

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
  const [showBackButton, setShowBackButton] = useState(true)
  const [selectedDates, setSelectedDates] = useState<{
    checkIn: Date | null
    checkOut: Date | null
  }>({ checkIn: null, checkOut: null })

  useEffect(() => {
    loadProperty()
    checkMultipleProperties()
  }, [params.id])

  useEffect(() => {
    if (property) {
      // Track property view
      gtag.trackPropertyView(property.id, property.name)
      fbpixel.fbTrackPropertyView(property.id, property.name, property.basePrice)
    }
  }, [property])

  async function checkMultipleProperties() {
    try {
      const response = await apiClient.getProperties({ limit: 2 })
      if (response.data) {
        // Si il n'y a qu'une seule propriété, masquer le bouton retour
        setShowBackButton(response.data.properties.length > 1)
      }
    } catch (error) {
      console.error('Failed to check properties count:', error)
    }
  }

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
      
      // Track booking started
      gtag.trackBookingStarted(property.id, property.name)
      fbpixel.fbTrackBookingStarted(property.basePrice)
      
      router.push(`/${locale}/booking/${property.id}?checkIn=${checkIn}&checkOut=${checkOut}`)
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container py-8">
        <p>{t('common.messages.error')}</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {showBackButton && (
        <Link
          href={`/${locale}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.actions.back')}
        </Link>
      )}

      {/* Images Gallery */}
      <div className="grid grid-cols-4 gap-2 mb-8 h-96">
        {property.images?.[0] && (
          <div className="col-span-2 row-span-2">
            <PropertyImage
              src={property.images[0].urls?.large || property.images[0].url}
              alt={property.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
        {property.images?.slice(1, 5).map((image, index) => (
          <PropertyImage
            key={image.id}
            src={image.urls?.medium || image.url}
            alt={`${property.name} - ${index + 2}`}
            className="w-full h-full object-cover rounded-lg"
          />
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Property Details */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
          <div className="flex items-center text-muted-foreground mb-6">
            <MapPin className="mr-1 h-4 w-4" />
            {property.city}, {property.country}
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>{property.maxGuests} {t('booking.property.maxGuests', { count: property.maxGuests })}</span>
            </div>
            <div className="flex items-center">
              <Bed className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>{property.bedrooms} {t('booking.property.bedrooms', { count: property.bedrooms })}</span>
            </div>
            <div className="flex items-center">
              <Bath className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>{property.bathrooms} {t('booking.property.bathrooms', { count: property.bathrooms })}</span>
            </div>
            <div className="flex items-center">
              <Home className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>{property.surfaceArea} m²</span>
            </div>
          </div>

          {/* Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('booking.property.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{property.description[locale] || property.description.fr}</p>
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('booking.property.amenities')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center">
                      <span className="text-sm">{t(`booking.amenities.${amenity}`)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* House Rules */}
          <Card>
            <CardHeader>
              <CardTitle>{t('booking.property.houseRules')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>{t('booking.property.checkInTime', { time: property.checkInTime })}</p>
              <p>{t('booking.property.checkOutTime', { time: property.checkOutTime })}</p>
              <p>{t('booking.property.minStay', { nights: property.minNights })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Widget */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('booking.booking.title')}</span>
                <span className="text-2xl font-bold">
                  {formatPrice(property.basePrice)} <span className="text-sm font-normal">{t('booking.property.perNight')}</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <AvailabilityCalendar
                  propertyId={property.id}
                  onDateSelect={handleDateSelect}
                  basePrice={property.basePrice}
                  minNights={property.minNights}
                />
              </div>
              
              {/* Message d'instruction si aucune date sélectionnée */}
              {(!selectedDates.checkIn || !selectedDates.checkOut) && (
                <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm text-center">
                  <p className="font-medium">Sélectionnez vos dates pour réserver</p>
                  <p className="text-muted-foreground mt-1">
                    Choisissez une date d'arrivée puis une date de départ
                  </p>
                </div>
              )}
              
              {/* Résumé de la réservation si dates sélectionnées */}
              {selectedDates.checkIn && selectedDates.checkOut && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Arrivée:</span>
                    <span className="font-medium">{format(selectedDates.checkIn, 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Départ:</span>
                    <span className="font-medium">{format(selectedDates.checkOut, 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2 border-t">
                    <span>Nombre de nuits:</span>
                    <span>{Math.floor((selectedDates.checkOut.getTime() - selectedDates.checkIn.getTime()) / (1000 * 60 * 60 * 24))}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleBooking}
                disabled={!selectedDates.checkIn || !selectedDates.checkOut}
                className={cn(
                  "w-full h-11 rounded-md px-8 font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  !selectedDates.checkIn || !selectedDates.checkOut 
                    ? "bg-gray-200 text-gray-700 border border-gray-400 hover:bg-gray-300 hover:text-gray-900" 
                    : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                )}
              >
                {selectedDates.checkIn && selectedDates.checkOut 
                  ? t('common.actions.book')
                  : 'Sélectionnez vos dates'
                }
              </button>

              {property.cleaningFee > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  {t('booking.booking.cleaningFee')}: {formatPrice(property.cleaningFee)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}