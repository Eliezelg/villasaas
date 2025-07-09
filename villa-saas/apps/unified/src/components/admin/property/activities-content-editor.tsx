'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Activity } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface LocalActivity {
  name: {
    fr: string
    en: string
  }
  description: {
    fr: string
    en: string
  }
  category: string
  distance: number
  price?: string
  duration?: string
  website?: string
  phone?: string
  openingHours?: {
    fr: string
    en: string
  }
  tips?: {
    fr: string
    en: string
  }
}

interface ActivitiesContentEditorProps {
  propertyId: string
  initialContent?: LocalActivity[]
}

const activityCategories = [
  { value: 'beach', label: 'Plage & Baignade' },
  { value: 'water_sports', label: 'Sports nautiques' },
  { value: 'hiking', label: 'Randonnée' },
  { value: 'cultural', label: 'Culture & Patrimoine' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'wine', label: 'Vin & Gastronomie' },
  { value: 'kids', label: 'Activités enfants' },
  { value: 'adventure', label: 'Aventure' },
  { value: 'wellness', label: 'Bien-être & Spa' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'nightlife', label: 'Vie nocturne' },
  { value: 'other', label: 'Autre' },
]

export function ActivitiesContentEditor({ propertyId, initialContent }: ActivitiesContentEditorProps) {
  const [activities, setActivities] = useState<LocalActivity[]>(initialContent || [])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const addActivity = () => {
    setActivities([
      ...activities,
      {
        name: { fr: '', en: '' },
        description: { fr: '', en: '' },
        category: 'other',
        distance: 0,
        price: '',
        duration: '',
        website: '',
        phone: '',
        openingHours: { fr: '', en: '' },
        tips: { fr: '', en: '' }
      }
    ])
  }

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index))
  }

  const updateActivity = (index: number, field: keyof LocalActivity, value: any) => {
    const updatedActivities = [...activities]
    updatedActivities[index] = {
      ...updatedActivities[index],
      [field]: value
    }
    setActivities(updatedActivities)
  }

  const updateActivityTranslation = (
    index: number, 
    field: 'name' | 'description' | 'openingHours' | 'tips', 
    lang: 'fr' | 'en', 
    value: string
  ) => {
    const updatedActivities = [...activities]
    updatedActivities[index] = {
      ...updatedActivities[index],
      [field]: {
        ...updatedActivities[index][field],
        [lang]: value
      }
    }
    setActivities(updatedActivities)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await apiClient.patch(`/api/properties/${propertyId}`, {
        activitiesContent: activities
      })
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to save activities content')
      }

      toast({
        title: 'Contenu sauvegardé',
        description: 'Les activités locales ont été mises à jour',
      })
    } catch (error) {
      console.error('Error saving activities content:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le contenu',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contenu de la page Activités</CardTitle>
          <CardDescription>
            Gérez les activités et attractions locales à proximité de votre propriété
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Activités locales</h3>
            <Button onClick={addActivity} size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une activité
            </Button>
          </div>

          {activities.map((activity, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Activité #{index + 1}</span>
                    </div>
                    <Button
                      onClick={() => removeActivity(index)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Nom de l'activité */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom (Français)</Label>
                      <Input
                        value={activity.name.fr}
                        onChange={(e) => updateActivityTranslation(index, 'name', 'fr', e.target.value)}
                        placeholder="Ex: Plage de la Baie des Anges"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom (English)</Label>
                      <Input
                        value={activity.name.en}
                        onChange={(e) => updateActivityTranslation(index, 'name', 'en', e.target.value)}
                        placeholder="Ex: Bay of Angels Beach"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description (Français)</Label>
                      <Textarea
                        value={activity.description.fr}
                        onChange={(e) => updateActivityTranslation(index, 'description', 'fr', e.target.value)}
                        placeholder="Description de l'activité..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (English)</Label>
                      <Textarea
                        value={activity.description.en}
                        onChange={(e) => updateActivityTranslation(index, 'description', 'en', e.target.value)}
                        placeholder="Activity description..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Informations pratiques */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select
                        value={activity.category}
                        onValueChange={(value) => updateActivity(index, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activityCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Distance (km)</Label>
                      <Input
                        type="number"
                        value={activity.distance}
                        onChange={(e) => updateActivity(index, 'distance', parseFloat(e.target.value) || 0)}
                        placeholder="5.5"
                        step="0.1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Prix</Label>
                      <Input
                        value={activity.price || ''}
                        onChange={(e) => updateActivity(index, 'price', e.target.value)}
                        placeholder="Ex: 15€/adulte"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Durée</Label>
                      <Input
                        value={activity.duration || ''}
                        onChange={(e) => updateActivity(index, 'duration', e.target.value)}
                        placeholder="Ex: 2-3 heures"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Site web</Label>
                      <Input
                        type="url"
                        value={activity.website || ''}
                        onChange={(e) => updateActivity(index, 'website', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        value={activity.phone || ''}
                        onChange={(e) => updateActivity(index, 'phone', e.target.value)}
                        placeholder="+33 4 xx xx xx xx"
                      />
                    </div>
                  </div>

                  {/* Horaires d'ouverture */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horaires (Français)</Label>
                      <Textarea
                        value={activity.openingHours?.fr || ''}
                        onChange={(e) => updateActivityTranslation(index, 'openingHours', 'fr', e.target.value)}
                        placeholder="Ex: Ouvert tous les jours de 9h à 18h..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horaires (English)</Label>
                      <Textarea
                        value={activity.openingHours?.en || ''}
                        onChange={(e) => updateActivityTranslation(index, 'openingHours', 'en', e.target.value)}
                        placeholder="Ex: Open daily from 9am to 6pm..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Conseils */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Conseils (Français)</Label>
                      <Textarea
                        value={activity.tips?.fr || ''}
                        onChange={(e) => updateActivityTranslation(index, 'tips', 'fr', e.target.value)}
                        placeholder="Ex: Pensez à réserver en avance en haute saison..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conseils (English)</Label>
                      <Textarea
                        value={activity.tips?.en || ''}
                        onChange={(e) => updateActivityTranslation(index, 'tips', 'en', e.target.value)}
                        placeholder="Ex: Book in advance during high season..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}