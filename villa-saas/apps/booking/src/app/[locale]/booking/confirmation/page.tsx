'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTenant } from '@/lib/tenant-context'
import { Check, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PaymentStatus = 'processing' | 'succeeded' | 'failed' | 'unknown'

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { tenant } = useTenant()
  const [status, setStatus] = useState<PaymentStatus>('processing')

  useEffect(() => {
    // Récupérer les paramètres de retour Stripe
    const paymentIntent = searchParams.get('payment_intent')
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')
    const redirectStatus = searchParams.get('redirect_status')

    if (redirectStatus) {
      switch (redirectStatus) {
        case 'succeeded':
          setStatus('succeeded')
          break
        case 'processing':
          setStatus('processing')
          break
        case 'requires_payment_method':
        case 'failed':
          setStatus('failed')
          break
        default:
          setStatus('unknown')
      }
    }
  }, [searchParams])

  const statusConfig = {
    processing: {
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100',
      title: 'Paiement en cours de traitement',
      message: 'Votre paiement est en cours de vérification. Vous recevrez un email de confirmation dès que le paiement sera validé.',
    },
    succeeded: {
      icon: Check,
      color: 'text-green-600 bg-green-100',
      title: 'Réservation confirmée !',
      message: 'Votre paiement a été accepté et votre réservation est confirmée. Un email de confirmation vous a été envoyé.',
    },
    failed: {
      icon: X,
      color: 'text-red-600 bg-red-100',
      title: 'Échec du paiement',
      message: 'Le paiement n\'a pas pu être traité. Veuillez réessayer ou utiliser un autre moyen de paiement.',
    },
    unknown: {
      icon: Clock,
      color: 'text-gray-600 bg-gray-100',
      title: 'Statut inconnu',
      message: 'Nous ne pouvons pas déterminer le statut de votre paiement. Veuillez vérifier vos emails ou nous contacter.',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">{tenant?.name || 'Villa Booking'}</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container py-16">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">{config.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-8 text-muted-foreground">{config.message}</p>

              {status === 'succeeded' && (
                <div className="mb-8 rounded-lg bg-muted p-4">
                  <h3 className="mb-2 font-medium">Prochaines étapes :</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Vérifiez votre boîte email pour la confirmation</li>
                    <li>• Vous recevrez les détails d'accès 48h avant votre arrivée</li>
                    <li>• N'hésitez pas à nous contacter si vous avez des questions</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/">
                  <Button variant={status === 'failed' ? 'outline' : 'default'}>
                    Retour à l'accueil
                  </Button>
                </Link>
                {status === 'failed' && (
                  <Button onClick={() => router.back()}>
                    Réessayer le paiement
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informations de référence */}
          {searchParams.get('payment_intent') && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Référence de paiement : {searchParams.get('payment_intent')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t py-8">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {tenant?.name || 'Villa Booking'}. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}