'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Bot, MessageSquare, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function AutoResponsesPage() {
  const [aiEnabled, setAiEnabled] = useState(true)
  const [templates, setTemplates] = useState({
    welcome: "Bonjour ! Merci pour votre intérêt. Comment puis-je vous aider ?",
    availability: "Je vérifie la disponibilité pour vos dates...",
    pricing: "Voici nos tarifs pour la période demandée..."
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Réponses Automatiques</h1>
        <p className="text-muted-foreground">
          Configurez le chatbot IA et les messages automatiques
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Assistant IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Activer l'assistant IA</p>
              <p className="text-sm text-muted-foreground">
                Répond automatiquement aux questions fréquentes
              </p>
            </div>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages prédéfinis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(templates).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium capitalize">{key}</label>
              <Textarea
                value={value}
                onChange={(e) => setTemplates(prev => ({ ...prev, [key]: e.target.value }))}
                rows={3}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Paramètres enregistrés')}>
          <Zap className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </div>
  )
}