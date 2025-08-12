'use client'

import { Check, Plus, Phone } from 'lucide-react'
import { BookingHeader } from '@/components/booking/layout/booking-header'
import { BookingFooter } from '@/components/booking/layout/booking-footer'
import { PageHeader } from '@/components/booking/page-header'
import { CustomPagesNav } from '@/components/booking/property/custom-pages-nav'
import { useTenant } from '@/lib/tenant-context'

interface Service {
  name: {
    fr: string
    en: string
  }
  description?: {
    fr: string
    en: string
  }
  price?: string
}

interface ServicesPageProps {
  property: {
    id: string
    name: string
    city: string
    country: string
    images?: Array<{
      url: string
      urls?: any
    }>
    servicesContent?: {
      included?: Service[]
      optional?: Service[]
      onRequest?: Service[]
    }
    customPages?: any
  }
  locale: string
}

export function ServicesPageModern({ property, locale }: ServicesPageProps) {
  const services = property.servicesContent || {}
  const { tenant } = useTenant()

  const hasServices = 
    (services.included && services.included.length > 0) ||
    (services.optional && services.optional.length > 0) ||
    (services.onRequest && services.onRequest.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader siteName={property.name} />
      
      {/* Hero avec image de fond */}
      <PageHeader 
        title="Services"
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
            {hasServices ? (
              <>
                {/* Services Inclus */}
                {services.included && services.included.length > 0 && (
                  <section>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-2">
                        {locale === 'fr' ? 'Services inclus' : 'Included services'}
                      </h2>
                      <p className="text-gray-600">
                        {locale === 'fr' 
                          ? 'Ces services sont inclus dans votre réservation sans frais supplémentaires.'
                          : 'These services are included in your booking at no extra charge.'}
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {services.included.map((service, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-green-100 rounded-lg p-2 flex-shrink-0">
                              <Check className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold mb-1">
                                {service.name[locale as 'fr' | 'en'] || service.name.fr}
                              </h3>
                              {service.description && (
                                <p className="text-sm text-gray-600">
                                  {service.description[locale as 'fr' | 'en'] || service.description.fr}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Services Optionnels */}
                {services.optional && services.optional.length > 0 && (
                  <section>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-2">
                        {locale === 'fr' ? 'Services optionnels' : 'Optional services'}
                      </h2>
                      <p className="text-gray-600">
                        {locale === 'fr' 
                          ? 'Services disponibles moyennant un supplément.'
                          : 'Services available for an additional fee.'}
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {services.optional.map((service, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
                              <Plus className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">
                                {service.name[locale as 'fr' | 'en'] || service.name.fr}
                              </h3>
                              {service.price && (
                                <p className="text-sm font-medium text-blue-600 mb-1">
                                  {service.price}
                                </p>
                              )}
                              {service.description && (
                                <p className="text-sm text-gray-600">
                                  {service.description[locale as 'fr' | 'en'] || service.description.fr}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Services Sur Demande */}
                {services.onRequest && services.onRequest.length > 0 && (
                  <section>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-2">
                        {locale === 'fr' ? 'Services sur demande' : 'Services on request'}
                      </h2>
                      <p className="text-gray-600">
                        {locale === 'fr' 
                          ? 'Contactez-nous pour plus d\'informations sur ces services.'
                          : 'Contact us for more information about these services.'}
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {services.onRequest.map((service, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-gray-100 rounded-lg p-2 flex-shrink-0">
                              <Phone className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">
                                {service.name[locale as 'fr' | 'en'] || service.name.fr}
                              </h3>
                              {service.price && (
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                  {service.price}
                                </p>
                              )}
                              {service.description && (
                                <p className="text-sm text-gray-600">
                                  {service.description[locale as 'fr' | 'en'] || service.description.fr}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <section className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <p className="text-gray-600">
                  {locale === 'fr' 
                    ? 'Aucun service n\'a encore été configuré pour cette propriété.'
                    : 'No services have been configured for this property yet.'}
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