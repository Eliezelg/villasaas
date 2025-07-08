import { apiClient } from '@/lib/api-client';

export interface Period {
  id: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  propertyId?: string;
  name: string;
  startDate: string;
  endDate: string;
  priority: number;
  basePrice: number;
  weekendPremium: number;
  minNights: number;
  isActive: boolean;
}

export interface CreatePeriodData {
  propertyId?: string;
  name: string;
  startDate: string;
  endDate: string;
  priority?: number;
  basePrice: number;
  weekendPremium?: number;
  minNights?: number;
  isActive?: boolean;
}

export interface UpdatePeriodData extends Partial<CreatePeriodData> {}

class PeriodsService {
  async getAll(propertyId?: string) {
    const params = propertyId ? `?propertyId=${propertyId}` : '';
    return apiClient.get<Period[]>(`/api/periods${params}`);
  }

  async getById(id: string) {
    return apiClient.get<Period>(`/api/periods/${id}`);
  }

  async create(data: CreatePeriodData) {
    return apiClient.post<Period>('/api/periods', data);
  }

  async update(id: string, data: UpdatePeriodData) {
    return apiClient.patch<Period>(`/api/periods/${id}`, data);
  }

  async delete(id: string) {
    return apiClient.delete(`/api/periods/${id}`);
  }
}

export const periodsService = new PeriodsService();