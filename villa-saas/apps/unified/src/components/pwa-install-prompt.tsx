'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function PWAInstallPrompt() {
  const t = useTranslations()
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Écouter l'événement beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Afficher le prompt après 30 secondes ou 3 pages vues
      const showTimeout = setTimeout(() => {
        setShowPrompt(true)
      }, 30000)

      return () => clearTimeout(showTimeout)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Afficher le prompt d'installation
    deferredPrompt.prompt()

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installé')
    } else {
      console.log('Installation PWA refusée')
    }

    // Reset
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleClose = () => {
    setShowPrompt(false)
    // Ne plus afficher pendant cette session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Ne pas afficher si déjà fermé (vérifier uniquement côté client)
  if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
    return null
  }

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="shadow-lg">
        <CardContent className="relative p-4">
          <button
            onClick={handleClose}
            className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Download className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="mb-1 font-semibold">
                Installer l'application
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Installez notre application pour un accès rapide et une utilisation hors ligne
              </p>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall}>
                  Installer
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClose}>
                  Plus tard
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}