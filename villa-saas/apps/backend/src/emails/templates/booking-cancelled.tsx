import * as React from 'react';
import {
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import { BaseEmail, styles } from './base-email';
import { I18nEmailService } from '../../services/i18n-email.service';

interface BookingCancelledEmailProps {
  locale: string;
  guestName: string;
  bookingReference: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  tenantName?: string;
  tenantLogo?: string;
}

export const BookingCancelledEmail = ({
  locale,
  guestName,
  bookingReference,
  propertyName,
  checkIn,
  checkOut,
  tenantName = 'Villa SaaS',
  tenantLogo,
}: BookingCancelledEmailProps) => {
  const i18n = new I18nEmailService(locale);
  
  const previewText = i18n.t('emails.bookingCancelled.subject', { reference: bookingReference });

  return (
    <BaseEmail
      previewText={previewText}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      footer={i18n.t('emails.bookingCancelled.footer', { tenantName })}
    >
      <Heading style={styles.h1}>{i18n.t('emails.bookingCancelled.title')}</Heading>
      
      <Text style={styles.text}>
        {i18n.t('emails.bookingCancelled.greeting', { guestName })}
      </Text>

      <Text style={styles.text}>
        {i18n.t('emails.bookingCancelled.intro')}
      </Text>

      <Section style={styles.infoSection}>
        <Text style={styles.infoTitle}>{i18n.t('emails.bookingCancelled.details.title')}</Text>
        <Hr style={styles.hr} />
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingCancelled.details.reference')}:</strong> {bookingReference}
        </Text>
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingCancelled.details.property')}:</strong> {propertyName}
        </Text>
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingCancelled.details.checkIn')}:</strong> {i18n.formatDate(checkIn)}
        </Text>
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingCancelled.details.checkOut')}:</strong> {i18n.formatDate(checkOut)}
        </Text>
      </Section>

      <Text style={styles.text}>
        {i18n.t('emails.bookingCancelled.newBooking')}
      </Text>
    </BaseEmail>
  );
};

export default BookingCancelledEmail;