'use client'

import { useServiceWorker } from '@/hooks/use-service-worker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function NetworkStatus() {
  const t = useTranslations()
  const { isOnline, isUpdateAvailable, updateServiceWorker } = useServiceWorker()

  if (!isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t">
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isUpdateAvailable) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t">
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="ml-2 flex items-center justify-between">
            <span>Une nouvelle version est disponible</span>
            <Button size="sm" onClick={updateServiceWorker}>
              Mettre à jour
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return null
}