'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@/lib/api-client'

export function ApiInitializer({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore()

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken)
    }
  }, [accessToken])

  return <>{children}</>
}