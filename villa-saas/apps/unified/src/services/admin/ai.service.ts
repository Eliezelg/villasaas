import { apiClient } from '@/lib/api-client'

export interface GenerateContentDto {
  propertyId: string
  contentType: 'title' | 'description' | 'amenities' | 'location' | 'activities' | 'services'
  language: string
  prompt?: string
  currentContent?: string
  contextData?: {
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    maxGuests?: number
    city?: string
    country?: string
    amenities?: string[]
    [key: string]: any
  }
}

export interface GeneratedContent {
  content: string
  tokens: number
  model: string
}

export interface ImproveContentDto {
  content: string
  instructions?: string
  language: string
}

class AIService {
  async generateContent(data: GenerateContentDto) {
    return apiClient.post<GeneratedContent>('/api/ai/generate-content', data)
  }

  async improveContent(data: ImproveContentDto) {
    return apiClient.post<GeneratedContent>('/api/ai/improve-content', data)
  }

  async generateDescription(propertyId: string, language: string = 'fr') {
    return apiClient.post<GeneratedContent>(`/api/properties/${propertyId}/ai/generate-description`, {
      language
    })
  }

  async generateAmenities(propertyId: string, language: string = 'fr') {
    return apiClient.post<GeneratedContent>(`/api/properties/${propertyId}/ai/generate-amenities`, {
      language
    })
  }

  async generateActivities(propertyId: string, language: string = 'fr') {
    return apiClient.post<GeneratedContent>(`/api/properties/${propertyId}/ai/generate-activities`, {
      language
    })
  }

  async generateTitle(propertyId: string, language: string = 'fr') {
    return apiClient.post<GeneratedContent>(`/api/properties/${propertyId}/ai/generate-title`, {
      language
    })
  }

  async generateLocationDescription(propertyId: string, language: string = 'fr') {
    return apiClient.post<GeneratedContent>(`/api/properties/${propertyId}/ai/generate-location`, {
      language
    })
  }

  async generateServices(propertyId: string, language: string = 'fr') {
    return apiClient.post<GeneratedContent>(`/api/properties/${propertyId}/ai/generate-services`, {
      language
    })
  }

  // Génération en masse pour une propriété
  async generateAllContent(propertyId: string, language: string = 'fr') {
    return apiClient.post<{
      title: GeneratedContent
      description: GeneratedContent
      amenities: GeneratedContent
      location: GeneratedContent
      activities: GeneratedContent
      services: GeneratedContent
    }>(`/api/properties/${propertyId}/ai/generate-all`, {
      language
    })
  }

  // Vérification du contenu généré
  async checkContentQuality(content: string, contentType: string) {
    return apiClient.post<{
      score: number
      suggestions: string[]
      issues: string[]
    }>('/api/ai/check-quality', {
      content,
      contentType
    })
  }
}

export const aiService = new AIService()