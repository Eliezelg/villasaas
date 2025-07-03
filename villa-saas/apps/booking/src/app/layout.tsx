import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TenantProvider } from '@/lib/tenant-context'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  // Récupérer le tenant depuis les headers
  const headersList = headers()
  const tenant = headersList.get('x-tenant')
  
  // TODO: Charger les métadonnées du tenant depuis l'API
  const defaultTitle = 'Villa Booking'
  const defaultDescription = 'Réservez votre villa de rêve'
  
  return {
    title: {
      default: defaultTitle,
      template: `%s | ${defaultTitle}`,
    },
    description: defaultDescription,
    keywords: ['villa', 'location', 'vacances', 'réservation'],
    authors: [{ name: 'Villa SaaS' }],
    creator: 'Villa SaaS',
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: 'https://booking.villa-saas.com',
      title: defaultTitle,
      description: defaultDescription,
      siteName: defaultTitle,
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: defaultDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  )
}