'use client'

import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Lock } from 'lucide-react'

interface StripePaymentFormProps {
  amount: number
  currency: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function StripePaymentForm({ amount, currency, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    // Confirmer le paiement
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirmation`,
        // On peut aussi gérer la confirmation sans redirection
        // redirect: 'if_required',
      },
    })

    if (confirmError) {
      setError(confirmError.message || 'Une erreur est survenue')
      onError?.(confirmError.message || 'Une erreur est survenue')
      setProcessing(false)
    } else {
      // Si on arrive ici, le paiement est en cours de traitement
      // et l'utilisateur sera redirigé
      onSuccess?.()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="mr-2 h-5 w-5" />
          Paiement sécurisé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement 
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  // Pré-remplir avec les infos du client si disponibles
                }
              }
            }}
          />

          {error && (
            <div className="flex items-center rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              {error}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total à payer</span>
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: currency,
                }).format(amount)}
              </span>
            </div>

            <Button
              type="submit"
              disabled={!stripe || processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Traitement en cours...
                </>
              ) : (
                `Payer ${new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: currency,
                }).format(amount)}`
              )}
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Paiement sécurisé par Stripe</p>
            <p className="mt-1">
              Vos informations de paiement sont cryptées et ne sont jamais stockées sur nos serveurs
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}