'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Bed, Activity, Wrench, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomPagesNavProps {
  propertyId: string
  customPages?: {
    location?: boolean
    rooms?: boolean
    activities?: boolean
    services?: boolean
    reviews?: boolean
  }
  locale: string
}

const navItems = [
  {
    id: 'location',
    label: 'Localisation',
    icon: MapPin,
  },
  {
    id: 'rooms',
    label: 'Chambres',
    icon: Bed,
  },
  {
    id: 'activities',
    label: 'Activités',
    icon: Activity,
  },
  {
    id: 'services',
    label: 'Services',
    icon: Wrench,
  },
  {
    id: 'reviews',
    label: 'Avis',
    icon: Star,
  },
]

export function CustomPagesNav({ propertyId, customPages = {}, locale }: CustomPagesNavProps) {
  const pathname = usePathname()
  
  // S'assurer que customPages est un objet valide
  const pages = typeof customPages === 'object' && customPages !== null ? customPages : {}
  
  // Filtrer seulement les pages activées
  const enabledItems = navItems.filter(item => pages[item.id as keyof typeof pages] === true)
  
  if (enabledItems.length === 0) return null

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto">
          <Link
            href={`/${locale}/properties/${propertyId}`}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors",
              !pathname.includes('/location') && 
              !pathname.includes('/rooms') && 
              !pathname.includes('/activities') && 
              !pathname.includes('/services') && 
              !pathname.includes('/reviews')
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Vue d'ensemble
          </Link>
          
          {enabledItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.includes(`/${item.id}`)
            
            return (
              <Link
                key={item.id}
                href={`/${locale}/properties/${propertyId}/${item.id}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}