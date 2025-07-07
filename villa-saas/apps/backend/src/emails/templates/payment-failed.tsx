import * as React from 'react';
import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import { BaseEmail, styles } from './base-email';
import { I18nEmailService } from '../../services/i18n-email.service';

interface PaymentFailedEmailProps {
  locale: string;
  guestName: string;
  bookingReference: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency?: string;
  tenantName?: string;
  tenantLogo?: string;
  retryUrl?: string;
}

export const PaymentFailedEmail = ({
  locale,
  guestName,
  bookingReference,
  propertyName,
  checkIn,
  checkOut,
  totalAmount,
  currency = 'EUR',
  tenantName = 'Villa SaaS',
  tenantLogo,
  retryUrl,
}: PaymentFailedEmailProps) => {
  const i18n = new I18nEmailService(locale);
  
  const previewText = i18n.t('emails.paymentFailed.subject', { reference: bookingReference });

  return (
    <BaseEmail
      previewText={previewText}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      footer={i18n.t('emails.paymentFailed.footer', { tenantName })}
    >
      <Heading style={styles.h1}>{i18n.t('emails.paymentFailed.title')}</Heading>
      
      <Text style={styles.text}>
        {i18n.t('emails.paymentFailed.greeting', { guestName })}
      </Text>

      <Text style={styles.text}>
        {i18n.t('emails.paymentFailed.intro')}
      </Text>

      <Section style={styles.infoSection}>
        <Text style={styles.infoTitle}>{i18n.t('emails.bookingConfirmation.details.title')}</Text>
        <Hr style={styles.hr} />
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.reference')}:</strong> {bookingReference}
        </Text>
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.property')}:</strong> {propertyName}
        </Text>
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.checkIn')}:</strong> {i18n.formatDate(checkIn)}
        </Text>
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.checkOut')}:</strong> {i18n.formatDate(checkOut)}
        </Text>
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.total')}:</strong> {i18n.formatCurrency(totalAmount, currency)}
        </Text>
      </Section>

      <Section style={styles.warningSection}>
        <Text style={styles.warningText}>
          {i18n.t('emails.paymentFailed.warning')}
        </Text>
      </Section>

      {retryUrl && (
        <Section style={styles.buttonSection}>
          <Button
            style={styles.button}
            href={retryUrl}
          >
            {i18n.t('emails.paymentFailed.retryButton')}
          </Button>
        </Section>
      )}

      <Text style={styles.text}>
        {i18n.t('emails.paymentFailed.contact')}
      </Text>
    </BaseEmail>
  );
};

export default PaymentFailedEmail;