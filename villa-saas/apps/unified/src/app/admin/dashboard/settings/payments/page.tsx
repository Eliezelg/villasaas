'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { settingsService } from '@/services/admin/settings.service'
import { CreditCard, Percent, Euro, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PaymentSettings {
  stripeConnected: boolean
  stripeAccountId?: string
  commissionRate: number
  minimumPayout: number
  payoutDelay: number
  automaticPayouts: boolean
  bankAccount?: {
    iban: string
    bic: string
    accountHolder: string
  }
}

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PaymentSettings>({
    stripeConnected: false,
    commissionRate: 15,
    minimumPayout: 100,
    payoutDelay: 7,
    automaticPayouts: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await settingsService.getPaymentSettings()
      if (response.data) {
        setSettings(response.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await settingsService.updatePaymentSettings(settings)
      toast.success('Paramètres de paiement enregistrés')
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error)
      toast.error('Impossible d\'enregistrer les paramètres')
    } finally {
      setSaving(false)
    }
  }

  const connectStripe = async () => {
    try {
      const response = await settingsService.createStripeConnectLink()
      if (response.data?.url) {
        window.location.href = response.data.url
      }
    } catch (error) {
      console.error('Erreur Stripe Connect:', error)
      toast.error('Impossible de se connecter à Stripe')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres de paiement</h1>
        <p className="text-muted-foreground">
          Configurez vos méthodes de paiement et commissions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Stripe Connect
            </CardTitle>
            <CardDescription>
              Connectez votre compte Stripe pour recevoir les paiements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settings.stripeConnected ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Compte Stripe connecté</span>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Tableau de bord Stripe
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <p>Connectez votre compte Stripe pour commencer à recevoir des paiements</p>
                  <Button onClick={connectStripe} type="button">
                    Connecter Stripe
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Commission
            </CardTitle>
            <CardDescription>
              Pourcentage prélevé sur chaque réservation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Taux de commission</Label>
                <span className="text-2xl font-bold">{settings.commissionRate}%</span>
              </div>
              <Slider
                value={[settings.commissionRate]}
                onValueChange={(value) => setSettings(prev => ({ ...prev, commissionRate: value[0] }))}
                min={5}
                max={30}
                step={0.5}
              />
              <p className="text-sm text-muted-foreground">
                Sur une réservation de 1000€, vous recevrez {1000 - (1000 * settings.commissionRate / 100)}€
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Versements
            </CardTitle>
            <CardDescription>
              Configuration des versements automatiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Versements automatiques</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir automatiquement vos paiements
                </p>
              </div>
              <Switch
                checked={settings.automaticPayouts}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, automaticPayouts: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumPayout">Montant minimum de versement</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="minimumPayout"
                  type="number"
                  value={settings.minimumPayout}
                  onChange={(e) => setSettings(prev => ({ ...prev, minimumPayout: parseInt(e.target.value) }))}
                  className="pl-10"
                  min={50}
                  step={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutDelay">Délai de versement (jours après check-in)</Label>
              <Input
                id="payoutDelay"
                type="number"
                value={settings.payoutDelay}
                onChange={(e) => setSettings(prev => ({ ...prev, payoutDelay: parseInt(e.target.value) }))}
                min={1}
                max={30}
              />
              <p className="text-sm text-muted-foreground">
                Les fonds seront disponibles {settings.payoutDelay} jours après l'arrivée des clients
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  )
}