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
exports.BookingCancelledEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const base_email_1 = require("./base-email");
const i18n_email_service_1 = require("../../services/i18n-email.service");
const BookingCancelledEmail = ({ locale, guestName, bookingReference, propertyName, checkIn, checkOut, tenantName = 'Villa SaaS', tenantLogo, }) => {
    const i18n = new i18n_email_service_1.I18nEmailService(locale);
    const previewText = i18n.t('emails.bookingCancelled.subject', { reference: bookingReference });
    return (React.createElement(base_email_1.BaseEmail, { previewText: previewText, tenantName: tenantName, tenantLogo: tenantLogo, footer: i18n.t('emails.bookingCancelled.footer', { tenantName }) },
        React.createElement(components_1.Heading, { style: base_email_1.styles.h1 }, i18n.t('emails.bookingCancelled.title')),
        React.createElement(components_1.Text, { style: base_email_1.styles.text }, i18n.t('emails.bookingCancelled.greeting', { guestName })),
        React.createElement(components_1.Text, { style: base_email_1.styles.text }, i18n.t('emails.bookingCancelled.intro')),
        React.createElement(components_1.Section, { style: base_email_1.styles.infoSection },
            React.createElement(components_1.Text, { style: base_email_1.styles.infoTitle }, i18n.t('emails.bookingCancelled.details.title')),
            React.createElement(components_1.Hr, { style: base_email_1.styles.hr }),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingCancelled.details.reference'),
                    ":"),
                " ",
                bookingReference),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingCancelled.details.property'),
                    ":"),
                " ",
                propertyName),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingCancelled.details.checkIn'),
                    ":"),
                " ",
                i18n.formatDate(checkIn)),
            React.createElement(components_1.Text, { style: base_email_1.styles.infoItem },
                React.createElement("strong", null,
                    i18n.t('emails.bookingCancelled.details.checkOut'),
                    ":"),
                " ",
                i18n.formatDate(checkOut))),
        React.createElement(components_1.Text, { style: base_email_1.styles.text }, i18n.t('emails.bookingCancelled.newBooking'))));
};
exports.BookingCancelledEmail = BookingCancelledEmail;
exports.default = exports.BookingCancelledEmail;
//# sourceMappingURL=booking-cancelled.js.map