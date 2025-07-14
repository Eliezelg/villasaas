import { AuthProvider } from '@/components/admin/providers/auth-provider'
import { ApiInitializer } from '@/components/admin/providers/api-initializer'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ApiInitializer>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ApiInitializer>
  )
}