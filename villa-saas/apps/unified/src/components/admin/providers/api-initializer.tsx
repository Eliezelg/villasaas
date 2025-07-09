'use client'

// This component is no longer needed as we're using HttpOnly cookies
// Tokens are sent automatically with requests via the credentials: 'include' option
export function ApiInitializer({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}