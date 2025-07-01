// Re-export database types
export type {
  User,
  Tenant,
  Property,
  Booking,
  UserRole,
  PropertyType,
  PropertyStatus,
  BookingStatus,
  PaymentStatus,
} from '@villa-saas/database';

// API Types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tenant: {
    id: string;
    name: string;
    subdomain?: string | null;
  };
}

// Property Types
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
  minNights?: number;
  checkInTime?: string;
  checkOutTime?: string;
  instantBooking?: boolean;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {
  status?: PropertyStatus;
}