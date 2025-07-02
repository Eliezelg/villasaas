import { apiClient } from '@/lib/api-client';

export interface BlockedPeriod {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateBlockedPeriodInput {
  propertyId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  notes?: string;
}

export interface UpdateBlockedPeriodInput {
  startDate?: string;
  endDate?: string;
  reason?: string;
  notes?: string;
}

export interface AvailabilityCheck {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  excludeBookingId?: string;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
  conflicts?: {
    type: 'booking' | 'blocked';
    id: string;
    startDate: string;
    endDate: string;
  }[];
}

export interface CalendarDate {
  date: string;
  available: boolean;
  price?: number;
  minNights?: number;
  reason?: 'booked' | 'blocked' | 'past';
}

export interface AvailabilityCalendar {
  propertyId: string;
  startDate: string;
  endDate: string;
  dates: CalendarDate[];
}

export interface IcalImportParams {
  propertyId: string;
  url?: string;
  content?: string;
}

export interface IcalImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface IcalExportInfo {
  url: string;
  instructions: {
    google: string;
    outlook: string;
    apple: string;
    airbnb: string;
  };
}

class AvailabilityService {
  async createBlockedPeriod(data: CreateBlockedPeriodInput) {
    return apiClient.post<BlockedPeriod>('/api/availability/blocked-periods', data);
  }

  async getBlockedPeriods(params: {
    propertyId: string;
    startDate?: string;
    endDate?: string;
  }) {
    return apiClient.get<BlockedPeriod[]>('/api/availability/blocked-periods', { params });
  }

  async updateBlockedPeriod(id: string, data: UpdateBlockedPeriodInput) {
    return apiClient.patch<BlockedPeriod>(`/api/availability/blocked-periods/${id}`, data);
  }

  async deleteBlockedPeriod(id: string) {
    return apiClient.delete(`/api/availability/blocked-periods/${id}`);
  }

  async checkAvailability(data: AvailabilityCheck) {
    return apiClient.post<AvailabilityResult>('/api/availability/check-availability', data);
  }

  async getAvailabilityCalendar(params: {
    propertyId: string;
    startDate: string;
    endDate: string;
  }) {
    return apiClient.get<AvailabilityCalendar>('/api/availability/availability-calendar', { params });
  }

  async importIcal(data: IcalImportParams) {
    return apiClient.post<IcalImportResult>('/api/availability/ical/import', data);
  }

  async getIcalExportUrl(propertyId: string) {
    return apiClient.get<IcalExportInfo>(`/api/availability/ical/export-url/${propertyId}`);
  }
}

export const availabilityService = new AvailabilityService();