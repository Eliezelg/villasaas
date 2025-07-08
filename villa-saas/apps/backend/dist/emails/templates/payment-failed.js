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
exports.PaymentFailedEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const base_email_1 = require("./base-email");
const i18n_email_service_1 = require("../../services/i18n-email.service");
const PaymentFailedEmail = ({ locale, guestName, bookingReference, propertyName, checkIn, checkOut, totalAmount, currency = 'EUR', tenantName = 'Villa SaaS', tenantLogo, retryUrl, }) => {
    const i18n = new i18n_email_service_1.I18nEmailService(locale);
    const previewText = i18n.t('emails.paymentFailed.subject', { reference: bookingReference });
    return (<base_email_1.BaseEmail previewText={previewText} tenantName={tenantName} tenantLogo={tenantLogo} footer={i18n.t('emails.paymentFailed.footer', { tenantName })}>
      <components_1.Heading style={base_email_1.styles.h1}>{i18n.t('emails.paymentFailed.title')}</components_1.Heading>
      
      <components_1.Text style={base_email_1.styles.text}>
        {i18n.t('emails.paymentFailed.greeting', { guestName })}
      </components_1.Text>

      <components_1.Text style={base_email_1.styles.text}>
        {i18n.t('emails.paymentFailed.intro')}
      </components_1.Text>

      <components_1.Section style={base_email_1.styles.infoSection}>
        <components_1.Text style={base_email_1.styles.infoTitle}>{i18n.t('emails.bookingConfirmation.details.title')}</components_1.Text>
        <components_1.Hr style={base_email_1.styles.hr}/>
        <components_1.Text style={base_email_1.styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.reference')}:</strong> {bookingReference}
        </components_1.Text>
        <components_1.Text style={base_email_1.styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.property')}:</strong> {propertyName}
        </components_1.Text>
        <components_1.Text style={base_email_1.styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.checkIn')}:</strong> {i18n.formatDate(checkIn)}
        </components_1.Text>
        <components_1.Text style={base_email_1.styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.checkOut')}:</strong> {i18n.formatDate(checkOut)}
        </components_1.Text>
        <components_1.Text style={base_email_1.styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.total')}:</strong> {i18n.formatCurrency(totalAmount, currency)}
        </components_1.Text>
      </components_1.Section>

      <components_1.Section style={base_email_1.styles.warningSection}>
        <components_1.Text style={base_email_1.styles.warningText}>
          {i18n.t('emails.paymentFailed.warning')}
        </components_1.Text>
      </components_1.Section>

      {retryUrl && (<components_1.Section style={base_email_1.styles.buttonSection}>
          <components_1.Button style={base_email_1.styles.button} href={retryUrl}>
            {i18n.t('emails.paymentFailed.retryButton')}
          </components_1.Button>
        </components_1.Section>)}

      <components_1.Text style={base_email_1.styles.text}>
        {i18n.t('emails.paymentFailed.contact')}
      </components_1.Text>
    </base_email_1.BaseEmail>);
};
exports.PaymentFailedEmail = PaymentFailedEmail;
exports.default = exports.PaymentFailedEmail;
//# sourceMappingURL=payment-failed.js.map