import { z } from 'zod';
import { 
  OptionCategory, 
  OptionPricingType, 
  OptionPricingPeriod,
  DepositType,
  DepositDueDate,
  TouristTaxType,
  TouristTaxPeriod,
  FeeType
} from '@prisma/client';

// Schemas pour les options de réservation
export const createBookingOptionSchema = z.object({
  name: z.record(z.string()), // Multilingue
  description: z.record(z.string()).optional(),
  category: z.nativeEnum(OptionCategory),
  pricingType: z.nativeEnum(OptionPricingType),
  pricePerUnit: z.number().positive(),
  pricingPeriod: z.nativeEnum(OptionPricingPeriod),
  isMandatory: z.boolean().default(false),
  minQuantity: z.number().int().min(0).default(0),
  maxQuantity: z.number().int().positive().optional(),
  minGuests: z.number().int().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  minNights: z.number().int().positive().optional(),
  availableSeasons: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0)
});

export const updateBookingOptionSchema = createBookingOptionSchema.partial();

export const propertyBookingOptionSchema = z.object({
  propertyId: z.string().min(1),
  optionId: z.string().min(1),
  customPrice: z.number().positive().optional(),
  customMinQuantity: z.number().int().min(0).optional(),
  customMaxQuantity: z.number().int().positive().optional(),
  isEnabled: z.boolean().default(true)
});

export const bookingSelectedOptionSchema = z.object({
  optionId: z.string().min(1),
  quantity: z.number().int().positive()
});

// Schemas pour la configuration des paiements
export const paymentConfigurationSchema = z.object({
  depositType: z.nativeEnum(DepositType),
  depositValue: z.number().positive(),
  depositDueDate: z.nativeEnum(DepositDueDate),
  depositDueDays: z.number().int().positive().optional(),
  
  touristTaxEnabled: z.boolean().default(false),
  touristTaxType: z.nativeEnum(TouristTaxType).optional(),
  touristTaxAdultPrice: z.number().positive().optional(),
  touristTaxChildPrice: z.number().positive().optional(),
  touristTaxChildAge: z.number().int().positive().optional(),
  touristTaxPeriod: z.nativeEnum(TouristTaxPeriod).optional(),
  touristTaxMaxNights: z.number().int().positive().optional(),
  
  serviceFeeEnabled: z.boolean().default(false),
  serviceFeeType: z.nativeEnum(FeeType).optional(),
  serviceFeeValue: z.number().positive().optional(),
  
  allowPartialPayment: z.boolean().default(true),
  balanceDueDays: z.number().int().positive().default(7)
});

export const updatePaymentConfigurationSchema = paymentConfigurationSchema.partial();

// Types dérivés
export type CreateBookingOption = z.infer<typeof createBookingOptionSchema>;
export type UpdateBookingOption = z.infer<typeof updateBookingOptionSchema>;
export type PropertyBookingOption = z.infer<typeof propertyBookingOptionSchema>;
export type BookingSelectedOption = z.infer<typeof bookingSelectedOptionSchema>;
export type PaymentConfiguration = z.infer<typeof paymentConfigurationSchema>;
export type UpdatePaymentConfiguration = z.infer<typeof updatePaymentConfigurationSchema>;

// Helpers pour calculer le prix des options
export function calculateOptionPrice(
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

// Helper pour calculer la taxe de séjour
export function calculateTouristTax(
  config: {
    touristTaxType?: TouristTaxType | null;
    touristTaxAdultPrice?: number | null;
    touristTaxChildPrice?: number | null;
    touristTaxChildAge?: number | null;
    touristTaxPeriod?: TouristTaxPeriod | null;
    touristTaxMaxNights?: number | null;
  },
  adults: number,
  children: number,
  nights: number,
  accommodationPrice?: number
): number {
  if (!config.touristTaxType) return 0;
  
  let taxableNights = nights;
  if (config.touristTaxMaxNights && nights > config.touristTaxMaxNights) {
    taxableNights = config.touristTaxMaxNights;
  }
  
  let tax = 0;
  
  switch (config.touristTaxType) {
    case 'PER_PERSON_PER_NIGHT':
      const adultTax = (config.touristTaxAdultPrice || 0) * adults;
      const childTax = (config.touristTaxChildPrice || 0) * children;
      tax = adultTax + childTax;
      
      if (config.touristTaxPeriod === 'PER_NIGHT') {
        tax *= taxableNights;
      }
      break;
      
    case 'PERCENTAGE_OF_ACCOMMODATION':
      if (accommodationPrice && config.touristTaxAdultPrice) {
        tax = (accommodationPrice * config.touristTaxAdultPrice) / 100;
      }
      break;
      
    case 'FIXED_PER_STAY':
      tax = config.touristTaxAdultPrice || 0;
      break;
      
    case 'TIERED_BY_PROPERTY_TYPE':
      // Logique spécifique selon le type de propriété
      // À implémenter selon les besoins
      tax = (config.touristTaxAdultPrice || 0) * (adults + children);
      if (config.touristTaxPeriod === 'PER_NIGHT') {
        tax *= taxableNights;
      }
      break;
  }
  
  return tax;
}

// Helper pour calculer l'acompte
export function calculateDeposit(
  config: {
    depositType: DepositType;
    depositValue: number;
  },
  totalAmount: number
): number {
  if (config.depositType === 'PERCENTAGE') {
    return (totalAmount * config.depositValue) / 100;
  }
  return config.depositValue;
}