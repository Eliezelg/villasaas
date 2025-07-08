import { Locale } from '@villa-saas/i18n';
export declare class I18nEmailService {
    private locale;
    constructor(locale?: Locale | string);
    private validateLocale;
    /**
     * Get a translated string with interpolation
     */
    t(key: string, params?: Record<string, any>): string;
    /**
     * Format currency based on locale
     */
    formatCurrency(amount: number, currency?: string): string;
    /**
     * Format date based on locale
     */
    formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
    /**
     * Get locale
     */
    getLocale(): Locale;
    /**
     * Set locale
     */
    setLocale(locale: Locale | string): void;
}
/**
 * Extract locale from various sources
 */
export declare function extractLocale(headers?: Record<string, any>, defaultValue?: Locale): Locale;
//# sourceMappingURL=i18n-email.service.d.ts.map