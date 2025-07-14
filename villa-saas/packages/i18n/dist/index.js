"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = exports.localeNames = exports.defaultLocale = exports.locales = void 0;
exports.getLocaleFromAcceptLanguage = getLocaleFromAcceptLanguage;
exports.getLocaleFromPath = getLocaleFromPath;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.formatNumber = formatNumber;
exports.pluralize = pluralize;
// French
const common_json_1 = __importDefault(require("./locales/fr/common.json"));
const booking_json_1 = __importDefault(require("./locales/fr/booking.json"));
const emails_json_1 = __importDefault(require("./locales/fr/emails.json"));
const admin_json_1 = __importDefault(require("./locales/fr/admin.json"));
// English
const common_json_2 = __importDefault(require("./locales/en/common.json"));
const booking_json_2 = __importDefault(require("./locales/en/booking.json"));
const emails_json_2 = __importDefault(require("./locales/en/emails.json"));
const admin_json_2 = __importDefault(require("./locales/en/admin.json"));
// Spanish
const common_json_3 = __importDefault(require("./locales/es/common.json"));
const booking_json_3 = __importDefault(require("./locales/es/booking.json"));
const emails_json_3 = __importDefault(require("./locales/es/emails.json"));
const admin_json_3 = __importDefault(require("./locales/es/admin.json"));
// German
const common_json_4 = __importDefault(require("./locales/de/common.json"));
const booking_json_4 = __importDefault(require("./locales/de/booking.json"));
const emails_json_4 = __importDefault(require("./locales/de/emails.json"));
const admin_json_4 = __importDefault(require("./locales/de/admin.json"));
// Italian
const common_json_5 = __importDefault(require("./locales/it/common.json"));
const booking_json_5 = __importDefault(require("./locales/it/booking.json"));
const emails_json_5 = __importDefault(require("./locales/it/emails.json"));
const admin_json_5 = __importDefault(require("./locales/it/admin.json"));
// Portuguese
const common_json_6 = __importDefault(require("./locales/pt/common.json"));
const booking_json_6 = __importDefault(require("./locales/pt/booking.json"));
const emails_json_6 = __importDefault(require("./locales/pt/emails.json"));
const admin_json_6 = __importDefault(require("./locales/pt/admin.json"));
// Dutch
const common_json_7 = __importDefault(require("./locales/nl/common.json"));
const booking_json_7 = __importDefault(require("./locales/nl/booking.json"));
const emails_json_7 = __importDefault(require("./locales/nl/emails.json"));
const admin_json_7 = __importDefault(require("./locales/nl/admin.json"));
// Russian
const common_json_8 = __importDefault(require("./locales/ru/common.json"));
const booking_json_8 = __importDefault(require("./locales/ru/booking.json"));
const emails_json_8 = __importDefault(require("./locales/ru/emails.json"));
const admin_json_8 = __importDefault(require("./locales/ru/admin.json"));
// Chinese
const common_json_9 = __importDefault(require("./locales/zh/common.json"));
const booking_json_9 = __importDefault(require("./locales/zh/booking.json"));
const emails_json_9 = __importDefault(require("./locales/zh/emails.json"));
const admin_json_9 = __importDefault(require("./locales/zh/admin.json"));
// Japanese
const common_json_10 = __importDefault(require("./locales/ja/common.json"));
const booking_json_10 = __importDefault(require("./locales/ja/booking.json"));
const emails_json_10 = __importDefault(require("./locales/ja/emails.json"));
const admin_json_10 = __importDefault(require("./locales/ja/admin.json"));
// Arabic
const common_json_11 = __importDefault(require("./locales/ar/common.json"));
const booking_json_11 = __importDefault(require("./locales/ar/booking.json"));
const emails_json_11 = __importDefault(require("./locales/ar/emails.json"));
const admin_json_11 = __importDefault(require("./locales/ar/admin.json"));
// Hebrew
const common_json_12 = __importDefault(require("./locales/he/common.json"));
const booking_json_12 = __importDefault(require("./locales/he/booking.json"));
const emails_json_12 = __importDefault(require("./locales/he/emails.json"));
const admin_json_12 = __importDefault(require("./locales/he/admin.json"));
// Hindi
const common_json_13 = __importDefault(require("./locales/hi/common.json"));
const booking_json_13 = __importDefault(require("./locales/hi/booking.json"));
const emails_json_13 = __importDefault(require("./locales/hi/emails.json"));
const admin_json_13 = __importDefault(require("./locales/hi/admin.json"));
// Turkish
const common_json_14 = __importDefault(require("./locales/tr/common.json"));
const booking_json_14 = __importDefault(require("./locales/tr/booking.json"));
const emails_json_14 = __importDefault(require("./locales/tr/emails.json"));
const admin_json_14 = __importDefault(require("./locales/tr/admin.json"));
// Polish
const common_json_15 = __importDefault(require("./locales/pl/common.json"));
const booking_json_15 = __importDefault(require("./locales/pl/booking.json"));
const emails_json_15 = __importDefault(require("./locales/pl/emails.json"));
const admin_json_15 = __importDefault(require("./locales/pl/admin.json"));
exports.locales = [
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
];
exports.defaultLocale = 'fr';
// Language display names
exports.localeNames = {
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
exports.messages = {
    fr: {
        common: common_json_1.default,
        booking: booking_json_1.default,
        emails: emails_json_1.default,
        admin: admin_json_1.default,
    },
    en: {
        common: common_json_2.default,
        booking: booking_json_2.default,
        emails: emails_json_2.default,
        admin: admin_json_2.default,
    },
    es: {
        common: common_json_3.default,
        booking: booking_json_3.default,
        emails: emails_json_3.default,
        admin: admin_json_3.default,
    },
    de: {
        common: common_json_4.default,
        booking: booking_json_4.default,
        emails: emails_json_4.default,
        admin: admin_json_4.default,
    },
    it: {
        common: common_json_5.default,
        booking: booking_json_5.default,
        emails: emails_json_5.default,
        admin: admin_json_5.default,
    },
    pt: {
        common: common_json_6.default,
        booking: booking_json_6.default,
        emails: emails_json_6.default,
        admin: admin_json_6.default,
    },
    nl: {
        common: common_json_7.default,
        booking: booking_json_7.default,
        emails: emails_json_7.default,
        admin: admin_json_7.default,
    },
    ru: {
        common: common_json_8.default,
        booking: booking_json_8.default,
        emails: emails_json_8.default,
        admin: admin_json_8.default,
    },
    zh: {
        common: common_json_9.default,
        booking: booking_json_9.default,
        emails: emails_json_9.default,
        admin: admin_json_9.default,
    },
    ja: {
        common: common_json_10.default,
        booking: booking_json_10.default,
        emails: emails_json_10.default,
        admin: admin_json_10.default,
    },
    ar: {
        common: common_json_11.default,
        booking: booking_json_11.default,
        emails: emails_json_11.default,
        admin: admin_json_11.default,
    },
    he: {
        common: common_json_12.default,
        booking: booking_json_12.default,
        emails: emails_json_12.default,
        admin: admin_json_12.default,
    },
    hi: {
        common: common_json_13.default,
        booking: booking_json_13.default,
        emails: emails_json_13.default,
        admin: admin_json_13.default,
    },
    tr: {
        common: common_json_14.default,
        booking: booking_json_14.default,
        emails: emails_json_14.default,
        admin: admin_json_14.default,
    },
    pl: {
        common: common_json_15.default,
        booking: booking_json_15.default,
        emails: emails_json_15.default,
        admin: admin_json_15.default,
    },
};
// Helper functions
function getLocaleFromAcceptLanguage(acceptLanguage) {
    const languages = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase());
    for (const lang of languages) {
        const locale = lang.split('-')[0];
        if (exports.locales.includes(locale)) {
            return locale;
        }
    }
    return exports.defaultLocale;
}
function getLocaleFromPath(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    if (firstSegment && exports.locales.includes(firstSegment)) {
        return firstSegment;
    }
    return null;
}
function formatCurrency(amount, locale, currency = 'EUR') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
}
function formatDate(date, locale, options) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
}
function formatNumber(value, locale, options) {
    return new Intl.NumberFormat(locale, options).format(value);
}
// Pluralization rules
function pluralize(count, locale, key) {
    // Simple pluralization for now, can be extended with more complex rules
    if (locale === 'fr') {
        return count <= 1 ? `${key}Singular` : `${key}Plural`;
    }
    return count === 1 ? `${key}Singular` : `${key}Plural`;
}
