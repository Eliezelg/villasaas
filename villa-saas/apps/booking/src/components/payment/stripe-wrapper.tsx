'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { apiClient } from '@/lib/api-client'

interface StripeWrapperProps {
  clientSecret: string
  children: React.ReactNode
}

export function StripeWrapper({ clientSecret, children }: StripeWrapperProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStripeConfig() {
      try {
        // Récupérer la configuration Stripe depuis l'API
        const response = await apiClient.request('/api/public/payments/config')
        
        if (response.data?.publishableKey) {
          const stripe = loadStripe(response.data.publishableKey)
          setStripePromise(stripe)
        }
      } catch (error) {
        console.error('Failed to load Stripe config:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStripeConfig()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Chargement du module de paiement...</p>
        </div>
      </div>
    )
  }

  if (!stripePromise) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
        Erreur de chargement du module de paiement. Veuillez réessayer.
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0f172a',
            colorBackground: '#ffffff',
            colorText: '#1e293b',
            colorDanger: '#dc2626',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
        locale: 'fr',
      }}
    >
      {children}
    </Elements>
  )
}