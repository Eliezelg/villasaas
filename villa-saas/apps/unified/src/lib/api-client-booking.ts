import { getCookie } from './utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseURL: string
  
  constructor() {
    this.baseURL = API_URL
  }
  
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const tenant = getCookie('tenant')
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(tenant && { 'X-Tenant': tenant }),
    }
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        credentials: 'include', // Important pour les cookies
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return {
          error: data.error || data.message || 'An error occurred',
        }
      }
      
      return { data }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }
  
  // Méthode POST générique
  async post<T = any>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
  
  // Méthodes publiques pour les propriétés
  async getProperties(params?: {
    page?: number
    limit?: number
    search?: string
    city?: string
    guests?: number
    checkIn?: string
    checkOut?: string
    // Filter parameters
    propertyType?: string[]
    priceRange?: { min?: number; max?: number }
    bedrooms?: number[]
    amenities?: string[]
    atmosphere?: string[]
    sortBy?: string
    sortOrder?: string
  }) {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'priceRange' && typeof value === 'object') {
            // Handle priceRange object specially
            const range = value as { min?: number; max?: number }
            if (range.min !== undefined) {
              queryParams.append('priceRange[min]', String(range.min))
            }
            if (range.max !== undefined) {
              queryParams.append('priceRange[max]', String(range.max))
            }
          } else if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, String(v)))
          } else {
            queryParams.append(key, String(value))
          }
        }
      })
    }
    
    return this.request(`/api/public/properties?${queryParams}`)
  }
  
  async getProperty(id: string) {
    return this.request(`/api/public/properties/${id}`)
  }
  
  async getPropertyAvailability(propertyId: string, startDate: string, endDate: string) {
    return this.request(
      `/api/public/availability?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`
    )
  }

  async getAvailabilityCalendar(propertyId: string, startDate: string, endDate: string) {
    return this.request<{
      propertyId: string;
      startDate: string;
      endDate: string;
      dates: Array<{
        date: string;
        available: boolean;
        price?: number;
        minNights?: number;
        reason?: 'booked' | 'blocked' | 'past';
      }>;
    }>(`/api/public/availability-calendar?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`)
  }
  
  async calculatePrice(data: {
    propertyId: string
    checkIn: string
    checkOut: string
    guests: number
  }) {
    return this.request('/api/public/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
  
  async createBooking(data: {
    propertyId: string
    checkIn: string
    checkOut: string
    adults: number
    children?: number
    infants?: number
    pets?: number
    guestFirstName: string
    guestLastName: string
    guestEmail: string
    guestPhone: string
    guestCountry: string
    guestAddress?: string
    specialRequests?: string
    paymentIntentId?: string
  }) {
    return this.request('/api/public/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
  
  async getBooking(reference: string, email: string) {
    return this.request(`/api/public/bookings/${reference}?email=${email}`)
  }
  
  // Méthodes pour les infos du tenant
  async getTenantInfo(subdomain: string) {
    return this.request(`/api/public/tenant/${subdomain}`)
  }
  
  // Méthode pour créer une intention de paiement Stripe
  async createPaymentIntent(data: {
    amount: number
    currency: string
    bookingData: any
  }) {
    return this.request('/api/public/payment/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()

// Type helper to ensure arrays
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}