import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/my-booking/', // Pages privées
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}