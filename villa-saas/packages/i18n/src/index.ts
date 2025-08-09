// French
import frCommon from './locales/fr/common.json';
import frBooking from './locales/fr/booking.json';
import frEmails from './locales/fr/emails.json';
import frAdmin from './locales/fr/admin.json';
// English
import enCommon from './locales/en/common.json';
import enBooking from './locales/en/booking.json';
import enEmails from './locales/en/emails.json';
import enAdmin from './locales/en/admin.json';
// Spanish
import esCommon from './locales/es/common.json';
import esBooking from './locales/es/booking.json';
import esEmails from './locales/es/emails.json';
import esAdmin from './locales/es/admin.json';
// German
import deCommon from './locales/de/common.json';
import deBooking from './locales/de/booking.json';
import deEmails from './locales/de/emails.json';
import deAdmin from './locales/de/admin.json';
// Italian
import itCommon from './locales/it/common.json';
import itBooking from './locales/it/booking.json';
import itEmails from './locales/it/emails.json';
import itAdmin from './locales/it/admin.json';
// Portuguese
import ptCommon from './locales/pt/common.json';
import ptBooking from './locales/pt/booking.json';
import ptEmails from './locales/pt/emails.json';
import ptAdmin from './locales/pt/admin.json';
// Dutch
import nlCommon from './locales/nl/common.json';
import nlBooking from './locales/nl/booking.json';
import nlEmails from './locales/nl/emails.json';
import nlAdmin from './locales/nl/admin.json';
// Russian
import ruCommon from './locales/ru/common.json';
import ruBooking from './locales/ru/booking.json';
import ruEmails from './locales/ru/emails.json';
import ruAdmin from './locales/ru/admin.json';
// Chinese
import zhCommon from './locales/zh/common.json';
import zhBooking from './locales/zh/booking.json';
import zhEmails from './locales/zh/emails.json';
import zhAdmin from './locales/zh/admin.json';
// Japanese
import jaCommon from './locales/ja/common.json';
import jaBooking from './locales/ja/booking.json';
import jaEmails from './locales/ja/emails.json';
import jaAdmin from './locales/ja/admin.json';
// Arabic
import arCommon from './locales/ar/common.json';
import arBooking from './locales/ar/booking.json';
import arEmails from './locales/ar/emails.json';
import arAdmin from './locales/ar/admin.json';
// Hebrew
import heCommon from './locales/he/common.json';
import heBooking from './locales/he/booking.json';
import heEmails from './locales/he/emails.json';
import heAdmin from './locales/he/admin.json';
// Hindi
import hiCommon from './locales/hi/common.json';
import hiBooking from './locales/hi/booking.json';
import hiEmails from './locales/hi/emails.json';
import hiAdmin from './locales/hi/admin.json';
// Turkish
import trCommon from './locales/tr/common.json';
import trBooking from './locales/tr/booking.json';
import trEmails from './locales/tr/emails.json';
import trAdmin from './locales/tr/admin.json';
// Polish
import plCommon from './locales/pl/common.json';
import plBooking from './locales/pl/booking.json';
import plEmails from './locales/pl/emails.json';
import plAdmin from './locales/pl/admin.json';

export const locales = [
  'fr', // Français
  'en', // English
  'es', // Español
  'de', // Deutsch
  'it', // Italiano
  'pt', // Português
  'nl', // Nederlands
  'ru', // Русский
  'zh', // 中文
  'ja', // 日本語
  'ar', // العربية
  'he', // עברית
  'hi', // हिन्दी
  'tr', // Türkçe
  'pl', // Polski
] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'fr';

// Language display names
export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ar: 'العربية',
  he: 'עברית',
  hi: 'हिन्दी',
  tr: 'Türkçe',
  pl: 'Polski',
};

export const messages = {
  fr: {
    common: frCommon,
    booking: frBooking,
    emails: frEmails,
    admin: frAdmin,
  },
  en: {
    common: enCommon,
    booking: enBooking,
    emails: enEmails,
    admin: enAdmin,
  },
  es: {
    common: esCommon,
    booking: esBooking,
    emails: esEmails,
    admin: esAdmin,
  },
  de: {
    common: deCommon,
    booking: deBooking,
    emails: deEmails,
    admin: deAdmin,
  },
  it: {
    common: itCommon,
    booking: itBooking,
    emails: itEmails,
    admin: itAdmin,
  },
  pt: {
    common: ptCommon,
    booking: ptBooking,
    emails: ptEmails,
    admin: ptAdmin,
  },
  nl: {
    common: nlCommon,
    booking: nlBooking,
    emails: nlEmails,
    admin: nlAdmin,
  },
  ru: {
    common: ruCommon,
    booking: ruBooking,
    emails: ruEmails,
    admin: ruAdmin,
  },
  zh: {
    common: zhCommon,
    booking: zhBooking,
    emails: zhEmails,
    admin: zhAdmin,
  },
  ja: {
    common: jaCommon,
    booking: jaBooking,
    emails: jaEmails,
    admin: jaAdmin,
  },
  ar: {
    common: arCommon,
    booking: arBooking,
    emails: arEmails,
    admin: arAdmin,
  },
  he: {
    common: heCommon,
    booking: heBooking,
    emails: heEmails,
    admin: heAdmin,
  },
  hi: {
    common: hiCommon,
    booking: hiBooking,
    emails: hiEmails,
    admin: hiAdmin,
  },
  tr: {
    common: trCommon,
    booking: trBooking,
    emails: trEmails,
    admin: trAdmin,
  },
  pl: {
    common: plCommon,
    booking: plBooking,
    emails: plEmails,
    admin: plAdmin,
  },
} as const;

export type Messages = typeof messages;
export type MessageKeys = keyof Messages[Locale];

// Helper functions
export function getLocaleFromAcceptLanguage(acceptLanguage: string): Locale {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const parts = lang.split(';');
      return parts[0] ? parts[0].trim().toLowerCase() : '';
    })
    .filter(lang => lang !== '');
  
  for (const lang of languages) {
    const localeParts = lang.split('-');
    const locale = localeParts[0];
    if (locale && locales.includes(locale as Locale)) {
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