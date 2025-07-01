import { apiClient } from '@/lib/api-client';
import type { Property, CreatePropertyData, UpdatePropertyData } from '@/types/property';

export const propertiesService = {
  async getAll() {
    return apiClient.get<Property[]>('/api/properties');
  },

  async getById(id: string) {
    return apiClient.get<Property>(`/api/properties/${id}`);
  },

  async create(data: CreatePropertyData) {
    return apiClient.post<Property>('/api/properties', data);
  },

  async update(id: string, data: UpdatePropertyData) {
    return apiClient.patch<Property>(`/api/properties/${id}`, data);
  },

  async delete(id: string) {
    return apiClient.delete(`/api/properties/${id}`);
  },

  async publish(id: string) {
    return apiClient.post<Property>(`/api/properties/${id}/publish`, { status: 'PUBLISHED' });
  },

  async unpublish(id: string) {
    return apiClient.post<Property>(`/api/properties/${id}/publish`, { status: 'DRAFT' });
  },
};