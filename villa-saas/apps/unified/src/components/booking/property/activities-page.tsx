'use client'

import { MapPin, Clock, Euro, Star, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface LocalActivity {
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
  phone?: string
  openingHours?: {
    fr: string
    en: string
  }
  tips?: {
    fr: string
    en: string
  }
}

interface ActivitiesPageProps {
  property: {
    id: string
    name: string
    city: string
    activitiesContent?: LocalActivity[]
  }
  locale: string
}

const categoryLabels: Record<string, { fr: string; en: string }> = {
  beach: { fr: 'Plage & Baignade', en: 'Beach & Swimming' },
  water_sports: { fr: 'Sports nautiques', en: 'Water Sports' },
  hiking: { fr: 'Randonnée', en: 'Hiking' },
  cultural: { fr: 'Culture & Patrimoine', en: 'Culture & Heritage' },
  restaurant: { fr: 'Restaurant', en: 'Restaurant' },
  wine: { fr: 'Vin & Gastronomie', en: 'Wine & Gastronomy' },
  kids: { fr: 'Activités enfants', en: 'Kids Activities' },
  adventure: { fr: 'Aventure', en: 'Adventure' },
  wellness: { fr: 'Bien-être & Spa', en: 'Wellness & Spa' },
  shopping: { fr: 'Shopping', en: 'Shopping' },
  nightlife: { fr: 'Vie nocturne', en: 'Nightlife' },
  other: { fr: 'Autre', en: 'Other' },
}

const categoryColors: Record<string, string> = {
  beach: 'bg-blue-100 text-blue-800',
  water_sports: 'bg-cyan-100 text-cyan-800',
  hiking: 'bg-green-100 text-green-800',
  cultural: 'bg-purple-100 text-purple-800',
  restaurant: 'bg-red-100 text-red-800',
  wine: 'bg-rose-100 text-rose-800',
  kids: 'bg-pink-100 text-pink-800',
  adventure: 'bg-orange-100 text-orange-800',
  wellness: 'bg-indigo-100 text-indigo-800',
  shopping: 'bg-yellow-100 text-yellow-800',
  nightlife: 'bg-violet-100 text-violet-800',
  other: 'bg-gray-100 text-gray-800',
}

const defaultActivities: LocalActivity[] = [
  {
    id: '1',
    name: 'Plage de Sable Fin',
    category: 'Plages',
    description: 'Magnifique plage de sable fin avec eaux cristallines, idéale pour la baignade et les sports nautiques.',
    distance: '500m',
    duration: 'Toute la journée',
    rating: 4.8,
    highlights: ['Baignade surveillée', 'Location de transats', 'Sports nautiques', 'Restaurants'],
  },
  {
    id: '2',
    name: 'Marché Local',
    category: 'Culture',
    description: 'Marché traditionnel avec produits locaux, artisanat et spécialités régionales.',
    distance: '1.2km',
    duration: '2-3 heures',
    price: 'Gratuit',
    rating: 4.5,
    highlights: ['Produits frais', 'Artisanat local', 'Dégustation', 'Ambiance authentique'],
  },
  {
    id: '3',
    name: 'Randonnée Côtière',
    category: 'Nature',
    description: 'Sentier de randonnée offrant des vues spectaculaires sur la côte et la nature environnante.',
    distance: '2.5km',
    duration: '3-4 heures',
    price: 'Gratuit',
    rating: 4.7,
    highlights: ['Vues panoramiques', 'Faune locale', 'Niveau facile', 'Aire de pique-nique'],
  },
  {
    id: '4',
    name: 'Centre de Plongée',
    category: 'Sports',
    description: 'Centre certifié proposant baptêmes de plongée et explorations sous-marines.',
    distance: '3km',
    duration: 'Demi-journée',
    price: 'À partir de 60€',
    rating: 4.9,
    contact: '+33 4 94 XX XX XX',
    highlights: ['Instructeurs certifiés', 'Équipement fourni', 'Sites exceptionnels', 'Photos incluses'],
  },
  {
    id: '5',
    name: 'Restaurant Gastronomique',
    category: 'Gastronomie',
    description: 'Restaurant étoilé proposant une cuisine raffinée avec vue sur mer.',
    distance: '1.8km',
    duration: '2-3 heures',
    price: 'Menu à partir de 45€',
    rating: 4.6,
    contact: '+33 4 94 XX XX XX',
    highlights: ['Vue mer', 'Cuisine locale', 'Cave exceptionnelle', 'Terrasse panoramique'],
  },
  {
    id: '6',
    name: 'Parc Aquatique',
    category: 'Famille',
    description: 'Grand parc aquatique avec toboggans, piscines et animations pour toute la famille.',
    distance: '8km',
    duration: 'Journée complète',
    price: 'Adulte 25€ / Enfant 18€',
    rating: 4.4,
    highlights: ['Toboggans géants', 'Espace enfants', 'Restaurants', 'Parking gratuit'],
  },
]

export function ActivitiesPage({ property, locale }: ActivitiesPageProps) {
  const activities = property.activitiesContent || []

  const categories = Array.from(new Set(activities.map(a => a.category)))

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {locale === 'fr' ? 'Activités à proximité' : 'Nearby Activities'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' 
              ? `Découvrez les meilleures activités et attractions autour de ${property.name}`
              : `Discover the best activities and attractions around ${property.name}`
            }
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className={categoryColors[category] || 'bg-gray-100 text-gray-800'}
            >
              {categoryLabels[category]?.[locale as 'fr' | 'en'] || categoryLabels[category]?.fr || category}
            </Badge>
          ))}
        </div>

        {/* Activities Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {activities.map((activity, index) => (
            <Card key={index} className="overflow-hidden">
              {/* Activity images would go here if available */}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {activity.name[locale as 'fr' | 'en'] || activity.name.fr}
                    </CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={`mt-2 ${categoryColors[activity.category] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {categoryLabels[activity.category]?.[locale as 'fr' | 'en'] || categoryLabels[activity.category]?.fr || activity.category}
                    </Badge>
                  </div>
                  {/* Rating would go here if available */}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {activity.description[locale as 'fr' | 'en'] || activity.description.fr}
                </p>
                
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {activity.distance >= 1 
                        ? `${activity.distance} km` 
                        : `${(activity.distance * 1000).toFixed(0)} m`
                      }
                    </span>
                  </div>
                  {activity.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{activity.duration}</span>
                    </div>
                  )}
                  {activity.price && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span>{activity.price}</span>
                    </div>
                  )}
                  {activity.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{activity.phone}</span>
                    </div>
                  )}
                </div>

                {/* Opening Hours */}
                {activity.openingHours && (
                  <div className="text-sm text-muted-foreground border-t pt-3">
                    <p className="font-medium mb-1">
                      {locale === 'fr' ? 'Horaires' : 'Opening Hours'}
                    </p>
                    <p>
                      {activity.openingHours[locale as 'fr' | 'en'] || activity.openingHours.fr}
                    </p>
                  </div>
                )}

                {/* Tips */}
                {activity.tips && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">
                      {locale === 'fr' ? 'Conseil' : 'Tip'}
                    </p>
                    <p>
                      {activity.tips[locale as 'fr' | 'en'] || activity.tips.fr}
                    </p>
                  </div>
                )}

                {/* Website */}
                {activity.website && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <a href={activity.website} target="_blank" rel="noopener noreferrer">
                      {locale === 'fr' ? 'Visiter le site' : 'Visit website'}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips Section */}
        {activities.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>
                {locale === 'fr' 
                  ? 'Aucune activité n\'a encore été ajoutée pour cette propriété.'
                  : 'No activities have been added for this property yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}