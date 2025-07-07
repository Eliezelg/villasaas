import frCommon from './locales/fr/common.json';
import frBooking from './locales/fr/booking.json';
import frEmails from './locales/fr/emails.json';
import enCommon from './locales/en/common.json';
import enBooking from './locales/en/booking.json';
import enEmails from './locales/en/emails.json';

export const locales = ['fr', 'en'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'fr';

export const messages = {
  fr: {
    common: frCommon,
    booking: frBooking,
    emails: frEmails,
  },
  en: {
    common: enCommon,
    booking: enBooking,
    emails: enEmails,
  },
} as const;

export type Messages = typeof messages;
export type MessageKeys = keyof Messages[Locale];

// Helper functions
export function getLocaleFromAcceptLanguage(acceptLanguage: string): Locale {
  const languages = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase());
  
  for (const lang of languages) {
    const locale = lang.split('-')[0];
    if (locales.includes(locale as Locale)) {
      return locale as Locale;
    }
  }
  
  return defaultLocale;
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }
  
  return null;
}

export function formatCurrency(amount: number, locale: Locale, currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

// Pluralization rules
export function pluralize(count: number, locale: Locale, key: string): string {
  // Simple pluralization for now, can be extended with more complex rules
  if (locale === 'fr') {
    return count <= 1 ? `${key}Singular` : `${key}Plural`;
  }
  return count === 1 ? `${key}Singular` : `${key}Plural`;
}