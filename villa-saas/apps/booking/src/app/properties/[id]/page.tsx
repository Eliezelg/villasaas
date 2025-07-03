'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useTenant } from '@/lib/tenant-context'
import { apiClient } from '@/lib/api-client'
import { formatPrice, formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { MapPin, Users, Bed, Bath, Home, Calendar, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AvailabilityCalendar } from '@/components/availability/availability-calendar'

interface Property {
  id: string
  name: string
  description: { [key: string]: string }
  city: string
  country: string
  address: string
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
    urls?: {
      small?: string
      medium?: string
      large?: string
      original?: string
    }
  }>
  periods: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    basePrice: number
    weekendPremium: number
    minNights: number
  }>
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tenant } = useTenant()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedDates, setSelectedDates] = useState<{ checkIn: Date | null; checkOut: Date | null }>({
    checkIn: null,
    checkOut: null
  })
  const [guests, setGuests] = useState(1)

  useEffect(() => {
    if (params.id) {
      loadProperty(params.id as string)
    }
  }, [params.id])

  async function loadProperty(id: string) {
    setLoading(true)
    const response = await apiClient.getProperty(id)
    
    if (response.data) {
      setProperty(response.data)
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Propriété non trouvée</h1>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </Link>
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

      {/* Breadcrumb */}
      <div className="border-b py-3">
        <div className="container">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Accueil
            </Link>
            <span>/</span>
            <span className="text-foreground">{property.name}</span>
          </nav>
        </div>
      </div>

      {/* Property Details */}
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Location */}
            <div className="mb-6">
              <h1 className="mb-2 text-3xl font-bold">{property.name}</h1>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-1 h-4 w-4" />
                {property.address}, {property.city}, {property.country}
              </div>
            </div>

            {/* Image Gallery */}
            {property.images && property.images.length > 0 && (
              <div className="mb-8">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                  <Image
                    src={property.images[selectedImage]?.urls?.large || property.images[selectedImage]?.url}
                    alt={property.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {property.images.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {property.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square overflow-hidden rounded-md border-2 ${
                          index === selectedImage ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <Image
                          src={image.urls?.small || image.url}
                          alt={`${property.name} - ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Property Info */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{property.maxGuests} voyageurs</span>
                  </div>
                  <div className="flex items-center">
                    <Bed className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{property.bedrooms} chambres</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{property.bathrooms} salles de bain</span>
                  </div>
                  <div className="flex items-center">
                    <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{property.surfaceArea} m²</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  {property.description.fr || property.description.en || 'Aucune description disponible'}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Équipements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <span className="text-sm">✓ {amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* House Rules */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Règles de la maison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Arrivée :</strong> à partir de {property.checkInTime}
                  </div>
                  <div>
                    <strong>Départ :</strong> avant {property.checkOutTime}
                  </div>
                  <div>
                    <strong>Séjour minimum :</strong> {property.minNights} nuits
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Disponibilités et tarifs</CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityCalendar
                  propertyId={property.id}
                  basePrice={property.basePrice}
                  minNights={property.minNights}
                  onDateSelect={(checkIn, checkOut) => {
                    setSelectedDates({ checkIn, checkOut })
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Booking Widget */}
          <div className="lg:sticky lg:top-20">
            <Card>
              <CardHeader>
                <CardTitle>Réserver</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-2xl font-bold">
                    {formatPrice(property.basePrice)}
                    <span className="text-base font-normal text-muted-foreground"> / nuit</span>
                  </div>
                  {property.cleaningFee > 0 && (
                    <div className="text-sm text-muted-foreground">
                      + {formatPrice(property.cleaningFee)} frais de ménage
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Arrivée</label>
                    <input
                      type="date"
                      className="w-full rounded-md border px-3 py-2"
                      value={selectedDates.checkIn ? format(selectedDates.checkIn, 'yyyy-MM-dd') : ''}
                      readOnly
                      placeholder="Sélectionnez dans le calendrier"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Départ</label>
                    <input
                      type="date"
                      className="w-full rounded-md border px-3 py-2"
                      value={selectedDates.checkOut ? format(selectedDates.checkOut, 'yyyy-MM-dd') : ''}
                      readOnly
                      placeholder="Sélectionnez dans le calendrier"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Voyageurs</label>
                    <input
                      type="number"
                      min="1"
                      max={property.maxGuests}
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                </div>

                <Button 
                  className="mt-6 w-full" 
                  size="lg"
                  onClick={() => {
                    if (selectedDates.checkIn && selectedDates.checkOut) {
                      const params = new URLSearchParams({
                        checkIn: selectedDates.checkIn.toISOString(),
                        checkOut: selectedDates.checkOut.toISOString(),
                        guests: guests.toString()
                      })
                      router.push(`/booking/${property.id}?${params}`)
                    }
                  }}
                  disabled={!selectedDates.checkIn || !selectedDates.checkOut}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDates.checkIn && selectedDates.checkOut ? 'Réserver maintenant' : 'Sélectionnez vos dates'}
                </Button>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Vous ne serez pas débité pour le moment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t py-8">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {tenant?.name || 'Villa Booking'}. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}