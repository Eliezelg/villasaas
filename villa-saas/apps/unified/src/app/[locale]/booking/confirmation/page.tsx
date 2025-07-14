'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTenant } from '@/lib/tenant-context'
import { Check, Clock, X, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

type PaymentStatus = 'processing' | 'succeeded' | 'failed' | 'unknown'

interface BookingData {
  id: string
  reference: string
  status: string
  paymentStatus: string
  checkIn: string
  checkOut: string
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  total: number
  currency: string
  property: {
    name: string
    city: string
    country: string
  }
}

function BookingConfirmationPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { tenant } = useTenant()
  const [status, setStatus] = useState<PaymentStatus>('processing')
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(false)

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

    // Récupérer les informations de la réservation si le paiement a réussi
    if (paymentIntent && (redirectStatus === 'succeeded' || redirectStatus === 'processing')) {
      fetchBookingByPaymentIntent(paymentIntent)
    }
  }, [searchParams])

  const fetchBookingByPaymentIntent = async (paymentIntentId: string) => {
    setLoadingBooking(true)
    try {
      const { data, error } = await apiClient.get<BookingData>(
        `/api/public/bookings/by-payment-intent/${paymentIntentId}`
      )
      
      if (data) {
        setBooking(data)
      } else if (error) {
        console.error('Failed to fetch booking:', error)
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setLoadingBooking(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Code de réservation copié !')
  }

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

              {status === 'succeeded' && booking && (
                <>
                  {/* Code de réservation */}
                  <div className="mb-6 rounded-lg bg-primary/10 p-6">
                    <h3 className="mb-2 text-lg font-semibold">Votre code de réservation :</h3>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-bold tracking-wider">{booking.reference}</span>
                      <Button
                        onClick={() => copyToClipboard(booking.reference)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Conservez ce code pour accéder à votre réservation
                    </p>
                  </div>

                  {/* Détails de la réservation */}
                  <div className="mb-6 rounded-lg border p-4">
                    <h4 className="mb-3 font-medium">Détails de votre réservation :</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Propriété :</span>
                        <span className="font-medium">{booking.property.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lieu :</span>
                        <span>{booking.property.city}, {booking.property.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Arrivée :</span>
                        <span>{new Date(booking.checkIn).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Départ :</span>
                        <span>{new Date(booking.checkOut).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total payé :</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: booking.currency,
                          }).format(booking.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 rounded-lg bg-muted p-4">
                    <h3 className="mb-2 font-medium">Prochaines étapes :</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Vérifiez votre boîte email ({booking.guestEmail}) pour la confirmation</li>
                      <li>• Vous recevrez les détails d'accès 48h avant votre arrivée</li>
                      <li>• Utilisez votre code de réservation pour accéder à votre réservation</li>
                      <li>• N'hésitez pas à nous contacter si vous avez des questions</li>
                    </ul>
                  </div>
                </>
              )}

              {status === 'succeeded' && !booking && !loadingBooking && (
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
                {status === 'succeeded' && booking && (
                  <Link href={`/my-booking/${booking.reference}`}>
                    <Button variant="outline">
                      Accéder à ma réservation
                    </Button>
                  </Link>
                )}
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

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BookingConfirmationPageContent />
    </Suspense>
  )
}