'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Wrench } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Service {
  name: {
    fr: string
    en: string
  }
  description?: {
    fr: string
    en: string
  }
  category: string
  price?: string
  availability?: {
    fr: string
    en: string
  }
}

interface ServicesContent {
  included: Service[]
  optional: Service[]
  onRequest: Service[]
}

interface ServicesContentEditorProps {
  propertyId: string
  initialContent?: ServicesContent
}

const serviceCategories = [
  { value: 'cleaning', label: 'Ménage' },
  { value: 'concierge', label: 'Conciergerie' },
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Alimentation' },
  { value: 'wellness', label: 'Bien-être' },
  { value: 'equipment', label: 'Équipement' },
  { value: 'childcare', label: 'Garde d\'enfants' },
  { value: 'laundry', label: 'Blanchisserie' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Autre' },
]

export function ServicesContentEditor({ propertyId, initialContent }: ServicesContentEditorProps) {
  const [content, setContent] = useState<ServicesContent>(
    initialContent || {
      included: [],
      optional: [],
      onRequest: []
    }
  )
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const addService = (type: keyof ServicesContent) => {
    setContent({
      ...content,
      [type]: [
        ...content[type],
        {
          name: { fr: '', en: '' },
          description: { fr: '', en: '' },
          category: 'other',
          price: '',
          availability: { fr: '', en: '' }
        }
      ]
    })
  }

  const removeService = (type: keyof ServicesContent, index: number) => {
    setContent({
      ...content,
      [type]: content[type].filter((_, i) => i !== index)
    })
  }

  const updateService = (
    type: keyof ServicesContent, 
    index: number, 
    field: keyof Service, 
    value: any
  ) => {
    const updatedServices = [...content[type]]
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value
    }
    setContent({
      ...content,
      [type]: updatedServices
    })
  }

  const updateServiceTranslation = (
    type: keyof ServicesContent,
    index: number, 
    field: 'name' | 'description' | 'availability', 
    lang: 'fr' | 'en', 
    value: string
  ) => {
    const updatedServices = [...content[type]]
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: {
        ...updatedServices[index][field],
        [lang]: value
      }
    }
    setContent({
      ...content,
      [type]: updatedServices
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await apiClient.patch(`/api/properties/${propertyId}`, {
        servicesContent: content
      })
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to save services content')
      }

      toast({
        title: 'Contenu sauvegardé',
        description: 'Les services ont été mis à jour',
      })
    } catch (error) {
      console.error('Error saving services content:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le contenu',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const renderServiceList = (
    type: keyof ServicesContent, 
    title: string, 
    description: string
  ) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={() => addService(type)} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {content[type].map((service, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Service #{index + 1}</span>
                </div>
                <Button
                  onClick={() => removeService(type, index)}
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Nom du service */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom (Français)</Label>
                  <Input
                    value={service.name.fr}
                    onChange={(e) => updateServiceTranslation(type, index, 'name', 'fr', e.target.value)}
                    placeholder="Ex: Ménage quotidien"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom (English)</Label>
                  <Input
                    value={service.name.en}
                    onChange={(e) => updateServiceTranslation(type, index, 'name', 'en', e.target.value)}
                    placeholder="Ex: Daily housekeeping"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description (Français)</Label>
                  <Textarea
                    value={service.description?.fr || ''}
                    onChange={(e) => updateServiceTranslation(type, index, 'description', 'fr', e.target.value)}
                    placeholder="Description du service..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (English)</Label>
                  <Textarea
                    value={service.description?.en || ''}
                    onChange={(e) => updateServiceTranslation(type, index, 'description', 'en', e.target.value)}
                    placeholder="Service description..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Détails */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={service.category}
                    onValueChange={(value) => updateService(type, index, 'category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {type !== 'included' && (
                  <div className="space-y-2">
                    <Label>Prix</Label>
                    <Input
                      value={service.price || ''}
                      onChange={(e) => updateService(type, index, 'price', e.target.value)}
                      placeholder="Ex: 50€/jour"
                    />
                  </div>
                )}
              </div>

              {/* Disponibilité */}
              {type === 'onRequest' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Disponibilité (Français)</Label>
                    <Input
                      value={service.availability?.fr || ''}
                      onChange={(e) => updateServiceTranslation(type, index, 'availability', 'fr', e.target.value)}
                      placeholder="Ex: Sur réservation 48h à l'avance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Disponibilité (English)</Label>
                    <Input
                      value={service.availability?.en || ''}
                      onChange={(e) => updateServiceTranslation(type, index, 'availability', 'en', e.target.value)}
                      placeholder="Ex: 48h advance booking required"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contenu de la page Services</CardTitle>
          <CardDescription>
            Gérez les services proposés avec votre propriété
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Services inclus */}
          {renderServiceList(
            'included',
            'Services inclus',
            'Services gratuits inclus dans la location'
          )}

          {/* Services optionnels */}
          {renderServiceList(
            'optional',
            'Services optionnels',
            'Services disponibles moyennant un supplément'
          )}

          {/* Services sur demande */}
          {renderServiceList(
            'onRequest',
            'Services sur demande',
            'Services disponibles sur réservation préalable'
          )}

          <div className="flex justify-end pt-4">
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