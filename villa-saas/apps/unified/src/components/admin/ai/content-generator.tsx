'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  Check, 
  X,
  RefreshCw,
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { aiService } from '@/services/admin/ai.service'
import { cn } from '@/lib/utils'

interface ContentGeneratorProps {
  currentContent?: string
  contentType: 'title' | 'description' | 'amenities' | 'location' | 'activities' | 'services'
  propertyId: string
  language: string
  onContentUpdate: (newContent: string) => void
  className?: string
  buttonText?: string
  contextData?: any // Données supplémentaires pour améliorer la génération
}

export function ContentGenerator({
  currentContent = '',
  contentType,
  propertyId,
  language,
  onContentUpdate,
  className,
  buttonText = 'Générer avec IA',
  contextData
}: ContentGeneratorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [prompt, setPrompt] = useState('')
  const [showComparison, setShowComparison] = useState(false)

  const contentTypeLabels = {
    title: 'Titre',
    description: 'Description',
    amenities: 'Équipements',
    location: 'Localisation',
    activities: 'Activités',
    services: 'Services'
  }

  const defaultPrompts = {
    title: 'Générer un titre accrocheur pour cette propriété de vacances',
    description: 'Créer une description détaillée et séduisante de la propriété',
    amenities: 'Lister et décrire les équipements de la propriété',
    location: 'Décrire la localisation et les environs de la propriété',
    activities: 'Suggérer des activités à faire dans la région',
    services: 'Décrire les services proposés aux clients'
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await aiService.generateContent({
        propertyId,
        contentType,
        language,
        prompt: prompt || defaultPrompts[contentType],
        currentContent,
        contextData
      })

      if (response.data?.content) {
        setGeneratedContent(response.data.content)
        setShowComparison(true)
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error)
      toast.error('Erreur lors de la génération du contenu')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setShowComparison(false)
    setGeneratedContent('')
    handleGenerate()
  }

  const handleAccept = () => {
    onContentUpdate(generatedContent)
    setIsModalOpen(false)
    setShowComparison(false)
    setGeneratedContent('')
    setPrompt('')
    toast.success('Contenu mis à jour avec succès')
  }

  const handleReject = () => {
    setIsModalOpen(false)
    setShowComparison(false)
    setGeneratedContent('')
    setPrompt('')
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className={cn("gap-2", className)}
      >
        <Sparkles className="w-4 h-4" />
        {buttonText}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Générer du contenu avec l'IA - {contentTypeLabels[contentType]}
            </DialogTitle>
            <DialogDescription>
              Utilisez l'IA pour générer ou améliorer votre contenu en {language === 'fr' ? 'français' : language}
            </DialogDescription>
          </DialogHeader>

          {!showComparison ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Contenu actuel</Label>
                <div className="p-3 bg-muted rounded-md min-h-[100px]">
                  {currentContent || <span className="text-muted-foreground">Aucun contenu actuel</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">
                  Instructions pour l'IA (optionnel)
                </Label>
                <Textarea
                  id="prompt"
                  placeholder={defaultPrompts[contentType]}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Laissez vide pour utiliser les instructions par défaut
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">Contenu actuel</Badge>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {currentContent || <span className="text-muted-foreground">Aucun contenu</span>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="default">Contenu généré</Badge>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {generatedContent}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regénérer
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  variant="default"
                  onClick={handleAccept}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accepter et remplacer
                </Button>
              </div>
            </div>
          )}

          {!showComparison && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer le contenu
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}