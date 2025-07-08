import { apiClient } from '@/lib/api-client';

export interface Booking {
  id: string;
  reference: string;
  propertyId: string;
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    coverImage: string;
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry?: string;
  guestAddress?: string;
  guestNotes?: string;
  specialRequests?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  accommodationTotal: number;
  cleaningFee: number;
  touristTax: number;
  extraFees: any[];
  discountAmount: number;
  subtotal: number;
  total: number;
  currency: string;
  paymentStatus: string;
  commissionAmount: number;
  payoutAmount: number;
  source?: string;
  externalId?: string;
  internalNotes?: string;
  cancellationDate?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry?: string;
  guestAddress?: string;
  guestNotes?: string;
  specialRequests?: string;
  source?: string;
  externalId?: string;
}

export interface UpdateBookingData {
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCountry?: string;
  guestAddress?: string;
  guestNotes?: string;
  specialRequests?: string;
  internalNotes?: string;
}

export interface BookingFilters {
  propertyId?: string;
  status?: Booking['status'];
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'checkIn' | 'checkOut' | 'total';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingListResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PriceCalculation {
  available: boolean;
  nights: number;
  accommodationTotal: number;
  cleaningFee: number;
  touristTax: number;
  extraFees: any[];
  discountAmount: number;
  subtotal: number;
  total: number;
  breakdown: {
    date: string;
    price: number;
    isWeekend: boolean;
  }[];
  commission: {
    rate: number;
    amount: number;
  };
  error?: string;
}

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  cancellationRate: number;
  totalRevenue: number;
  averageStay: number;
  occupancyRate: number;
}

class BookingService {
  async calculatePrice(data: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    infants: number;
    pets: number;
  }) {
    return apiClient.post<PriceCalculation>('/api/bookings/calculate-price', data);
  }

  async create(data: CreateBookingData) {
    return apiClient.post<Booking>('/api/bookings', data);
  }

  async list(filters: BookingFilters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.propertyId) params.append('propertyId', filters.propertyId);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    return apiClient.get<BookingListResponse>(`/api/bookings?${params.toString()}`);
  }

  async getById(id: string) {
    return apiClient.get<Booking>(`/api/bookings/${id}`);
  }

  async update(id: string, data: UpdateBookingData) {
    return apiClient.patch<Booking>(`/api/bookings/${id}`, data);
  }

  async confirm(id: string) {
    return apiClient.post<Booking>(`/api/bookings/${id}/confirm`);
  }

  async cancel(id: string, reason?: string) {
    return apiClient.post<Booking>(`/api/bookings/${id}/cancel`, { reason });
  }

  async getStats(filters: {
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const params = new URLSearchParams();
    if (filters.propertyId) params.append('propertyId', filters.propertyId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    return apiClient.get<BookingStats>(`/api/bookings/stats?${params.toString()}`);
  }
}

export const bookingService = new BookingService();