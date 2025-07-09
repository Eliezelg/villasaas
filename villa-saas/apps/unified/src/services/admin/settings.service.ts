import { apiClient } from '@/lib/api-client'

export interface CompanySettings {
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  website: string
  logo?: string
}

export interface PaymentSettings {
  stripeConnected: boolean
  stripeAccountId?: string
  commissionRate: number
  minimumPayout: number
  payoutDelay: number
  automaticPayouts: boolean
  bankAccount?: {
    iban: string
    bic: string
    accountHolder: string
  }
}

export interface EmailSettings {
  sender: {
    name: string
    email: string
  }
  templates: {
    bookingConfirmation: boolean
    bookingReminder: boolean
    paymentReceived: boolean
    reviewRequest: boolean
  }
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
  sessionTimeout: number
  ipWhitelist: string[]
}

export interface PreferencesSettings {
  language: string
  timezone: string
  currency: string
  dateFormat: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

class SettingsService {
  // Company Settings
  async getCompanySettings() {
    return apiClient.get<CompanySettings>('/api/settings/company')
  }

  async updateCompanySettings(data: CompanySettings) {
    return apiClient.put<CompanySettings>('/api/settings/company', data)
  }

  // Payment Settings
  async getPaymentSettings() {
    return apiClient.get<PaymentSettings>('/api/settings/payment')
  }

  async updatePaymentSettings(data: PaymentSettings) {
    return apiClient.put<PaymentSettings>('/api/settings/payment', data)
  }

  async createStripeConnectLink() {
    return apiClient.post<{ url: string }>('/api/settings/payment/stripe-connect')
  }

  // Email Settings
  async getEmailSettings() {
    return apiClient.get<EmailSettings>('/api/settings/email')
  }

  async updateEmailSettings(data: EmailSettings) {
    return apiClient.put<EmailSettings>('/api/settings/email', data)
  }

  // Security Settings
  async getSecuritySettings() {
    return apiClient.get<SecuritySettings>('/api/settings/security')
  }

  async updateSecuritySettings(data: SecuritySettings) {
    return apiClient.put<SecuritySettings>('/api/settings/security', data)
  }

  async enable2FA() {
    return apiClient.post<{ qrCode: string; secret: string }>('/api/settings/security/2fa/enable')
  }

  async disable2FA() {
    return apiClient.post('/api/settings/security/2fa/disable')
  }

  // Preferences
  async getPreferences() {
    return apiClient.get<PreferencesSettings>('/api/settings/preferences')
  }

  async updatePreferences(data: PreferencesSettings) {
    return apiClient.put<PreferencesSettings>('/api/settings/preferences', data)
  }
}

export const settingsService = new SettingsService()