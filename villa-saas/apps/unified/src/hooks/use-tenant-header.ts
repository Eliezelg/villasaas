import { useTenant } from '@/lib/tenant-context'
import { getCookie } from '@/lib/utils'

export function useTenantHeader() {
  const { tenant } = useTenant()
  
  // Récupérer le tenant depuis le cookie si le contexte n'est pas encore chargé
  const tenantSubdomain = tenant?.subdomain || getCookie('tenant') || ''
  
  return {
    'x-tenant': tenantSubdomain,
  }
}