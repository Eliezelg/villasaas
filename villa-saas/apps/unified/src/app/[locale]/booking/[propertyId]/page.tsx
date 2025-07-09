'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTenant } from '@/lib/tenant-context'
import { apiClient } from '@/lib/api-client-booking'
import { formatPrice, formatDate, formatDateRange, getDaysBetween } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Calendar, Users, CreditCard, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StripeWrapper } from '@/components/payment/stripe-wrapper'
import { StripePaymentForm } from '@/components/payment/stripe-payment-form'

interface Property {
  id: string
  name: string
  city: string
  country: string
  maxGuests: number
  images: Array<{
    id: string
    url: string
    urls?: {
      small?: string
    }
  }>
}

interface PricingDetails {
  nights: number
  basePrice: number
  totalAccommodation: number
  weekendPremium: number
  seasonalAdjustment: number
  longStayDiscount: number
  cleaningFee: number
  touristTax: number
  subtotal: number
  total: number
  averagePricePerNight: number
  breakdown: Array<{
    date: string
    basePrice: number
    weekendPremium: number
    finalPrice: number
    periodName?: string
  }>
}

interface BookingFormData {
  adults: number
  children: number
  infants: number
  pets: number
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  guestPhone: string
  guestCountry: string
  guestAddress: string
  specialRequests: string
}

