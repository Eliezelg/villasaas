import frCommon from './locales/fr/common.json';
import frBooking from './locales/fr/booking.json';
import frEmails from './locales/fr/emails.json';
import enCommon from './locales/en/common.json';
import enBooking from './locales/en/booking.json';
import enEmails from './locales/en/emails.json';
export const locales = ['fr', 'en'];
export const defaultLocale = 'fr';
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
};
// Helper functions
export function getLocaleFromAcceptLanguage(acceptLanguage) {
    const languages = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase());
    for (const lang of languages) {
        const locale = lang.split('-')[0];
        if (locales.includes(locale)) {
            return locale;
        }
    }
    return defaultLocale;
}
export function getLocaleFromPath(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    if (firstSegment && locales.includes(firstSegment)) {
        return firstSegment;
    }
    return null;
}
export function formatCurrency(amount, locale, currency = 'EUR') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
}
export function formatDate(date, locale, options) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
}
export function formatNumber(value, locale, options) {
    return new Intl.NumberFormat(locale, options).format(value);
}
// Pluralization rules
export function pluralize(count, locale, key) {
    // Simple pluralization for now, can be extended with more complex rules
    if (locale === 'fr') {
        return count <= 1 ? `${key}Singular` : `${key}Plural`;
    }
    return count === 1 ? `${key}Singular` : `${key}Plural`;
}
