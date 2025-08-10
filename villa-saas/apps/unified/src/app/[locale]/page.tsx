'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useTenant } from '@/lib/tenant-context'
import { apiClient } from '@/lib/api-client-booking'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { MapPin, Users, Bed, Home, Phone } from 'lucide-react'
import { PropertyImage } from '@/components/ui/property-image'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageSelector } from '@/components/language-selector'
import * as gtag from '@/lib/gtag'
import * as fbpixel from '@/lib/fbpixel'
import { useRouter } from 'next/navigation'
import { BookingHeader } from '@/components/booking/layout/booking-header'
import { BookingFooter } from '@/components/booking/layout/booking-footer'
import { PageHeader } from '@/components/booking/page-header'

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
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    loadProperties(true)
  }, [])

  async function loadProperties(isInitial = false) {
    setLoading(true)
    const response = await apiClient.getProperties({
      limit: 12,
      page: 1,
      status: 'PUBLISHED'
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
    <div className="min-h-screen bg-gray-50">
      <BookingHeader siteName={tenant?.name || 'Maison Aviv'} />

      <PageHeader 
        title={tenant?.name || 'Maison Aviv'}
        subtitle="Une demeure d'exception pour vos événements inoubliables"
        backgroundImage={properties[0]?.images?.[0]?.urls?.large || properties[0]?.images?.[0]?.url || '/images/hero-default.jpg'}
      />

      <main>

        {/* Présentation */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="font-playfair text-4xl text-center mb-16">Bienvenue chez {tenant?.name || 'nous'}</h2>
            <div className="max-w-3xl mx-auto text-center">
              <p className="mb-6 text-lg text-gray-700 leading-relaxed">
                Découvrez nos propriétés d'exception, idéalement situées pour vos séjours en famille,
                entre amis ou vos séminaires d'entreprise.
              </p>
              {properties.length > 0 && (
                <div className="grid md:grid-cols-3 gap-8 mt-12">
                  <div className="text-center p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="font-playfair text-4xl mb-4 text-primary">
                      {Math.max(...properties.map(p => p.maxGuests))}
                    </h3>
                    <p className="text-gray-600">Personnes maximum</p>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="font-playfair text-4xl mb-4 text-primary">
                      {Math.max(...properties.map(p => p.bedrooms))}
                    </h3>
                    <p className="text-gray-600">Chambres</p>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="font-playfair text-4xl mb-4 text-primary">
                      {properties.length}
                    </h3>
                    <p className="text-gray-600">Propriétés</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Properties Grid */}
        {properties.length > 0 && (
          <section id="chambres" className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="font-playfair text-4xl text-center mb-16">Nos Propriétés</h2>
          
              {loading ? (
                <div className="grid gap-8 md:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[4/3] rounded-lg bg-gray-200" />
                      <div className="mt-4 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                        <div className="h-4 w-1/2 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-3">
                  {properties.map((property) => (
                    <Link
                      key={property.id}
                      href={`/${locale}/properties/${property.id}`}
                      className="group"
                    >
                      <div className="relative overflow-hidden rounded-lg shadow-lg">
                        {property.images?.[0] && (
                          <PropertyImage
                            src={property.images[0].urls?.medium || property.images[0].url}
                            alt={property.name}
                            className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-white">
                            <h3 className="text-xl font-playfair mb-2">{property.name}</h3>
                            <p className="text-sm opacity-90">
                              {formatPrice(property.basePrice)} / nuit
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="font-playfair text-xl mb-2">{property.name}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="mr-1 h-4 w-4" />
                          <span className="text-sm">{property.city}, {property.country}</span>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
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
        )}

        {/* Services */}
        <section id="installations" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="font-playfair text-4xl text-center mb-16">Nos services</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group">
                <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <h3 className="font-playfair text-2xl mb-4 group-hover:text-accent">Chambres Confortables</h3>
                  <p className="text-gray-600">
                    Chambres spacieuses et élégamment décorées, équipées de tout le confort moderne
                    pour un séjour inoubliable.
                  </p>
                  <div className="mt-6 text-accent group-hover:translate-x-2 transition-transform">
                    En savoir plus →
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <h3 className="font-playfair text-2xl mb-4 group-hover:text-accent">Installations Premium</h3>
                  <p className="text-gray-600">
                    Piscine chauffée, salle de cinéma, terrains de sport et espaces de détente
                    pour tous vos moments de loisir.
                  </p>
                  <div className="mt-6 text-accent group-hover:translate-x-2 transition-transform">
                    En savoir plus →
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <h3 className="font-playfair text-2xl mb-4 group-hover:text-accent">Services Exclusifs</h3>
                  <p className="text-gray-600">
                    Service de conciergerie, chef privé sur demande, et organisation d'événements
                    pour une expérience sur mesure.
                  </p>
                  <div className="mt-6 text-accent group-hover:translate-x-2 transition-transform">
                    En savoir plus →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-playfair text-4xl mb-8">Prêt à réserver votre séjour ?</h2>
            <p className="max-w-2xl mx-auto mb-12 text-lg opacity-90">
              Contactez-nous dès maintenant pour organiser votre prochain événement dans notre magnifique demeure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {properties.length > 0 && (
                <a
                  href="#chambres"
                  className="inline-block bg-accent text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-accent/90 transition-colors"
                >
                  Voir nos propriétés
                </a>
              )}
              <a
                href="tel:+33388000000"
                className="inline-block bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Phone className="inline-block mr-2 h-5 w-5" />
                Nous appeler
              </a>
            </div>
          </div>
        </section>
      </main>

      <BookingFooter
        siteName={tenant?.name || 'Maison Aviv'}
        address={tenant?.address || 'France'}
        phone={tenant?.phone || '+33 3 88 00 00 00'}
        email={tenant?.email || 'contact@maisonaviv.fr'}
      />
    </div>
  )
}