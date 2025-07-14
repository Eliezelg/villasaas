'use client'

import { useState, useEffect } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { settingsService } from '@/services/admin/settings.service'
import { useAuthStore } from '@/store/auth.store'
import { CreditCard, Euro, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PaymentSettings {
  stripeConnected: boolean
  stripeAccountId?: string
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
  const { tenant } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stripeConnectMethod, setStripeConnectMethod] = useState<'express' | 'oauth'>('express')
  const [settings, setSettings] = useState<PaymentSettings>({
    stripeConnected: !!tenant?.stripeAccountId,
    stripeAccountId: tenant?.stripeAccountId,
    minimumPayout: tenant?.settings?.minimumPayout || 100,
    payoutDelay: tenant?.settings?.payoutDelay || 7,
    automaticPayouts: tenant?.settings?.automaticPayouts ?? true,
  })

  useEffect(() => {
    // Mise à jour des paramètres si le tenant change
    if (tenant) {
      setSettings({
        stripeConnected: !!tenant.stripeAccountId && tenant.stripeChargesEnabled,
        stripeAccountId: tenant.stripeAccountId,
        minimumPayout: tenant.settings?.minimumPayout || 100,
        payoutDelay: tenant.settings?.payoutDelay || 7,
        automaticPayouts: tenant.settings?.automaticPayouts ?? true,
      })
    }
  }, [tenant])

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
    setLoading(true)
    try {
      console.log('Attempting to connect to Stripe using method:', stripeConnectMethod)
      
      const response = stripeConnectMethod === 'oauth' 
        ? await settingsService.createStripeOAuthLink()
        : await settingsService.createStripeConnectLink()
      
      console.log('Stripe Connect response:', response)
      
      if (response.error) {
        console.error('Stripe Connect error:', response.error)
        toast.error(response.error.message || 'Impossible de se connecter à Stripe')
        return
      }
      
      if (response.data?.url) {
        console.log('Redirecting to Stripe URL:', response.data.url)
        toast.success(stripeConnectMethod === 'oauth' 
          ? 'Redirection vers Stripe OAuth...' 
          : 'Redirection vers Stripe Connect...')
        const redirectUrl = response.data.url
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 1000)
      } else {
        console.error('No URL returned from Stripe Connect')
        toast.error('Aucune URL de redirection reçue')
      }
    } catch (error) {
      console.error('Stripe Connect exception:', error)
      toast.error('Erreur lors de la connexion à Stripe')
    } finally {
      setLoading(false)
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
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p>Connectez votre compte Stripe pour commencer à recevoir des paiements</p>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <Label>Comment souhaitez-vous configurer Stripe ?</Label>
                  <RadioGroup value={stripeConnectMethod} onValueChange={(value: 'express' | 'oauth') => setStripeConnectMethod(value)}>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="express" id="express-settings" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="express-settings" className="cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Créer un nouveau compte Stripe</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Recommandé</span>
                            </div>
                            <p className="text-sm text-muted-foreground font-normal">
                              Configuration rapide et simplifiée pour commencer rapidement.
                            </p>
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="oauth" id="oauth-settings" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="oauth-settings" className="cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Connecter mon compte Stripe existant</span>
                            </div>
                            <p className="text-sm text-muted-foreground font-normal">
                              Utilisez votre compte Stripe existant si vous en avez déjà un.
                            </p>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                  
                  <Button onClick={connectStripe} type="button" disabled={loading} className="w-full">
                    {loading ? 'Connexion...' : 'Connecter Stripe'}
                  </Button>
                </div>
              </div>
            )}
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