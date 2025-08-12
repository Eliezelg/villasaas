import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { TenantProvider } from '@/lib/tenant-context'
import { headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { NetworkStatus } from '@/components/network-status'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import { FacebookPixel } from '@/components/analytics/facebook-pixel'
import { AnalyticsProvider } from '@/components/analytics-provider'
import { locales } from '@villa-saas/i18n'
import { getTenantMetadata } from '@/lib/tenant-metadata'
import { GuestChatWidget } from '@/components/messaging/guest-chat-widget'

const inter = Inter({ subsets: ['latin'] })

// Force le rendu dynamique car on utilise headers() pour récupérer les métadonnées du tenant
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata(): Promise<Metadata> {
  // Récupérer les métadonnées du tenant
  const tenantData = await getTenantMetadata()
  
  // Valeurs par défaut
  const defaultTitle = 'Villa Booking'
  const defaultDescription = 'Réservez votre villa de rêve'
  
  // Utiliser les métadonnées du tenant si disponibles
  const title = tenantData?.metadata?.title || tenantData?.name || defaultTitle
  const description = tenantData?.metadata?.description || defaultDescription
  const keywords = tenantData?.metadata?.keywords || ['villa', 'location', 'vacances', 'réservation']
  
  const baseUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'
  const headersList = headers()
  const host = headersList.get('host') || 'booking.villa-saas.com'
  const currentUrl = `https://${host}`
  
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    keywords,
    authors: [{ name: tenantData?.name || 'Villa SaaS' }],
    creator: tenantData?.name || 'Villa SaaS',
    openGraph: {
      type: 'website',
      locale: tenantData?.defaultLocale || 'fr_FR',
      url: currentUrl,
      title,
      description,
      siteName: title,
      ...(tenantData?.metadata?.ogImage && {
        images: [{
          url: tenantData.metadata.ogImage,
          width: 1200,
          height: 630,
        }]
      })
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(tenantData?.metadata?.ogImage && {
        images: [tenantData.metadata.ogImage]
      })
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
      icon: tenantData?.favicon || '/favicon.ico',
      shortcut: tenantData?.favicon || '/favicon-16x16.png',
      apple: tenantData?.favicon || '/apple-touch-icon.png',
    },
  }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // Vérifier si la locale est valide
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <TenantProvider>
        <div className={inter.className}>
          <GoogleAnalytics />
          <FacebookPixel />
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
          <NetworkStatus />
          <PWAInstallPrompt />
          <GuestChatWidget />
        </div>
      </TenantProvider>
    </NextIntlClientProvider>
  )
}