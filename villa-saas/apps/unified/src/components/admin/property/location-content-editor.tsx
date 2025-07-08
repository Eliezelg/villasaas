'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, MapPin } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface NearbyPlace {
  name: {
    fr: string
    en: string
  }
  category: string
  distance: number
  walkingTime?: number
  description?: {
    fr: string
    en: string
  }
}

interface LocationContent {
  description: {
    fr: string
    en: string
  }
  nearbyPlaces: NearbyPlace[]
}

interface LocationContentEditorProps {
  propertyId: string
  initialContent?: LocationContent
}

const placeCategories = [
  { value: 'beach', label: 'Plage' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'shop', label: 'Commerce' },
  { value: 'supermarket', label: 'Supermarché' },
  { value: 'activity', label: 'Activité' },
  { value: 'transport', label: 'Transport' },
  { value: 'hospital', label: 'Hôpital' },
  { value: 'attraction', label: 'Attraction touristique' },
  { value: 'other', label: 'Autre' },
]

export function LocationContentEditor({ propertyId, initialContent }: LocationContentEditorProps) {
  const [content, setContent] = useState<LocationContent>(
    initialContent || {
      description: { fr: '', en: '' },
      nearbyPlaces: []
    }
  )
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const addNearbyPlace = () => {
    setContent({
      ...content,
      nearbyPlaces: [
        ...content.nearbyPlaces,
        {
          name: { fr: '', en: '' },
          category: 'other',
          distance: 0,
          walkingTime: 0,
          description: { fr: '', en: '' }
        }
      ]
    })
  }

  const removeNearbyPlace = (index: number) => {
    setContent({
      ...content,
      nearbyPlaces: content.nearbyPlaces.filter((_, i) => i !== index)
    })
  }

  const updateNearbyPlace = (index: number, field: keyof NearbyPlace, value: any) => {
    const updatedPlaces = [...content.nearbyPlaces]
    updatedPlaces[index] = {
      ...updatedPlaces[index],
      [field]: value
    }
    setContent({ ...content, nearbyPlaces: updatedPlaces })
  }

  const updateNearbyPlaceTranslation = (
    index: number, 
    field: 'name' | 'description', 
    lang: 'fr' | 'en', 
    value: string
  ) => {
    const updatedPlaces = [...content.nearbyPlaces]
    updatedPlaces[index] = {
      ...updatedPlaces[index],
      [field]: {
        ...updatedPlaces[index][field],
        [lang]: value
      }
    }
    setContent({ ...content, nearbyPlaces: updatedPlaces })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await apiClient.patch(`/api/properties/${propertyId}`, {
        locationContent: content
      })
      
      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: 'Contenu sauvegardé',
        description: 'Le contenu de la page localisation a été mis à jour',
      })
    } catch (error) {
      console.error('Error saving location content:', error)
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
          <CardTitle>Contenu de la page Localisation</CardTitle>
          <CardDescription>
            Personnalisez le contenu de la page localisation de votre propriété
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Description de la localisation</h3>
            
            <div className="space-y-2">
              <Label>Description (Français)</Label>
              <Textarea
                value={content.description.fr}
                onChange={(e) => setContent({
                  ...content,
                  description: { ...content.description, fr: e.target.value }
                })}
                placeholder="Décrivez l'emplacement de votre propriété, le quartier, l'ambiance..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description (English)</Label>
              <Textarea
                value={content.description.en}
                onChange={(e) => setContent({
                  ...content,
                  description: { ...content.description, en: e.target.value }
                })}
                placeholder="Describe your property's location, neighborhood, atmosphere..."
                rows={4}
              />
            </div>
          </div>

          {/* Nearby Places Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lieux à proximité</h3>
              <Button onClick={addNearbyPlace} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un lieu
              </Button>
            </div>

            {content.nearbyPlaces.map((place, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Lieu #{index + 1}</span>
                      </div>
                      <Button
                        onClick={() => removeNearbyPlace(index)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom (Français)</Label>
                        <Input
                          value={place.name.fr}
                          onChange={(e) => updateNearbyPlaceTranslation(index, 'name', 'fr', e.target.value)}
                          placeholder="Ex: Plage de la Baie"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Nom (English)</Label>
                        <Input
                          value={place.name.en}
                          onChange={(e) => updateNearbyPlaceTranslation(index, 'name', 'en', e.target.value)}
                          placeholder="Ex: Bay Beach"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select
                          value={place.category}
                          onValueChange={(value) => updateNearbyPlace(index, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {placeCategories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Distance (mètres)</Label>
                        <Input
                          type="number"
                          value={place.distance}
                          onChange={(e) => updateNearbyPlace(index, 'distance', parseInt(e.target.value) || 0)}
                          placeholder="500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Temps à pied (minutes)</Label>
                        <Input
                          type="number"
                          value={place.walkingTime || 0}
                          onChange={(e) => updateNearbyPlace(index, 'walkingTime', parseInt(e.target.value) || 0)}
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Description (Français)</Label>
                        <Textarea
                          value={place.description?.fr || ''}
                          onChange={(e) => updateNearbyPlaceTranslation(index, 'description', 'fr', e.target.value)}
                          placeholder="Description optionnelle..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description (English)</Label>
                        <Textarea
                          value={place.description?.en || ''}
                          onChange={(e) => updateNearbyPlaceTranslation(index, 'description', 'en', e.target.value)}
                          placeholder="Optional description..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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