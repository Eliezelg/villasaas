import { apiClient } from '@/lib/api-client';

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  urls?: {
    small?: string;
    medium?: string;
    large?: string;
    original?: string;
  };
  order: number;
  alt?: string;
  caption?: any;
  isPrimary: boolean;
  createdAt: string;
}

export const propertyImagesService = {
  async getAll(propertyId: string) {
    return apiClient.get<PropertyImage[]>(`/api/properties/${propertyId}/images`);
  },

  async upload(propertyId: string, image: string, filename: string) {
    return apiClient.post<PropertyImage>(`/api/properties/${propertyId}/images`, {
      image,
      filename,
    });
  },

  async updateOrder(propertyId: string, images: { id: string; order: number }[]) {
    return apiClient.put(`/api/properties/${propertyId}/images/order`, { images });
  },

  async delete(propertyId: string, imageId: string) {
    return apiClient.delete(`/api/properties/${propertyId}/images/${imageId}`);
  },
};