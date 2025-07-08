export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
}

export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  customDomain?: string;
  settings?: any;
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