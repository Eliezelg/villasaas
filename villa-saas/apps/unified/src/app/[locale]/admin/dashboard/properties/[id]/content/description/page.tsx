'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useProperty } from '@/contexts/property-context'
import { ContentGenerator } from '@/components/admin/ai/content-generator'
import { propertiesService } from '@/services/properties.service'
import { translationService } from '@/services/admin/translation.service'
import { Save, Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Descriptions {
  [key: string]: string
}

export default function PropertyDescriptionPage() {
  const { property, reload } = useProperty()
  const [selectedLanguage, setSelectedLanguage] = useState('fr')
  const [descriptions, setDescriptions] = useState<Descriptions>(
    property?.description || { fr: '' }
  )
  const [saving, setSaving] = useState(false)

  // Langues activées pour cette propriété
  const enabledLanguages = [
    { code: 'fr', name: 'Français' },
    // Ajoutez ici les autres langues activées dynamiquement
  ]

  const handleDescriptionChange = (value: string) => {
    setDescriptions(prev => ({
      ...prev,
      [selectedLanguage]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await propertiesService.update(property?.id || '', {
        description: descriptions
      })
      toast.success('Description enregistrée')
      reload()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleAIContentUpdate = (newContent: string) => {
    setDescriptions(prev => ({
      ...prev,
      [selectedLanguage]: newContent
    }))
  }

  if (!property) {
    return (
      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        Propriété non trouvée
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Description de la propriété</h2>
        <p className="text-muted-foreground">
          Rédigez une description attractive pour chaque langue
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Contenu</CardTitle>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enabledLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {lang.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ContentGenerator
              currentContent={descriptions[selectedLanguage] || ''}
              contentType="description"
              propertyId={property.id}
              language={selectedLanguage}
              onContentUpdate={handleAIContentUpdate}
              contextData={{
                propertyType: property.propertyType,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                maxGuests: property.maxGuests,
                city: property.city,
                country: property.country,
                surfaceArea: property.surfaceArea
              }}
            />
          </div>
          <CardDescription>
            Décrivez votre propriété de manière détaillée et attractive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Description en {enabledLanguages.find(l => l.code === selectedLanguage)?.name}</Label>
            <Textarea
              value={descriptions[selectedLanguage] || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Décrivez votre propriété..."
              rows={10}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {(descriptions[selectedLanguage] || '').length} caractères
            </p>
          </div>

          {/* Aperçu des autres langues */}
          <div className="space-y-2">
            <Label>Autres langues</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(descriptions).map(([lang, content]) => {
                if (lang === selectedLanguage) return null
                return (
                  <Badge
                    key={lang}
                    variant={content ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang.toUpperCase()}: {content ? '✓' : '✗'}
                  </Badge>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}