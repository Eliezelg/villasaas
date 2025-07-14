'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import * as gtag from '@/lib/gtag'
import * as fbpixel from '@/lib/fbpixel'

export function useAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      // Utiliser window.location.search directement au lieu de useSearchParams
      // pour éviter les problèmes avec les pages statiques
      let url = pathname
      
      // Seulement accéder à window si on est côté client
      if (typeof window !== 'undefined' && window.location.search) {
        url = pathname + window.location.search
      }
      
      gtag.pageview(url)
      fbpixel.pageview()
    }
  }, [pathname])
}