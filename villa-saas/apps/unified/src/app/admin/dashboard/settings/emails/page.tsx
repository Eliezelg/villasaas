'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Mail, Send, FileText, Bell } from 'lucide-react'

export default function EmailSettingsPage() {
  const [sender, setSender] = useState({
    name: 'Villa Rentals',
    email: 'noreply@villa-rentals.com'
  })

  const [templates, setTemplates] = useState({
    bookingConfirmation: true,
    bookingReminder: true,
    paymentReceived: true,
    reviewRequest: true
  })

  const handleSave = () => {
    toast.success('Paramètres email enregistrés')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres Email</h1>
        <p className="text-muted-foreground">
          Configurez vos emails transactionnels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Expéditeur
          </CardTitle>
          <CardDescription>
            Informations de l'expéditeur des emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderName">Nom de l'expéditeur</Label>
            <Input
              id="senderName"
              value={sender.name}
              onChange={(e) => setSender(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderEmail">Email de l'expéditeur</Label>
            <Input
              id="senderEmail"
              type="email"
              value={sender.email}
              onChange={(e) => setSender(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Templates actifs
          </CardTitle>
          <CardDescription>
            Activez ou désactivez les emails automatiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries({
            bookingConfirmation: 'Confirmation de réservation',
            bookingReminder: 'Rappel de réservation',
            paymentReceived: 'Paiement reçu',
            reviewRequest: 'Demande d\'avis'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">
                  Envoyé automatiquement aux clients
                </p>
              </div>
              <Switch
                checked={templates[key as keyof typeof templates]}
                onCheckedChange={(checked) => 
                  setTemplates(prev => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Send className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </div>
  )
}