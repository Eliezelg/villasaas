"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nEmailService = void 0;
exports.extractLocale = extractLocale;
const i18n_1 = require("@villa-saas/i18n");
class I18nEmailService {
    locale;
    constructor(locale = i18n_1.defaultLocale) {
        this.locale = this.validateLocale(locale);
    }
    validateLocale(locale) {
        if (locale === 'fr' || locale === 'en') {
            return locale;
        }
        return i18n_1.defaultLocale;
    }
    /**
     * Get a translated string with interpolation
     */
    t(key, params) {
        const keys = key.split('.');
        let value = i18n_1.messages[this.locale];
        // Navigate through the nested object
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                // Fallback to default locale if key not found
                value = i18n_1.messages[i18n_1.defaultLocale];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    }
                    else {
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
    formatCurrency(amount, currency = 'EUR') {
        return new Intl.NumberFormat(this.locale, {
            style: 'currency',
            currency,
        }).format(amount);
    }
    /**
     * Format date based on locale
     */
    formatDate(date, options) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return new Intl.DateTimeFormat(this.locale, options || defaultOptions).format(dateObj);
    }
    /**
     * Get locale
     */
    getLocale() {
        return this.locale;
    }
    /**
     * Set locale
     */
    setLocale(locale) {
        this.locale = this.validateLocale(locale);
    }
}
exports.I18nEmailService = I18nEmailService;
/**
 * Extract locale from various sources
 */
function extractLocale(headers, defaultValue = i18n_1.defaultLocale) {
    if (!headers)
        return defaultValue;
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
            .map((lang) => lang.split(';')[0]?.trim().toLowerCase());
        for (const lang of languages) {
            const locale = lang.split('-')[0];
            if (locale === 'fr' || locale === 'en') {
                return locale;
            }
        }
    }
    return defaultValue;
}
//# sourceMappingURL=i18n-email.service.js.map