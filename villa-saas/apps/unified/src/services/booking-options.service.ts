import { apiClient } from '@/lib/api-client';
import type { 
  BookingOption, 
  PropertyBookingOption,
  PaymentConfiguration,
  OptionCategory,
  OptionPricingType,
  OptionPricingPeriod 
} from '@villa-saas/database';

export interface BookingOptionWithProperties extends BookingOption {
  properties: PropertyBookingOption[];
}

export interface CreateBookingOption {
  name: Record<string, string>;
  description?: Record<string, string>;
  category: OptionCategory;
  pricingType: OptionPricingType;
  pricePerUnit: number;
  pricingPeriod: OptionPricingPeriod;
  isMandatory?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  minGuests?: number;
  maxGuests?: number;
  minNights?: number;
  availableSeasons?: string[];
  isActive?: boolean;
  order?: number;
}

export interface UpdateBookingOption extends Partial<CreateBookingOption> {}

export interface PropertyOptionConfig {
  customPrice?: number;
  customMinQuantity?: number;
  customMaxQuantity?: number;
  isEnabled?: boolean;
}

class BookingOptionsService {
  // ==================== BOOKING OPTIONS ====================
  
  async getAllOptions() {
    const response = await apiClient.get<{ data: BookingOption[] }>('/api/booking-options');
    
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: [], error: response.error };
  }

  async getOption(id: string) {
    const response = await apiClient.get<{ data: BookingOptionWithProperties }>(`/api/booking-options/${id}`);
    
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: null, error: response.error };
  }

  async createOption(data: CreateBookingOption) {
    const response = await apiClient.post<{ data: BookingOption }>('/api/booking-options', data);
    
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: null, error: response.error };
  }

  async updateOption(id: string, data: UpdateBookingOption) {
    const response = await apiClient.patch<{ data: BookingOption }>(`/api/booking-options/${id}`, data);
    
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: null, error: response.error };
  }

  async deleteOption(id: string) {
    return apiClient.delete(`/api/booking-options/${id}`);
  }

  // ==================== PROPERTY BOOKING OPTIONS ====================
  
  async getPropertyOptions(propertyId: string) {
    const response = await apiClient.get<{ data: BookingOptionWithProperties[] }>(
      `/api/properties/${propertyId}/booking-options`
    );
    
    // Extraire le tableau data de la réponse
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: [], error: response.error };
  }

  async configurePropertyOption(
    propertyId: string, 
    optionId: string, 
    config: PropertyOptionConfig
  ) {
    const response = await apiClient.put<{ data: PropertyBookingOption }>(
      `/api/properties/${propertyId}/booking-options/${optionId}`,
      config
    );
    
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: null, error: response.error };
  }

  async disablePropertyOption(propertyId: string, optionId: string) {
    return apiClient.delete(
      `/api/properties/${propertyId}/booking-options/${optionId}`
    );
  }

  // ==================== PAYMENT CONFIGURATION ====================
  
  async getPaymentConfig() {
    const response = await apiClient.get<{ data: PaymentConfiguration }>('/api/payment-configuration');
    
    // Extraire la configuration de la réponse
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: null, error: response.error };
  }

  async updatePaymentConfig(data: Partial<PaymentConfiguration>) {
    const response = await apiClient.put<{ data: PaymentConfiguration }>('/api/payment-configuration', data);
    
    // Extraire la configuration de la réponse
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: null, error: response.error };
  }

  async patchPaymentConfig(data: Partial<PaymentConfiguration>) {
    const response = await apiClient.patch<{ data: PaymentConfiguration }>('/api/payment-configuration', data);
    
    // Extraire la configuration de la réponse
    if (response.data && response.data.data) {
      return { data: response.data.data, error: response.error };
    }
    
    return { data: null, error: response.error };
  }

  // ==================== HELPERS ====================
  
  calculateOptionPrice(
    option: {
      pricingType: OptionPricingType;
      pricePerUnit: number;
      pricingPeriod: OptionPricingPeriod;
    },
    quantity: number,
    guests: number,
    nights: number
  ): number {
    let basePrice = option.pricePerUnit;
    
    // Appliquer le type de prix
    switch (option.pricingType) {
      case 'PER_PERSON':
        basePrice *= guests;
        break;
      case 'PER_GROUP':
      case 'FIXED':
        // Prix déjà correct
        break;
    }
    
    // Appliquer la quantité
    basePrice *= quantity;
    
    // Appliquer la période
    if (option.pricingPeriod === 'PER_DAY') {
      basePrice *= nights;
    }
    
    return basePrice;
  }

  formatOptionCategory(category: OptionCategory): string {
    const categories: Record<OptionCategory, string> = {
      CLEANING: 'Ménage',
      CATERING: 'Restauration',
      TRANSPORT: 'Transport',
      ACTIVITIES: 'Activités',
      EQUIPMENT: 'Équipement',
      WELLNESS: 'Bien-être',
      CHILDCARE: 'Enfants',
      PET: 'Animaux',
      COMFORT: 'Confort',
      OTHER: 'Autre'
    };
    return categories[category] || category;
  }

  formatPricingType(type: OptionPricingType): string {
    const types: Record<OptionPricingType, string> = {
      PER_PERSON: 'Par personne',
      PER_GROUP: 'Par groupe',
      FIXED: 'Prix fixe'
    };
    return types[type] || type;
  }

  formatPricingPeriod(period: OptionPricingPeriod): string {
    const periods: Record<OptionPricingPeriod, string> = {
      PER_DAY: 'Par jour',
      PER_STAY: 'Par séjour'
    };
    return periods[period] || period;
  }
}

export const bookingOptionsService = new BookingOptionsService();