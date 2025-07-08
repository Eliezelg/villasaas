const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

class UnifiedApiClient {
  private accessToken: string | null = null;
  private tenant: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setTenant(tenant: string | null) {
    this.tenant = tenant;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Ajouter le token d'authentification si disponible
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Ajouter le tenant si disponible
    if (this.tenant) {
      headers['X-Tenant'] = this.tenant;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'An error occurred',
        },
      };
    }
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async put<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, string>) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: Record<string, string> = {};
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    if (this.tenant) {
      headers['X-Tenant'] = this.tenant;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          error: 'Upload Error',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      };
    }
  }
}

// Export des instances pour différents contextes
export const apiClient = new UnifiedApiClient();

// Helper pour créer un client avec tenant
export function createTenantApiClient(tenant: string): UnifiedApiClient {
  const client = new UnifiedApiClient();
  client.setTenant(tenant);
  return client;
}

// Helper pour créer un client avec auth
export function createAuthApiClient(token: string): UnifiedApiClient {
  const client = new UnifiedApiClient();
  client.setAccessToken(token);
  return client;
}