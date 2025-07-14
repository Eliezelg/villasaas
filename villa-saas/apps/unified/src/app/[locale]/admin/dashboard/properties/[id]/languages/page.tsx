'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { propertyService } from '@/services/admin/property.service'
import { translationService } from '@/services/admin/translation.service'
import { 
  Globe, 
  Languages, 
  Sparkles, 
  DollarSign,
  Check,
  X,
  Loader2,
  AlertCircle,
  Wand2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'

interface Language {
  code: string
  name: string
  nativeName: string
  enabled: boolean
  translationType: 'manual' | 'automatic' | null
  translationStatus: 'pending' | 'in_progress' | 'completed' | null
  lastTranslated?: string
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', enabled: true, translationType: 'manual', translationStatus: 'completed' },
  { code: 'en', name: 'English', nativeName: 'English', enabled: false, translationType: null, translationStatus: null },
  { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: false, translationType: null, translationStatus: null },
  { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: false, translationType: null, translationStatus: null },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: false, translationType: null, translationStatus: null },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: false, translationType: null, translationStatus: null },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', enabled: false, translationType: null, translationStatus: null },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', enabled: false, translationType: null, translationStatus: null },
  { code: 'zh', name: 'Chinese', nativeName: '中文', enabled: false, translationType: null, translationStatus: null },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: false, translationType: null, translationStatus: null },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', enabled: false, translationType: null, translationStatus: null },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', enabled: false, translationType: null, translationStatus: null },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', enabled: false, translationType: null, translationStatus: null },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', enabled: false, translationType: null, translationStatus: null },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', enabled: false, translationType: null, translationStatus: null }
]

