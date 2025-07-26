import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'https://api.webpro200.com';

// Proxy toutes les requêtes API vers le backend
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const path = pathSegments.join('/');
  const url = `${API_URL}/api/${path}`;
  
  console.log(`Proxying ${method} request to: ${url}`);
  
  // Récupérer les cookies de la requête
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token');
  const refreshToken = cookieStore.get('refresh_token');
  
  // Construire les headers
  const headers: HeadersInit = {
    'Content-Type': request.headers.get('Content-Type') || 'application/json',
  };
  
  // Ajouter les cookies s'ils existent
  const cookieHeader: string[] = [];
  if (accessToken) {
    cookieHeader.push(`access_token=${accessToken.value}`);
  }
  if (refreshToken) {
    cookieHeader.push(`refresh_token=${refreshToken.value}`);
  }
  if (cookieHeader.length > 0) {
    headers['Cookie'] = cookieHeader.join('; ');
  }
  
  // Ajouter les headers custom
  const xTenantHost = request.headers.get('x-tenant-host');
  if (xTenantHost) {
    headers['x-tenant-host'] = xTenantHost;
  }
  
  // Préparer le body
  let body = null;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text();
    } catch (e) {
      // Pas de body
    }
  }
  
  try {
    // Faire la requête vers le backend
    const response = await fetch(url, {
      method,
      headers,
      body,
      // Important: ne pas suivre les redirects automatiquement
      redirect: 'manual',
    });
    
    // Copier les headers de réponse
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Ne pas copier certains headers
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    
    // Gérer les cookies de réponse
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders) {
      setCookieHeaders.forEach(cookie => {
        // Parser et définir le cookie
        const [nameValue, ...attributes] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        
        if (name && value) {
          // Les cookies sont gérés automatiquement par Next.js via les headers Set-Cookie
          responseHeaders.append('Set-Cookie', cookie);
        }
      });
    }
    
    // Retourner la réponse
    const data = response.status === 204 ? null : await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}