type BookingStep = 'details' | 'payment' | 'confirmation'

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tenant } = useTenant()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [pricing, setPricing] = useState<PricingDetails | null>(null)
  const [currentStep, setCurrentStep] = useState<BookingStep>('details')
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null)
  
  const propertyId = params.propertyId as string
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guests = parseInt(searchParams.get('guests') || '1')
  
  const [formData, setFormData] = useState<BookingFormData>({
    adults: guests,
    children: 0,
    infants: 0,
    pets: 0,
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestPhone: '',
    guestCountry: 'FR',
    guestAddress: '',
    specialRequests: ''
  })

  useEffect(() => {
    if (!checkIn || !checkOut) {
      router.push(`/properties/${propertyId}`)
      return
    }
    
    loadData()
  }, [propertyId, checkIn, checkOut, guests])

  async function loadData() {
    setLoading(true)
    
    try {
      // Charger la propriété
      const propertyResponse = await apiClient.getProperty(propertyId)
      if (propertyResponse.data) {
        setProperty(propertyResponse.data)
      }
      
      // Calculer le prix
      setCalculating(true)
      const pricingResponse = await apiClient.calculatePrice({
        propertyId,
        checkIn: new Date(checkIn!).toISOString(),
        checkOut: new Date(checkOut!).toISOString(),
        guests
      })
      
      if (pricingResponse.data) {
        setPricing(pricingResponse.data)
      }
    } catch (error) {
      console.error('Error loading booking data:', error)
    } finally {
      setLoading(false)
      setCalculating(false)
    }
  }

  function updateFormData(field: keyof BookingFormData, value: any) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  function getTotalGuests() {
    return formData.adults + formData.children
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (currentStep === 'details') {
      // Valider les données
      if (!formData.guestFirstName || !formData.guestLastName || !formData.guestEmail || !formData.guestPhone) {
        return
      }
      
      // Créer l'intention de paiement et la réservation
      try {
        // D'abord créer l'intention de paiement
        const paymentResponse = await apiClient.request('/api/public/payments/create-intent', {
          method: 'POST',
          body: JSON.stringify({
            amount: pricing?.total || 0,
            currency: 'EUR',
            metadata: {
              propertyId,
              checkIn: new Date(checkIn!).toISOString(),
              checkOut: new Date(checkOut!).toISOString(),
              guestEmail: formData.guestEmail,
              guestName: `${formData.guestFirstName} ${formData.guestLastName}`,
              tenantId: tenant?.id || '',
            }
          })
        })
        
        if (paymentResponse.data?.clientSecret) {
          // Créer la réservation avec le paymentIntentId
          // Convertir les dates au format ISO datetime
          const checkInDate = new Date(checkIn!)
          const checkOutDate = new Date(checkOut!)
          
          const bookingResponse = await apiClient.createBooking({
            propertyId,
            checkIn: checkInDate.toISOString(),
            checkOut: checkOutDate.toISOString(),
            adults: formData.adults,
            children: formData.children,
            infants: formData.infants,
            pets: formData.pets,
            guestFirstName: formData.guestFirstName,
            guestLastName: formData.guestLastName,
            guestEmail: formData.guestEmail,
            guestPhone: formData.guestPhone,
            guestCountry: formData.guestCountry,
            guestAddress: formData.guestAddress,
            specialRequests: formData.specialRequests,
            paymentIntentId: paymentResponse.data.paymentIntentId,
          })
          
          if (bookingResponse.data) {
            setPaymentIntentClientSecret(paymentResponse.data.clientSecret)
            setCurrentStep('payment')
          } else {
            console.error('Failed to create booking')
          }
        } else {
          console.error('Failed to create payment intent')
        }
      } catch (error) {
        console.error('Error creating payment:', error)
      }
    }
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

  if (!property || !pricing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Erreur de chargement</h1>
          <Link href={`/properties/${propertyId}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la propriété
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const steps = [
    { id: 'details', label: 'Vos informations', icon: Users },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'confirmation', label: 'Confirmation', icon: Check }
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">{tenant?.name || 'Villa Booking'}</span>
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-background py-3">
        <div className="container">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Accueil
            </Link>
            <span>/</span>
            <Link href={`/properties/${propertyId}`} className="hover:text-foreground">
              {property.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">Réservation</span>
          </nav>
        </div>
      </div>

      {/* Steps */}
      <div className="border-b bg-background">
        <div className="container py-6">
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                    <div className={`
                      flex h-10 w-10 items-center justify-center rounded-full border-2
                      ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                        isCompleted ? 'border-primary bg-primary/10 text-primary' : 
                        'border-muted bg-muted text-muted-foreground'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`ml-3 font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-4 h-0.5 w-16 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {currentStep === 'details' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informations de réservation</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nombre de voyageurs */}
                    <div>
                      <h3 className="mb-4 font-medium">Nombre de voyageurs</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            Adultes
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={property.maxGuests}
                            value={formData.adults}
                            onChange={(e) => updateFormData('adults', parseInt(e.target.value))}
                            className="w-full rounded-md border px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            Enfants (2-12 ans)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={property.maxGuests - formData.adults}
                            value={formData.children}
                            onChange={(e) => updateFormData('children', parseInt(e.target.value))}
                            className="w-full rounded-md border px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            Bébés (- de 2 ans)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.infants}
                            onChange={(e) => updateFormData('infants', parseInt(e.target.value))}
                            className="w-full rounded-md border px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            Animaux
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.pets}
                            onChange={(e) => updateFormData('pets', parseInt(e.target.value))}
                            className="w-full rounded-md border px-3 py-2"
                          />
                        </div>
                      </div>
                      {getTotalGuests() > property.maxGuests && (
                        <p className="mt-2 text-sm text-destructive">
                          Cette propriété peut accueillir maximum {property.maxGuests} personnes
                        </p>
                      )}
                    </div>

                    {/* Informations personnelles */}
                    <div>
                      <h3 className="mb-4 font-medium">Vos informations</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            value={formData.guestFirstName}
                            onChange={(e) => updateFormData('guestFirstName', e.target.value)}
                            className="w-full rounded-md border px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            Nom *
                          </label>
                          <input
                            type="text"
                            value={formData.guestLastName}
                            onChange={(e) => updateFormData('guestLastName', e.target.value)}
                            className="w-full rounded-md border px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={formData.guestEmail}
                            onChange={(e) => updateFormData('guestEmail', e.target.value)}
                            className="w-full rounded-md border px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            Téléphone *
                          </label>
                          <input
                            type="tel"
                            value={formData.guestPhone}
                            onChange={(e) => updateFormData('guestPhone', e.target.value)}
                            className="w-full rounded-md border px-3 py-2"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Adresse */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Adresse
                      </label>
                      <textarea
                        value={formData.guestAddress}
                        onChange={(e) => updateFormData('guestAddress', e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                        rows={3}
                      />
                    </div>

                    {/* Demandes spéciales */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Demandes spéciales
                      </label>
                      <textarea
                        value={formData.specialRequests}
                        onChange={(e) => updateFormData('specialRequests', e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                        rows={3}
                        placeholder="Heure d'arrivée, besoins particuliers..."
                      />
                    </div>

                    <div className="flex justify-between">
                      <Link href={`/properties/${propertyId}`}>
                        <Button type="button" variant="outline">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Retour
                        </Button>
                      </Link>
                      <Button type="submit" disabled={getTotalGuests() > property.maxGuests}>
                        Continuer vers le paiement
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {currentStep === 'payment' && paymentIntentClientSecret && (
              <StripeWrapper clientSecret={paymentIntentClientSecret}>
                <StripePaymentForm
                  amount={pricing?.total || 0}
                  currency="EUR"
                  onSuccess={() => {
                    // Le paiement sera confirmé via le webhook
                    setCurrentStep('confirmation')
                  }}
                  onError={(error) => {
                    console.error('Payment error:', error)
                  }}
                />
              </StripeWrapper>
            )}

            {currentStep === 'confirmation' && (
              <Card>
                <CardHeader>
                  <CardTitle>Réservation confirmée !</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Merci pour votre réservation !</h3>
                    <p className="text-muted-foreground">
                      Un email de confirmation a été envoyé à {formData.guestEmail}
                    </p>
                    <Link href="/">
                      <Button className="mt-6">
                        Retour à l'accueil
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:sticky lg:top-20">
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la réservation</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Property info */}
                <div className="mb-4 flex gap-4">
                  {property.images?.[0] && (
                    <img
                      src={property.images[0].urls?.small || property.images[0].url}
                      alt={property.name}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{property.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {property.city}, {property.country}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="mb-4 space-y-2 border-y py-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Arrivée</span>
                    <span>{checkIn && format(new Date(checkIn), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Départ</span>
                    <span>{checkOut && format(new Date(checkOut), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Durée</span>
                    <span>{pricing.nights} nuits</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Voyageurs</span>
                    <span>{getTotalGuests()} personnes</span>
                  </div>
                </div>

                {/* Pricing */}
                {!calculating && pricing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatPrice(pricing.averagePricePerNight)} x {pricing.nights} nuits
                      </span>
                      <span>{formatPrice(pricing.totalAccommodation)}</span>
                    </div>
                    
                    {pricing.weekendPremium > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Supplément weekend</span>
                        <span>{formatPrice(pricing.weekendPremium)}</span>
                      </div>
                    )}
                    
                    {pricing.longStayDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Réduction long séjour</span>
                        <span>-{formatPrice(pricing.longStayDiscount)}</span>
                      </div>
                    )}
                    
                    {pricing.cleaningFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frais de ménage</span>
                        <span>{formatPrice(pricing.cleaningFee)}</span>
                      </div>
                    )}
                    
                    {pricing.touristTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxe de séjour</span>
                        <span>{formatPrice(pricing.touristTax)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(pricing.total)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}