'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Globe, Clock, Euro, Bell, Settings2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    notifications: {
      email: true,
      push: false,
      sms: false
    }
  })

  const handleSave = () => {
    toast.success('Préférences enregistrées')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Préférences</h1>
        <p className="text-muted-foreground">
          Personnalisez votre expérience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Régionalisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger id="language">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger id="timezone">
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Europe/London">Londres</SelectItem>
                  <SelectItem value="America/New_York">New York</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select
                value={preferences.currency}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger id="currency">
                  <Euro className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar</SelectItem>
                  <SelectItem value="GBP">GBP - Livre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Format de date</Label>
              <Select
                value={preferences.dateFormat}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, dateFormat: value }))}
              >
                <SelectTrigger id="dateFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries({
            email: 'Notifications par email',
            push: 'Notifications push',
            sms: 'Notifications SMS'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label>{label}</Label>
              <Switch
                checked={preferences.notifications[key as keyof typeof preferences.notifications]}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, [key]: checked }
                  }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Enregistrer les préférences
        </Button>
      </div>
    </div>
  )
}