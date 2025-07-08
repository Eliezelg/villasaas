import { apiClient } from '@/lib/api-client';
import type { Property } from '@villa-saas/types';

export interface PropertyResponse {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

class PropertyService {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PropertyResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const response = await apiClient.get<PropertyResponse>(
      `/properties?${queryParams.toString()}`
    );
    return response.data || { properties: [], total: 0, page: 1, totalPages: 0 };
  }

  // Alias pour la compatibilité
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PropertyResponse> {
    return this.getAll(params);
  }

  async getById(id: string): Promise<Property> {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    if (!response.data) throw new Error('Property not found');
    return response.data;
  }

  async create(data: any): Promise<Property> {
    const response = await apiClient.post<Property>('/properties', data);
    if (!response.data) throw new Error('Failed to create property');
    return response.data;
  }

  async update(id: string, data: any): Promise<Property> {
    const response = await apiClient.put<Property>(`/properties/${id}`, data);
    if (!response.data) throw new Error('Failed to update property');
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`);
  }

  async updateStatus(id: string, status: string): Promise<Property> {
    const response = await apiClient.patch<Property>(`/properties/${id}/status`, { status });
    if (!response.data) throw new Error('Failed to update status');
    return response.data;
  }
}

export const propertyService = new PropertyService();