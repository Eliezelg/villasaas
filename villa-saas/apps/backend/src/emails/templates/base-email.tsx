import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BaseEmailProps {
  previewText: string;
  children: React.ReactNode;
  tenantName?: string;
  tenantLogo?: string;
  footer?: string;
}

export const BaseEmail = ({
  previewText,
  children,
  tenantName = 'Villa SaaS',
  tenantLogo,
  footer,
}: BaseEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {tenantLogo && (
            <Section style={logoSection}>
              <Img
                src={tenantLogo}
                width="150"
                height="auto"
                alt={tenantName}
                style={logo}
              />
            </Section>
          )}

          {children}

          {footer && (
            <>
              <hr style={hr} />
              <Text style={footerText}>{footer}</Text>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
};

// Shared styles
export const styles = {
  main: {
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    borderRadius: '5px',
  },
  logoSection: {
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  logo: {
    margin: '0 auto',
  },
  h1: {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  text: {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 40px',
  },
  infoSection: {
    backgroundColor: '#f4f4f5',
    borderRadius: '4px',
    margin: '20px 40px',
    padding: '24px',
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
  infoItem: {
    fontSize: '14px',
    lineHeight: '24px',
    color: '#333',
    margin: '8px 0',
  },
  button: {
    backgroundColor: '#5469d4',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    width: 'auto',
    padding: '12px 20px',
  },
  buttonSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  hr: {
    borderColor: '#e6ebf1',
    margin: '20px 0',
  },
  footerText: {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    margin: '16px 40px',
  },
  warningSection: {
    backgroundColor: '#fef3c7',
    borderRadius: '4px',
    margin: '20px 40px',
    padding: '16px 24px',
    border: '1px solid #fcd34d',
  },
  warningText: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#92400e',
    margin: 0,
  },
  successSection: {
    backgroundColor: '#d1fae5',
    borderRadius: '4px',
    margin: '20px 40px',
    padding: '16px 24px',
    border: '1px solid #6ee7b7',
  },
  successText: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#065f46',
    margin: 0,
  },
};

// Re-export individual styles for convenience
const {
  main,
  container,
  logoSection,
  logo,
  h1,
  text,
  infoSection,
  infoTitle,
  infoItem,
  button,
  buttonSection,
  hr,
  footerText,
  warningSection,
  warningText,
  successSection,
  successText,
} = styles;

export default BaseEmail;