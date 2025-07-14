import {
  Button,
  Heading,
  Hr,
  Img,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail, styles } from './base-email';
import { I18nEmailService } from '../../services/i18n-email.service';

interface BookingConfirmationEmailProps {
  locale: string;
  bookingReference: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  currency?: string;
  propertyImage?: string;
  tenantName?: string;
  tenantLogo?: string;
  tenantSubdomain?: string;
}

export const BookingConfirmationEmail = ({
  locale,
  bookingReference,
  guestName,
  guestEmail,
  propertyName,
  checkIn,
  checkOut,
  guests,
  totalAmount,
  currency = 'EUR',
  propertyImage,
  tenantName = 'Villa Booking',
  tenantLogo,
}: BookingConfirmationEmailProps) => {
  const i18n = new I18nEmailService(locale);
  const previewText = i18n.t('emails.bookingConfirmation.subject', { reference: bookingReference });
  
  // URL de consultation avec email et code
  const bookingUrl = `${process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3002'}/${locale}/my-booking?email=${encodeURIComponent(guestEmail)}&reference=${bookingReference}`;

  return (
    <BaseEmail
      previewText={previewText}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      footer={i18n.t('emails.bookingConfirmation.footer', { tenantName })}
    >
      <Heading style={styles.h1}>{i18n.t('emails.bookingConfirmation.title')}</Heading>
      
      <Text style={styles.text}>
        {i18n.t('emails.bookingConfirmation.greeting', { guestName })}
      </Text>
      
      <Text style={styles.text}>
        {i18n.t('emails.bookingConfirmation.intro')}
      </Text>

      <Section style={codeSection}>
        <Text style={codeLabel}>Votre code de réservation :</Text>
        <Text style={codeValue}>{bookingReference}</Text>
        <Text style={codeHelp}>
          Utilisez ce code avec votre email pour accéder à votre réservation
        </Text>
      </Section>

      {propertyImage && (
        <Img
          src={propertyImage}
          width="600"
          height="400"
          alt={propertyName}
          style={propertyImageStyle}
        />
      )}

      <Section style={styles.infoSection}>
        <Text style={styles.infoTitle}>
          {i18n.t('emails.bookingConfirmation.details.title')}
        </Text>
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
          <strong>{i18n.t('emails.bookingConfirmation.details.guests')}:</strong> {guests}
        </Text>
        <Text style={styles.infoItem}>
          <strong>{i18n.t('emails.bookingConfirmation.details.total')}:</strong> {i18n.formatCurrency(totalAmount, currency)}
        </Text>
      </Section>

      <Section style={styles.buttonSection}>
        <Button
          href={bookingUrl}
          style={styles.button}
        >
          Consulter ma réservation
        </Button>
      </Section>

      <Text style={styles.text}>
        {i18n.t('emails.bookingConfirmation.thankYou')}
      </Text>
    </BaseEmail>
  );
};

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
  textAlign: 'center' as const,
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



export default BookingConfirmationEmail;