'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MapPin, Activity, Wrench, Star, Bed } from 'lucide-react'

interface CustomPagesSettingsProps {
  propertyId: string
  initialSettings?: {
    location?: boolean
    activities?: boolean
    services?: boolean
    reviews?: boolean
    rooms?: boolean
  }
  onSettingsChange: (settings: any) => void
}

const pageOptions = [
  {
    id: 'location',
    label: 'Page Localisation',
    description: 'Carte interactive et points d\'intérêt à proximité',
    icon: MapPin,
  },
  {
    id: 'rooms',
    label: 'Page Chambres',
    description: 'Détails et photos de chaque chambre',
    icon: Bed,
  },
  {
    id: 'activities',
    label: 'Page Activités',
    description: 'Activités et attractions locales',
    icon: Activity,
  },
  {
    id: 'services',
    label: 'Page Services',
    description: 'Services inclus et options supplémentaires',
    icon: Wrench,
  },
  {
    id: 'reviews',
    label: 'Page Avis',
    description: 'Avis des clients et témoignages',
    icon: Star,
  },
]

export function CustomPagesSettings({ 
  propertyId, 
  initialSettings = {}, 
  onSettingsChange 
}: CustomPagesSettingsProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleToggle = (pageId: string) => {
    const newSettings = {
      ...settings,
      [pageId]: !settings[pageId as keyof typeof settings]
    }
    setSettings(newSettings)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSettingsChange(settings)
      toast({
        title: 'Paramètres sauvegardés',
        description: 'Les pages personnalisées ont été mises à jour',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pages Personnalisées</CardTitle>
        <CardDescription>
          Activez ou désactivez les pages supplémentaires pour cette propriété
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pageOptions.map((page) => {
          const Icon = page.icon
          const isEnabled = settings[page.id as keyof typeof settings] || false
          
          return (
            <div
              key={page.id}
              className="flex items-center justify-between space-x-4 p-4 rounded-lg border"
            >
              <div className="flex items-start space-x-4">
                <Icon className={`h-5 w-5 mt-0.5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="space-y-1">
                  <Label htmlFor={page.id} className="text-base font-medium">
                    {page.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {page.description}
                  </p>
                </div>
              </div>
              <Switch
                id={page.id}
                checked={isEnabled}
                onCheckedChange={() => handleToggle(page.id)}
              />
            </div>
          )
        })}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}