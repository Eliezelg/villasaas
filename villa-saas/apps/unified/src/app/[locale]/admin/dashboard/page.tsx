'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Calendar, Euro, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { StripeSetupBanner } from '@/components/admin/dashboard/stripe-setup-banner'
import { OccupancyCalendar } from '@/components/admin/dashboard/occupancy-calendar'
import { apiClient } from '@/lib/api-client'
import { usePropertiesStore } from '@/store/properties.store'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const locale = useLocale()
  const { properties, setProperties } = usePropertiesStore()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    bookings: 0,
    revenue: 0,
    occupancyRate: 0
  })
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Charger les propriétés
        const propertiesResponse = await apiClient.get<any[]>('/api/properties')
        if (propertiesResponse.data) {
          setProperties(propertiesResponse.data)
          
          // Si une propriété existe et est en DRAFT, rediriger vers l'onboarding
          const draftProperty = propertiesResponse.data.find(p => p.status === 'DRAFT')
          if (draftProperty && propertiesResponse.data.length === 1) {
            // C'est probablement la première propriété créée au signup
            router.push(`/${locale}/admin/dashboard/onboarding`)
            return
          }
        }
        
        // Charger les statistiques du dashboard
        const statsResponse = await apiClient.get<any>('/api/analytics/dashboard')
        if (statsResponse.data) {
          setStats({
            bookings: statsResponse.data.bookings?.thisMonth || 0,
            revenue: statsResponse.data.revenue?.thisMonth || 0,
            occupancyRate: statsResponse.data.occupancyRate || 0
          })
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardData()
  }, [router, locale, setProperties])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  const statsCards = [
    {
      title: 'Propriétés',
      value: properties.filter(p => p.status === 'PUBLISHED').length.toString(),
      description: 'Propriétés actives',
      icon: Building2,
    },
    {
      title: 'Réservations',
      value: stats.bookings.toString(),
      description: 'Ce mois',
      icon: Calendar,
    },
    {
      title: 'Revenus',
      value: new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(stats.revenue),
      description: 'Ce mois',
      icon: Euro,
    },
    {
      title: 'Taux d\'occupation',
      value: `${Math.round(stats.occupancyRate)}%`,
      description: 'Moyenne ce mois',
      icon: Users,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre tableau de bord Villa SaaS
        </p>
      </div>

      <StripeSetupBanner />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendrier d'occupation */}
      <div className="mt-8">
        <OccupancyCalendar />
      </div>

      {/* Actions rapides */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ajouter une propriété</CardTitle>
              <CardDescription>Créez une nouvelle propriété</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/admin/dashboard/properties/new`}>
                <Button className="w-full">
                  <Building2 className="mr-2 h-4 w-4" />
                  Nouvelle propriété
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Voir les réservations</CardTitle>
              <CardDescription>Gérez vos réservations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/admin/dashboard/bookings`}>
                <Button variant="outline" className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Réservations
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analytics</CardTitle>
              <CardDescription>Consultez vos statistiques</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/admin/dashboard/analytics`}>
                <Button variant="outline" className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Voir les analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}