export default function PropertyLanguagesPage() {
  const params = useParams()
  const propertyId = params.id as string
  const [languages, setLanguages] = useState<Language[]>(AVAILABLE_LANGUAGES)
  const [loading, setLoading] = useState(true)
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null)
  const [translationMethod, setTranslationMethod] = useState<'manual' | 'automatic'>('manual')
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedLanguagesForBulk, setSelectedLanguagesForBulk] = useState<string[]>([])

  useEffect(() => {
    loadPropertyLanguages()
  }, [propertyId])

  const loadPropertyLanguages = async () => {
    try {
      const response = await propertyService.getLanguages(propertyId)
      if (response.data) {
        // Fusionner avec les langues disponibles
        const updatedLanguages = AVAILABLE_LANGUAGES.map(lang => {
          const savedLang = response.data.find((l: any) => l.code === lang.code)
          return savedLang || lang
        })
        setLanguages(updatedLanguages)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des langues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageToggle = (languageCode: string) => {
    const language = languages.find(l => l.code === languageCode)
    if (!language) return

    if (!language.enabled) {
      // Activer une langue - ouvrir le modal de traduction
      setSelectedLanguage(language)
      setIsTranslationModalOpen(true)
    } else {
      // Désactiver une langue
      handleDisableLanguage(languageCode)
    }
  }

  const handleDisableLanguage = async (languageCode: string) => {
    try {
      await propertyService.disableLanguage(propertyId, languageCode)
      setLanguages(prev => prev.map(lang => 
        lang.code === languageCode 
          ? { ...lang, enabled: false, translationType: null, translationStatus: null }
          : lang
      ))
      toast.success('Langue désactivée')
    } catch (error) {
      toast.error('Erreur lors de la désactivation')
    }
  }

  const handleConfirmTranslation = async () => {
    if (!selectedLanguage) return

    setIsTranslating(true)
    try {
      if (translationMethod === 'automatic') {
        // Traduction automatique avec DeepL
        await translationService.translateProperty(propertyId, selectedLanguage.code, 'deepl')
        toast.success(`Traduction automatique en ${selectedLanguage.name} lancée (10€ seront facturés)`)
      } else {
        // Mode manuel - juste activer la langue
        await propertyService.enableLanguage(propertyId, selectedLanguage.code, 'manual')
        toast.success(`${selectedLanguage.name} activé en mode traduction manuelle`)
      }

      // Mettre à jour l'état local
      setLanguages(prev => prev.map(lang => 
        lang.code === selectedLanguage.code 
          ? { 
              ...lang, 
              enabled: true, 
              translationType: translationMethod,
              translationStatus: translationMethod === 'automatic' ? 'in_progress' : 'pending'
            }
          : lang
      ))

      setIsTranslationModalOpen(false)
      setSelectedLanguage(null)
    } catch (error) {
      toast.error('Erreur lors de l\'activation de la langue')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleBulkTranslation = async () => {
    if (selectedLanguagesForBulk.length === 0) {
      toast.error('Veuillez sélectionner au moins une langue')
      return
    }

    setIsTranslating(true)
    try {
      await translationService.bulkTranslateProperty(propertyId, selectedLanguagesForBulk)
      toast.success(`Traduction lancée pour ${selectedLanguagesForBulk.length} langues (${selectedLanguagesForBulk.length * 10}€ seront facturés)`)
      
      // Mettre à jour l'état
      setLanguages(prev => prev.map(lang => 
        selectedLanguagesForBulk.includes(lang.code)
          ? { 
              ...lang, 
              enabled: true, 
              translationType: 'automatic',
              translationStatus: 'in_progress'
            }
          : lang
      ))
      
      setSelectedLanguagesForBulk([])
    } catch (error) {
      toast.error('Erreur lors de la traduction en masse')
    } finally {
      setIsTranslating(false)
    }
  }

  const getStatusBadge = (language: Language) => {
    if (!language.enabled) return null

    if (language.translationType === 'manual') {
      return <Badge variant="secondary">Manuel</Badge>
    }

    switch (language.translationStatus) {
      case 'in_progress':
        return (
          <Badge variant="default" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            En cours
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="success" className="gap-1">
            <Check className="w-3 h-3" />
            Traduit
          </Badge>
        )
      default:
        return <Badge variant="outline">En attente</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Langues et Traductions</h1>
        <p className="text-muted-foreground">
          Gérez les langues disponibles pour votre propriété
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Traduction automatique :</strong> 10€ par langue avec DeepL. 
          La traduction manuelle vous permet de traduire vous-même le contenu gratuitement.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Langues disponibles</CardTitle>
              <CardDescription>
                Activez les langues dans lesquelles votre propriété sera visible
              </CardDescription>
            </div>
            <Button 
              onClick={handleBulkTranslation}
              disabled={selectedLanguagesForBulk.length === 0 || isTranslating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Traduire en masse ({selectedLanguagesForBulk.length * 10}€)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {languages.map((language) => (
              <div
                key={language.code}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Switch
                    checked={language.enabled}
                    onCheckedChange={() => handleLanguageToggle(language.code)}
                    disabled={language.code === 'fr'} // Français toujours activé
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{language.nativeName}</p>
                      <span className="text-sm text-muted-foreground">({language.name})</span>
                      {language.code === 'fr' && (
                        <Badge variant="outline">Langue par défaut</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(language)}
                  {!language.enabled && language.code !== 'fr' && (
                    <Checkbox
                      checked={selectedLanguagesForBulk.includes(language.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLanguagesForBulk(prev => [...prev, language.code])
                        } else {
                          setSelectedLanguagesForBulk(prev => prev.filter(c => c !== language.code))
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isTranslationModalOpen} onOpenChange={setIsTranslationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activer {selectedLanguage?.nativeName}</DialogTitle>
            <DialogDescription>
              Choisissez comment vous souhaitez traduire votre contenu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                translationMethod === 'manual' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => setTranslationMethod('manual')}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    translationMethod === 'manual' ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}>
                    {translationMethod === 'manual' && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Traduction manuelle</p>
                  <p className="text-sm text-muted-foreground">
                    Traduisez vous-même le contenu (gratuit)
                  </p>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                translationMethod === 'automatic' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => setTranslationMethod('automatic')}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    translationMethod === 'automatic' ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}>
                    {translationMethod === 'automatic' && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Traduction automatique avec DeepL</p>
                    <Badge variant="secondary">
                      <DollarSign className="w-3 h-3" />
                      10€
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Traduction professionnelle instantanée
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTranslationModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmTranslation} disabled={isTranslating}>
              {isTranslating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {translationMethod === 'automatic' ? 'Traduire (10€)' : 'Activer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}