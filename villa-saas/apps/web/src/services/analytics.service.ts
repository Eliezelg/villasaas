import { apiClient } from '@/lib/api-client';

export interface OverviewData {
  totalBookings: number;
  totalRevenue: number;
  averageStayDuration: number;
  occupancyRate: number;
  topProperties: {
    id: string;
    name: string;
    revenue: number;
    bookings: number;
  }[];
  bookingSources: {
    source: string;
    count: number;
    revenue: number;
  }[];
}

export interface OccupancyData {
  totalDays: number;
  occupiedDays: number;
  occupancyRate: number;
  monthlyData: {
    month: string;
    year: number;
    occupiedDays: number;
    totalDays: number;
    occupancyRate: number;
  }[];
}

export interface RevenueData {
  totalRevenue: number;
  averageRevenuePerNight: number;
  averageRevenuePerBooking: number;
  monthlyData: {
    month: string;
    year: number;
    revenue: number;
    bookings: number;
  }[];
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  propertyId?: string;
}

class AnalyticsService {
  async getOverview(filters?: AnalyticsFilters) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);

    return apiClient.get<OverviewData>(`/api/analytics/overview?${params}`);
  }

  async getOccupancy(filters?: AnalyticsFilters) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);

    return apiClient.get<OccupancyData>(`/api/analytics/occupancy?${params}`);
  }

  async getRevenue(filters?: AnalyticsFilters) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);

    return apiClient.get<RevenueData>(`/api/analytics/revenue?${params}`);
  }

  async exportData(filters?: AnalyticsFilters) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/export?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const analyticsService = new AnalyticsService();