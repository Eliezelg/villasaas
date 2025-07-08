import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface SinglePropertyModeResult {
  isSinglePropertyMode: boolean
  property: any | null
  isLoading: boolean
}

export function useSinglePropertyMode(tenantId?: string): SinglePropertyModeResult {
  const [isSinglePropertyMode, setIsSinglePropertyMode] = useState(false)
  const [property, setProperty] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkSinglePropertyMode() {
      if (!tenantId) {
        setIsLoading(false)
        return
      }

      try {
        // Récupérer toutes les propriétés publiées du tenant
        const { data: properties } = await apiClient.get('/api/public/properties', {
          tenantId,
          status: 'PUBLISHED'
        })

        if (properties && properties.length === 1) {
          setIsSinglePropertyMode(true)
          setProperty(properties[0])
        } else {
          setIsSinglePropertyMode(false)
          setProperty(null)
        }
      } catch (error) {
        console.error('Error checking single property mode:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSinglePropertyMode()
  }, [tenantId])

  return { isSinglePropertyMode, property, isLoading }
}