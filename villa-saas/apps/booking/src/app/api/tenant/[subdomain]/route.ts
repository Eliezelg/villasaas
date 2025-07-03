import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(
  request: Request,
  { params }: { params: { subdomain: string } }
) {
  try {
    const response = await fetch(
      `${API_URL}/api/public/tenant/${params.subdomain}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache for 5 minutes
        next: { revalidate: 300 },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}