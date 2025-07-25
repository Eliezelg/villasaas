"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingConfirmationEmail = void 0;
const components_1 = require("@react-email/components");
const React = __importStar(require("react"));
const base_email_1 = require("./base-email");
const i18n_email_service_1 = require("../../services/i18n-email.service");
const BookingConfirmationEmail = ({ locale, bookingReference, guestName, guestEmail, propertyName, checkIn, checkOut, guests, totalAmount, currency = 'EUR', propertyImage, tenantName = 'Villa Booking', tenantLogo, }) => {
    const i18n = new i18n_email_service_1.I18nEmailService(locale);
    const previewText = i18n.t('emails.bookingConfirmation.subject', { reference: bookingReference });
    // URL de consultation avec email et code
    const bookingUrl = `${process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'}/${locale}/my-booking?email=${encodeURIComponent(guestEmail)}&reference=${bookingReference}`;
    return (React.createElement(base_email_1.BaseEmail, { previewText: previewText, tenantName: tenantName, tenantLogo: tenantLogo, footer: i18n.t('emails.bookingConfirmation.footer', { tenantName }) },
        React.createElement(components_1.Heading, { style: base_email_1.styles.h1 }, i18n.t('emails.bookingConfirmation.title')),
        React.createElement(components_1.Text, { style: base_email_1.styles.text }, i18n.t('emails.bookingConfirmation.greeting', { guestName })),
        React.createElement(components_1.Text, { style: base_email_1.styles.text }, i18n.t('emails.bookingConfirmation.intro')),
        React.createElement(components_1.Section, { style: codeSection },
            React.createElement(components_1.Text, { style: codeLabel }, "Votre code de r\u00E9servation :"),
            React.createElement(components_1.Text, { style: codeValue }, bookingReference),
            React.createElement(components_1.Text, { style: codeHelp }, "Utilisez ce code avec votre email pour acc\u00E9der \u00E0 votre r\u00E9servation")),
        propertyImage && (React.createElement(components_1.Img, { src: propertyImage, width: "600", height: "400", alt: propertyName, style: propertyImageStyle })),
        React.createElement(components_1.Section, { style: base_email_1.styles.infoSection },
            React.createElement(components_1.Text, { style: base_email_1.styles.infoTitle }, i18n.t('emails.bookingConfirmation.details.title')),
            React.createElement(components_1.Hr, { style: base_email_1.styles.hr }),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingConfirmation.details.reference'),
                    ":"),
                " ",
                bookingReference),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingConfirmation.details.property'),
                    ":"),
                " ",
                propertyName),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingConfirmation.details.checkIn'),
                    ":"),
                " ",
                i18n.formatDate(checkIn)),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingConfirmation.details.checkOut'),
                    ":"),
                " ",
                i18n.formatDate(checkOut)),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingConfirmation.details.guests'),
                    ":"),
                " ",
                guests),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingConfirmation.details.total'),
                    ":"),
                " ",
                i18n.formatCurrency(totalAmount, currency))),
        React.createElement(components_1.Section, { style: base_email_1.styles.buttonSection },
            React.createElement(components_1.Button, { href: bookingUrl, style: base_email_1.styles.button }, "Consulter ma r\u00E9servation")),
        React.createElement(components_1.Text, { style: base_email_1.styles.text }, i18n.t('emails.bookingConfirmation.thankYou'))));
};
exports.BookingConfirmationEmail = BookingConfirmationEmail;
// Styles additionnels spécifiques à ce template
const propertyImageStyle = {
    margin: '20px 0',
    borderRadius: '8px',
    width: '100%',
    height: 'auto',
};
const codeSection = {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
    textAlign: 'center',
    border: '1px solid #e0f2fe',
};
const codeLabel = {
    color: '#666',
    fontSize: '14px',
    margin: '0 0 8px 0',
};
const codeValue = {
    color: '#0c4a6e',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    margin: '0 0 8px 0',
};
const codeHelp = {
    color: '#666',
    fontSize: '12px',
    margin: '0',
};
exports.default = exports.BookingConfirmationEmail;
//# sourceMappingURL=booking-confirmation.js.map