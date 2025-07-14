'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Calendar, Euro, Users } from 'lucide-react'
import { StripeSetupBanner } from '@/components/admin/dashboard/stripe-setup-banner'
import { apiClient } from '@/lib/api-client'
import { usePropertiesStore } from '@/store/properties.store'

export default function DashboardPage() {
  const router = useRouter()
  const locale = useLocale()
  const { properties, setProperties } = usePropertiesStore()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Charger les propriétés
        const { data } = await apiClient.get<any[]>('/api/properties')
        if (data) {
          setProperties(data)
          
          // Si une propriété existe et est en DRAFT, rediriger vers l'onboarding
          const draftProperty = data.find(p => p.status === 'DRAFT')
          if (draftProperty && data.length === 1) {
            // C'est probablement la première propriété créée au signup
            router.push(`/${locale}/admin/dashboard/onboarding`)
            return
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkOnboarding()
  }, [router, locale, setProperties])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  const stats = [
    {
      title: 'Propriétés',
      value: '0',
      description: 'Propriétés actives',
      icon: Building2,
    },
    {
      title: 'Réservations',
      value: '0',
      description: 'Ce mois',
      icon: Calendar,
    },
    {
      title: 'Revenus',
      value: '0 €',
      description: 'Ce mois',
      icon: Euro,
    },
    {
      title: 'Taux d\'occupation',
      value: '0%',
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
        {stats.map((stat) => (
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

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Réservations récentes</CardTitle>
            <CardDescription>
              Vos dernières réservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aucune réservation pour le moment
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Dernières actions sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aucune activité récente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}