export type PropertyType = 
  | 'APARTMENT'
  | 'HOUSE'
  | 'VILLA'
  | 'STUDIO'
  | 'LOFT'
  | 'CHALET'
  | 'BUNGALOW'
  | 'MOBILE_HOME'
  | 'BOAT'
  | 'OTHER';

export type PropertyStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Property {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  surfaceArea?: number;
  description: Record<string, string>;
  basePrice: number;
  weekendPremium?: number;
  cleaningFee?: number;
  securityDeposit?: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  checkInDays: number[];
  instantBooking: boolean;
  amenities: Record<string, boolean>;
  atmosphere: Record<string, number>;
  proximity: Record<string, number>;
  images?: PropertyImage[];
  _count?: {
    bookings: number;
    images: number;
  };
}

export interface PropertyImage {
  id: string;
  url: string;
  alt?: string;
  caption?: Record<string, string>;
  order: number;
  isPrimary: boolean;
}

export interface CreatePropertyData {
  name: string;
  propertyType: PropertyType;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  surfaceArea?: number;
  description: Record<string, string>;
  basePrice: number;
  weekendPremium?: number;
  cleaningFee?: number;
  securityDeposit?: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  instantBooking: boolean;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {
  status?: PropertyStatus;
}