'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsUsersPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Rediriger vers la page utilisateurs principale
    router.push('/admin/dashboard/users')
  }, [router])

  return null
}