export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  onboardingCompleted?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  subdomain?: string;
  customDomain?: string;
  stripeAccountId?: string;
  stripeAccountStatus?: string;
  stripeDetailsSubmitted: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  settings?: {
    description?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    website?: string;
    commissionRate?: number;
    minimumPayout?: number;
    payoutDelay?: number;
    automaticPayouts?: boolean;
    [key: string]: any;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

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

export interface AuthResponse extends AuthTokens {
  user: User;
  tenant: Tenant;
}