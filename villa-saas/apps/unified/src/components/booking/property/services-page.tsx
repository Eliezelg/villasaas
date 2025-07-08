'use client'

import { Check, X, Euro, Clock, Users, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Service {
  name: {
    fr: string
    en: string
  }
  description?: {
    fr: string
    en: string
  }
  category: string
  price?: string
  availability?: {
    fr: string
    en: string
  }
}

interface ServicesContent {
  included: Service[]
  optional: Service[]
  onRequest: Service[]
}

interface ServicesPageProps {
  property: {
    id: string
    name: string
    cleaningFee?: number
    amenities?: any
    servicesContent?: ServicesContent
  }
  locale: string
}

export function ServicesPage({ property, locale }: ServicesPageProps) {
  const servicesContent = property.servicesContent || {
    included: [],
    optional: [],
    onRequest: []
  }

  const includedServices = servicesContent.included
  const optionalServices = servicesContent.optional
  const onRequestServices = servicesContent.onRequest

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {locale === 'fr' ? 'Services et équipements' : 'Services and Amenities'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' 
              ? 'Tout ce dont vous avez besoin pour un séjour parfait'
              : 'Everything you need for a perfect stay'
            }
          </p>
        </div>

        {/* Services Inclus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              {locale === 'fr' ? 'Services inclus' : 'Included Services'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {includedServices.map((service, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {service.name[locale as 'fr' | 'en'] || service.name.fr}
                      </h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">
                          {service.description[locale as 'fr' | 'en'] || service.description.fr}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services Optionnels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-blue-600" />
              {locale === 'fr' ? 'Services optionnels' : 'Optional Services'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optionalServices.map((service, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium">
                        {service.name[locale as 'fr' | 'en'] || service.name.fr}
                      </h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">
                          {service.description[locale as 'fr' | 'en'] || service.description.fr}
                        </p>
                      )}
                    </div>
                    {service.price && (
                      <div className="text-right ml-4">
                        <p className="text-lg font-semibold">{service.price}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services sur demande */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              {locale === 'fr' ? 'Services sur demande' : 'Services on Request'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onRequestServices.length > 0 && onRequestServices[0].availability && (
              <p className="text-sm text-muted-foreground mb-4">
                {onRequestServices[0].availability[locale as 'fr' | 'en'] || 
                 (locale === 'fr' 
                   ? 'Ces services doivent être réservés à l\'avance'
                   : 'These services must be booked in advance'
                 )
                }
              </p>
            )}
            <div className="space-y-4">
              {onRequestServices.map((service, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium">
                        {service.name[locale as 'fr' | 'en'] || service.name.fr}
                      </h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">
                          {service.description[locale as 'fr' | 'en'] || service.description.fr}
                        </p>
                      )}
                      {service.availability && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {service.availability[locale as 'fr' | 'en'] || service.availability.fr}
                        </p>
                      )}
                    </div>
                    {service.price && (
                      <div className="text-right ml-4">
                        <p className="text-lg font-semibold">{service.price}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Équipements de la propriété */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'fr' ? 'Équipements de la propriété' : 'Property Amenities'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3">
                  {locale === 'fr' ? 'Confort' : 'Comfort'}
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {locale === 'fr' ? 'Climatisation' : 'Air conditioning'}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {locale === 'fr' ? 'Chauffage central' : 'Central heating'}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {locale === 'fr' ? 'Ventilateurs' : 'Fans'}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">
                  {locale === 'fr' ? 'Cuisine' : 'Kitchen'}
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {locale === 'fr' ? 'Lave-vaisselle' : 'Dishwasher'}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {locale === 'fr' ? 'Four et micro-ondes' : 'Oven and microwave'}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {locale === 'fr' ? 'Machine à café Nespresso' : 'Nespresso coffee machine'}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">
                  {locale === 'fr' ? 'Divertissement' : 'Entertainment'}
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {locale === 'fr' ? 'TV satellite' : 'Satellite TV'}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {locale === 'fr' ? 'Netflix inclus' : 'Netflix included'}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    Sonos
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">
                  {locale === 'fr' 
                    ? 'Besoin d\'un service particulier ?'
                    : 'Need a specific service?'
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {locale === 'fr'
                    ? 'N\'hésitez pas à nous contacter pour toute demande spécifique. Nous ferons notre possible pour répondre à vos besoins.'
                    : 'Feel free to contact us for any specific request. We will do our best to meet your needs.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}