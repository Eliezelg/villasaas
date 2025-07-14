import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  // Rediriger vers le backend qui va traiter le callback OAuth
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const callbackUrl = `${backendUrl}/api/stripe/connect/oauth/callback?${searchParams.toString()}`;
  
  // Faire un redirect côté serveur vers le backend
  return NextResponse.redirect(callbackUrl);
}