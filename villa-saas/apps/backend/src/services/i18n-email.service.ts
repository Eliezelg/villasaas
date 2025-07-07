import { messages, Locale, defaultLocale } from '@villa-saas/i18n';

export class I18nEmailService {
  private locale: Locale;

  constructor(locale: Locale | string = defaultLocale) {
    this.locale = this.validateLocale(locale);
  }

  private validateLocale(locale: string): Locale {
    if (locale === 'fr' || locale === 'en') {
      return locale;
    }
    return defaultLocale;
  }

  /**
   * Get a translated string with interpolation
   */
  t(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = messages[this.locale];

    // Navigate through the nested object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to default locale if key not found
        value = messages[defaultLocale];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return the key itself if not found
          }
        }
        break;
      }
    }

    // If it's not a string, return the key
    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      let result = value;
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
      return result;
    }

    return value;
  }

  /**
   * Format currency based on locale
   */
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format date based on locale
   */
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat(this.locale, options || defaultOptions).format(dateObj);
  }

  /**
   * Get locale
   */
  getLocale(): Locale {
    return this.locale;
  }

  /**
   * Set locale
   */
  setLocale(locale: Locale | string): void {
    this.locale = this.validateLocale(locale);
  }
}

/**
 * Extract locale from various sources
 */
export function extractLocale(
  headers?: Record<string, any>,
  defaultValue: Locale = defaultLocale
): Locale {
  if (!headers) return defaultValue;

  // Check x-locale header first
  if (headers['x-locale']) {
    const locale = headers['x-locale'];
    if (locale === 'fr' || locale === 'en') {
      return locale;
    }
  }

  // Check accept-language header
  if (headers['accept-language']) {
    const acceptLanguage = headers['accept-language'];
    const languages = acceptLanguage
      .split(',')
      .map((lang: string) => lang.split(';')[0].trim().toLowerCase());

    for (const lang of languages) {
      const locale = lang.split('-')[0];
      if (locale === 'fr' || locale === 'en') {
        return locale as Locale;
      }
    }
  }

  return defaultValue;
}