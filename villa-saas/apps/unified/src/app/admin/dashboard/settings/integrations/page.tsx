'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import Image from 'next/image'

const integrations = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    description: 'Synchronisez vos calendriers et tarifs',
    logo: '/logos/airbnb.png',
    connected: true,
    lastSync: '2024-01-15 14:30'
  },
  {
    id: 'booking',
    name: 'Booking.com',
    description: 'Gérez vos réservations Booking',
    logo: '/logos/booking.png',
    connected: false
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Traitez les paiements en ligne',
    logo: '/logos/stripe.png',
    connected: true
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Synchronisez avec Google Calendar',
    logo: '/logos/google.png',
    connected: false
  }
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Intégrations</h1>
        <p className="text-muted-foreground">
          Connectez vos outils externes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{integration.name}</CardTitle>
                <Badge variant={integration.connected ? 'success' : 'secondary'}>
                  {integration.connected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connecté
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Non connecté
                    </>
                  )}
                </Badge>
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {integration.connected && integration.lastSync && (
                <p className="text-sm text-muted-foreground mb-4">
                  Dernière sync: {integration.lastSync}
                </p>
              )}
              <Button 
                variant={integration.connected ? 'outline' : 'default'}
                className="w-full"
              >
                {integration.connected ? 'Gérer' : 'Connecter'}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}