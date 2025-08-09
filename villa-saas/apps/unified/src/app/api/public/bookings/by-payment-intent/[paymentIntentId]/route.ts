import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const { paymentIntentId } = params
    const cookieStore = cookies()
    
    // Essayer de récupérer le tenant depuis plusieurs sources
    let tenant = cookieStore.get('tenant')?.value
    
    // Si pas dans les cookies, essayer depuis le header x-tenant
    if (!tenant) {
      tenant = request.headers.get('x-tenant') || null
    }
    
    // Si toujours pas de tenant, essayer de l'extraire du referer ou du host
    if (!tenant) {
      const referer = request.headers.get('referer') || ''
      const host = request.headers.get('host') || ''
      
      // Extraire le sous-domaine du referer ou du host
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'webpro200.fr'
      
      // Vérifier le referer d'abord
      if (referer.includes(`.${mainDomain}`)) {
        const url = new URL(referer)
        const hostParts = url.hostname.split('.')
        if (hostParts.length > 2 && hostParts[0] !== 'www' && hostParts[0] !== 'api') {
          tenant = hostParts[0]
        }
      }
      
      // Sinon vérifier le host
      if (!tenant && host.includes(`.${mainDomain}`)) {
        const hostParts = host.split('.')
        if (hostParts.length > 2 && hostParts[0] !== 'www' && hostParts[0] !== 'api') {
          tenant = hostParts[0]
        }
      }
    }
    
    if (!tenant) {
      console.error('Tenant not found in cookies, headers, referer or host:', { 
        cookie: cookieStore.get('tenant')?.value,
        xTenant: request.headers.get('x-tenant'),
        referer: request.headers.get('referer'),
        host: request.headers.get('host')
      })
      return NextResponse.json(
        { error: 'Tenant not specified' },
        { status: 400 }
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(
      `${apiUrl}/api/public/bookings/by-payment-intent/${paymentIntentId}`,
      {
        headers: {
          'x-tenant': tenant,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || 'Failed to fetch booking' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}