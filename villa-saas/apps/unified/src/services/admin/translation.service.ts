import { apiClient } from '@/lib/api-client'

export interface TranslatePropertyDto {
  targetLanguage: string
  provider: 'deepl' | 'manual'
}

export interface TranslationStatus {
  language: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress?: number
  error?: string
}

export interface PropertyTranslation {
  id: string
  propertyId: string
  language: string
  title: string
  description: string
  amenities?: string
  location?: string
  activities?: string
  services?: string
  houseRules?: string
  checkInInstructions?: string
  createdAt: string
  updatedAt: string
}

class TranslationService {
  async translateProperty(propertyId: string, targetLanguage: string, provider: 'deepl' | 'manual' = 'deepl') {
    return apiClient.post<{ jobId: string }>(`/api/properties/${propertyId}/translate`, {
      targetLanguage,
      provider
    })
  }

  async bulkTranslateProperty(propertyId: string, targetLanguages: string[]) {
    return apiClient.post<{ jobIds: string[] }>(`/api/properties/${propertyId}/translate-bulk`, {
      targetLanguages,
      provider: 'deepl'
    })
  }

  async getTranslationStatus(propertyId: string, jobId: string) {
    return apiClient.get<TranslationStatus>(`/api/properties/${propertyId}/translation-status/${jobId}`)
  }

  async getPropertyTranslations(propertyId: string) {
    return apiClient.get<PropertyTranslation[]>(`/api/properties/${propertyId}/translations`)
  }

  async getPropertyTranslation(propertyId: string, language: string) {
    return apiClient.get<PropertyTranslation>(`/api/properties/${propertyId}/translations/${language}`)
  }

  async updatePropertyTranslation(propertyId: string, language: string, data: Partial<PropertyTranslation>) {
    return apiClient.patch<PropertyTranslation>(`/api/properties/${propertyId}/translations/${language}`, data)
  }

  async deletePropertyTranslation(propertyId: string, language: string) {
    return apiClient.delete(`/api/properties/${propertyId}/translations/${language}`)
  }

  // Estimation du coût
  async estimateTranslationCost(propertyId: string, targetLanguages: string[]) {
    return apiClient.post<{ 
      totalCost: number, 
      breakdown: { language: string, cost: number }[] 
    }>(`/api/properties/${propertyId}/translation-estimate`, {
      targetLanguages
    })
  }
}

export const translationService = new TranslationService()