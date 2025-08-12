'use client'

import { Activity, MapPin, Clock, Euro } from 'lucide-react'
import { BookingHeader } from '@/components/booking/layout/booking-header'
import { BookingFooter } from '@/components/booking/layout/booking-footer'
import { PageHeader } from '@/components/booking/page-header'
import { CustomPagesNav } from '@/components/booking/property/custom-pages-nav'
import { useTenant } from '@/lib/tenant-context'

interface ActivityItem {
  name: {
    fr: string
    en: string
  }
  description: {
    fr: string
    en: string
  }
  category: string
  distance: number
  price?: string
  duration?: string
  website?: string
}

interface ActivitiesPageProps {
  property: {
    id: string
    name: string
    city: string
    country: string
    images?: Array<{
      url: string
      urls?: any
    }>
    activitiesContent?: ActivityItem[]
    customPages?: any
  }
  locale: string
}

const categoryIcons: Record<string, string> = {
  sports: '⚽',
  culture: '🏛️',
  nature: '🌳',
  beach: '🏖️',
  water: '🏄',
  adventure: '🎯',
  family: '👨‍👩‍👧‍👦',
  nightlife: '🌃',
  shopping: '🛍️',
  wellness: '🧘',
  gastronomy: '🍷',
  other: '🎪'
}

const categoryLabels: Record<string, { fr: string; en: string }> = {
  sports: { fr: 'Sports', en: 'Sports' },
  culture: { fr: 'Culture', en: 'Culture' },
  nature: { fr: 'Nature', en: 'Nature' },
  beach: { fr: 'Plage', en: 'Beach' },
  water: { fr: 'Activités nautiques', en: 'Water activities' },
  adventure: { fr: 'Aventure', en: 'Adventure' },
  family: { fr: 'Famille', en: 'Family' },
  nightlife: { fr: 'Vie nocturne', en: 'Nightlife' },
  shopping: { fr: 'Shopping', en: 'Shopping' },
  wellness: { fr: 'Bien-être', en: 'Wellness' },
  gastronomy: { fr: 'Gastronomie', en: 'Gastronomy' },
  other: { fr: 'Autre', en: 'Other' }
}

export function ActivitiesPageModern({ property, locale }: ActivitiesPageProps) {
  const activities = property.activitiesContent || []
  const { tenant } = useTenant()

  // Group activities by category
  const groupedActivities = activities.reduce((acc, activity) => {
    const category = activity.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(activity)
    return acc
  }, {} as Record<string, ActivityItem[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader siteName={property.name} />
      
      {/* Hero avec image de fond */}
      <PageHeader 
        title="Activités"
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
            {/* Activities by Category */}
            {Object.entries(groupedActivities).length > 0 ? (
              Object.entries(groupedActivities).map(([category, categoryActivities]) => (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{categoryIcons[category]}</span>
                    <h2 className="text-2xl font-bold">
                      {categoryLabels[category]?.[locale as 'fr' | 'en'] || categoryLabels[category]?.fr || category}
                    </h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryActivities.map((activity, index) => {
                      const displayDistance = activity.distance >= 1000 
                        ? `${(activity.distance / 1000).toFixed(1)} km`
                        : `${activity.distance} m`

                      return (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                          <h3 className="font-semibold text-lg mb-3">
                            {activity.name[locale as 'fr' | 'en'] || activity.name.fr}
                          </h3>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{displayDistance}</span>
                            </div>
                            
                            {activity.duration && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>{activity.duration}</span>
                              </div>
                            )}
                            
                            {activity.price && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Euro className="h-4 w-4" />
                                <span>{activity.price}</span>
                              </div>
                            )}
                          </div>
                          
                          {activity.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {activity.description[locale as 'fr' | 'en'] || activity.description.fr}
                            </p>
                          )}
                          
                          {activity.website && (
                            <a 
                              href={activity.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {locale === 'fr' ? 'Plus d\'informations →' : 'More information →'}
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))
            ) : (
              <section className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {locale === 'fr' 
                    ? 'Aucune activité n\'a encore été ajoutée pour cette propriété.'
                    : 'No activities have been added for this property yet.'}
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