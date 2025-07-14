'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { settingsService } from '@/services/admin/settings.service'
import { Building2, MapPin, Phone, Mail, Globe, Save } from 'lucide-react'

interface CompanySettings {
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  website: string
  logo?: string
}

export default function CompanySettingsPage() {
  const { tenant } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<CompanySettings>({
    name: tenant?.companyName || tenant?.name || '',
    description: tenant?.settings?.description || '',
    address: tenant?.settings?.address || '',
    city: tenant?.settings?.city || '',
    postalCode: tenant?.settings?.postalCode || '',
    country: tenant?.settings?.country || 'France',
    phone: tenant?.phone || '',
    email: tenant?.email || '',
    website: tenant?.settings?.website || '',
  })

  useEffect(() => {
    // Si les données du tenant sont chargées après le rendu initial
    if (tenant) {
      setSettings({
        name: tenant.companyName || tenant.name || '',
        description: tenant.settings?.description || '',
        address: tenant.settings?.address || '',
        city: tenant.settings?.city || '',
        postalCode: tenant.settings?.postalCode || '',
        country: tenant.settings?.country || 'France',
        phone: tenant.phone || '',
        email: tenant.email || '',
        website: tenant.settings?.website || '',
      })
    }
  }, [tenant])

  const loadSettings = async () => {
    // Cette fonction pourrait être utilisée pour charger des données depuis l'API si nécessaire
    // Pour l'instant, on utilise les données du tenant depuis le store
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Mise à jour des données du tenant avec les nouvelles valeurs
      const updatedSettings = {
        ...tenant?.settings,
        description: settings.description,
        address: settings.address,
        city: settings.city,
        postalCode: settings.postalCode,
        country: settings.country,
        website: settings.website,
      }
      
      await settingsService.updateCompanySettings({
        ...settings,
        companyName: settings.name,
        settings: updatedSettings
      })
      toast.success('Paramètres enregistrés avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error)
      toast.error('Impossible d\'enregistrer les paramètres')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
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
        <h1 className="text-3xl font-bold">Profil entreprise</h1>
        <p className="text-muted-foreground">
          Gérez les informations de votre entreprise
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Ces informations seront affichées sur vos sites de réservation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'entreprise</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Villa Rentals SARL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Décrivez votre entreprise..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email de contact</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contact@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+33 1 23 45 67 89"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="website"
                  type="url"
                  value={settings.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://www.example.com"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Adresse
            </CardTitle>
            <CardDescription>
              Adresse officielle de votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Rue de la Paix"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={settings.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  placeholder="75000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={settings.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Paris"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={settings.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="France"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  )
}