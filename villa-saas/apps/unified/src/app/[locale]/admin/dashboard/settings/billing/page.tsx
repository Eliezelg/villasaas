'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Check, Zap, Building2, TrendingUp, HeadphonesIcon, Infinity, ExternalLink } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

interface Subscription {
  plan: string
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
}

interface PropertyQuota {
  used: number
  included: number | 'unlimited'
  additional: number
  canAdd: boolean
  requiresPayment: boolean
  plan: string
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 40,
    currency: '€',
    interval: 'mois',
    features: [
      '1 propriété incluse',
      'Synchronisation iCal',
      'Analytics de base',
      'Support par email',
    ],
    propertyLimit: 1,
    recommended: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 80,
    currency: '€',
    interval: 'mois',
    features: [
      '3 propriétés incluses',
      'Propriétés supplémentaires à 15€/mois',
      'Synchronisation iCal',
      'Analytics avancés',
      'Support prioritaire',
    ],
    propertyLimit: 3,
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    currency: '€',
    interval: null,
    features: [
      'Propriétés illimitées',
      'Synchronisation iCal',
      'Analytics avancés',
      'Support 24/7',
      'API dédiée',
      'Fonctionnalités personnalisées',
    ],
    propertyLimit: 'unlimited',
    recommended: false,
  },
]

function BillingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [quota, setQuota] = useState<PropertyQuota | null>(null)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)

  useEffect(() => {
    // Vérifier si on revient de Stripe après un changement de plan
    if (searchParams.get('plan_changed') === 'true') {
      toast.success('Votre plan a été modifié avec succès !')
      // Nettoyer l'URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
    
    fetchSubscriptionData()
  }, [searchParams])

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      
      // Récupérer les infos de quota
      const { data: quotaData } = await apiClient.get<PropertyQuota>('/api/properties/quota')
      if (quotaData) {
        setQuota(quotaData)
      }
      
      // Récupérer les infos d'abonnement depuis Stripe
      const { data: subData } = await apiClient.get<{
        hasSubscription: boolean
        plan: string | null
        status: string | null
        currentPeriodEnd?: string
        cancelAtPeriodEnd?: boolean
      }>('/api/subscriptions/current')
      
      if (subData) {
        setSubscription({
          plan: subData.plan || quotaData?.plan || 'none',
          status: subData.status || 'inactive',
          currentPeriodEnd: subData.currentPeriodEnd,
          cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
        })
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      toast.error('Erreur lors du chargement des données d\'abonnement')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (planId: string) => {
    if (planId === 'enterprise') {
      window.open('mailto:contact@villa-saas.com?subject=Demande plan Enterprise', '_blank')
      return
    }

    setChangingPlan(planId)
    try {
      const currentUrl = window.location.href.split('?')[0] // Enlever les query params existants
      
      const { data, error } = await apiClient.post<{ url?: string; success?: boolean; message?: string }>('/api/subscriptions/change-plan', {
        newPlan: planId,
        successUrl: `${currentUrl}?plan_changed=true`,
        cancelUrl: currentUrl,
      })

      if (error) {
        throw new Error(error.message || 'Erreur lors du changement de plan')
      }

      if (data?.url) {
        // Redirection vers Stripe si nécessaire (pas de méthode de paiement)
        toast.info('Redirection vers Stripe...')
        window.location.href = data.url
      } else if (data?.success) {
        // Changement immédiat réussi
        toast.success(data.message || 'Plan modifié avec succès')
        fetchSubscriptionData()
      }
    } catch (error) {
      console.error('Erreur changement de plan:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement de plan')
    } finally {
      setChangingPlan(null)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Building2 className="h-5 w-5" />
      case 'standard':
        return <TrendingUp className="h-5 w-5" />
      case 'enterprise':
        return <HeadphonesIcon className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Abonnement et facturation</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre abonnement et vos informations de facturation
        </p>
      </div>

      {/* Usage actuel */}
      {quota && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Utilisation actuelle
            </CardTitle>
            <CardDescription>
              Plan {plans.find(p => p.id === quota.plan)?.name || 'Aucun'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quota.included === 'unlimited' ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                  <Infinity className="h-8 w-8" />
                  <span>{quota.used}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Propriétés (illimité)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Propriétés utilisées</span>
                  <span className="font-medium">
                    {quota.used} / {quota.included}
                  </span>
                </div>
                <Progress 
                  value={(quota.used / (quota.included as number)) * 100} 
                  className={quota.used >= (quota.included as number) ? 'bg-orange-100' : ''}
                />
                {quota.additional > 0 && (
                  <Alert>
                    <AlertDescription>
                      Vous avez {quota.additional} propriété{quota.additional > 1 ? 's' : ''} supplémentaire{quota.additional > 1 ? 's' : ''} 
                      (+{quota.additional * 15}€/mois)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plans disponibles */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id
          const isUpgrade = plans.findIndex(p => p.id === plan.id) > plans.findIndex(p => p.id === subscription?.plan)
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.recommended && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Recommandé
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge variant="secondary" className="absolute -top-3 right-4">
                  Plan actuel
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPlanIcon(plan.id)}
                  {plan.name}
                </CardTitle>
                <CardDescription>
                  {plan.price !== null ? (
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-xl">{plan.currency}</span>
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-2xl font-semibold">
                      Sur devis
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  variant={isCurrentPlan ? 'outline' : isUpgrade ? 'default' : 'secondary'}
                  className="w-full"
                  disabled={isCurrentPlan || changingPlan !== null}
                  onClick={() => handleChangePlan(plan.id)}
                >
                  {changingPlan === plan.id ? (
                    'Changement en cours...'
                  ) : isCurrentPlan ? (
                    'Plan actuel'
                  ) : plan.id === 'enterprise' ? (
                    'Nous contacter'
                  ) : isUpgrade ? (
                    'Passer à ce plan'
                  ) : (
                    'Rétrograder'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Informations d'abonnement actuel */}
      {subscription && subscription.plan !== 'none' && (
        <Card>
          <CardHeader>
            <CardTitle>Abonnement actuel</CardTitle>
            <CardDescription>
              Détails de votre abonnement en cours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">
                  {plans.find(p => p.id === subscription.plan)?.name || subscription.plan}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              {subscription.currentPeriodEnd && (
                <div>
                  <p className="text-sm text-muted-foreground">Prochain renouvellement</p>
                  <p className="font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {subscription.cancelAtPeriodEnd && (
                <div>
                  <Badge variant="destructive">
                    Annulation prévue
                  </Badge>
                </div>
              )}
            </div>

            {subscription.cancelAtPeriodEnd ? (
              <Alert>
                <AlertDescription>
                  Votre abonnement sera annulé le {subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}.
                  Vous pouvez réactiver votre abonnement à tout moment avant cette date.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <a href="https://billing.stripe.com/p/login/test_14k3cd123example" target="_blank" rel="noopener noreferrer">
                  Gérer le moyen de paiement
                </a>
              </Button>
              {!subscription.cancelAtPeriodEnd && (
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    if (confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
                      try {
                        const { error } = await apiClient.post('/api/subscriptions/cancel')
                        if (!error) {
                          toast.success('Abonnement annulé. Il restera actif jusqu\'à la fin de la période.')
                          fetchSubscriptionData()
                        } else {
                          toast.error('Erreur lors de l\'annulation')
                        }
                      } catch (error) {
                        toast.error('Erreur lors de l\'annulation')
                      }
                    }
                  }}
                >
                  Annuler l'abonnement
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations de facturation */}
      <Card>
        <CardHeader>
          <CardTitle>Historique de facturation</CardTitle>
          <CardDescription>
            Consultez vos factures précédentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Pour consulter vos factures et gérer vos informations de paiement, accédez à votre portail client Stripe.
            </AlertDescription>
          </Alert>
          
          <Button variant="outline" asChild>
            <a href="https://billing.stripe.com/p/login/test_14k3cd123example" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Accéder au portail de facturation
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  )
}