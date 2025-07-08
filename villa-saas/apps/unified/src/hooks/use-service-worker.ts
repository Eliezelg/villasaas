'use client'

import { useEffect, useState } from 'react'

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(true)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Désactiver temporairement le Service Worker en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker désactivé en développement')
      return
    }

    // Vérifier le support du Service Worker
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker non supporté')
      return
    }

    // Enregistrer le Service Worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg)
        console.log('Service Worker enregistré')

        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
          reg.update()
        }, 60 * 60 * 1000)

        // Écouter les mises à jour
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true)
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', error)
      })

    // Gérer le statut online/offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Vérifier le statut initial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      // Dire au SW d'activer la nouvelle version
      registration.waiting.postMessage({ action: 'skipWaiting' })
      
      // Recharger la page quand le nouveau SW prend le contrôle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  return {
    isOnline,
    isUpdateAvailable,
    updateServiceWorker,
  }
}