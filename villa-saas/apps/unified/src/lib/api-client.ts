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

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    // Only set Content-Type for requests with a body
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // IMPORTANT: Inclure les cookies dans les requêtes
      });

      // If 401 and not already refreshing, try to refresh token
      if (response.status === 401 && !this.isRefreshing && endpoint !== '/api/auth/refresh') {
        this.isRefreshing = true;
        
        // If there's no refresh promise, create one
        if (!this.refreshPromise) {
          this.refreshPromise = this.refreshToken();
        }
        
        const refreshSuccess = await this.refreshPromise;
        this.isRefreshing = false;
        this.refreshPromise = null;
        
        if (refreshSuccess) {
          // Retry the original request
          response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return { data: null as any };
      }

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

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async get<T>(endpoint: string, options?: { params?: Record<string, any> }) {
    let url = endpoint;
    if (options?.params) {
      const queryString = new URLSearchParams(options.params).toString();
      url = `${endpoint}?${queryString}`;
    }
    return this.request<T>(url, { method: 'GET' });
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

  // Méthode spéciale pour le calendrier de disponibilité
  async getAvailabilityCalendar(propertyId: string, startDate: string, endDate: string) {
    return this.get<any>(`/api/public/properties/${propertyId}/availability?startDate=${startDate}&endDate=${endDate}`);
  }

  // Méthodes pour les propriétés
  async getProperties(params?: Record<string, any>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any[]>(`/api/public/properties${queryString}`);
  }

  async getProperty(id: string) {
    return this.get<any>(`/api/public/properties/${id}`);
  }

  // Méthodes pour les réservations
  async createBooking(data: any) {
    return this.post<any>('/api/public/bookings', data);
  }

  async calculatePrice(propertyId: string, checkIn: string, checkOut: string, guests: number) {
    return this.get<any>(`/api/public/pricing/calculate?propertyId=${propertyId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  }
}

export const apiClient = new ApiClient();