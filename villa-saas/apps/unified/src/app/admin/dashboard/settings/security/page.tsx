'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Key, Smartphone, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sécurité</h1>
        <p className="text-muted-foreground">
          Gérez la sécurité de votre compte
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Authentification à deux facteurs
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Activer 2FA</p>
              <p className="text-sm text-muted-foreground">
                Utilisez une app d'authentification
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timeout">Expiration de session (minutes)</Label>
            <Input
              id="timeout"
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
              min={5}
              max={1440}
            />
          </div>
          <Button variant="destructive" className="w-full">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Déconnecter toutes les sessions
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Paramètres de sécurité enregistrés')}>
          <Shield className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </div>
  )
}