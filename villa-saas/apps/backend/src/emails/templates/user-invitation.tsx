import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { styles } from './base-email';

interface UserInvitationEmailProps {
  firstName: string;
  email: string;
  temporaryPassword: string;
  role: string;
  loginUrl: string;
  tenantName?: string;
  tenantLogo?: string;
  inviterName?: string;
}

const UserInvitationEmail: React.FC<UserInvitationEmailProps> = ({
  firstName,
  email,
  temporaryPassword,
  role,
  loginUrl,
  tenantName = 'Villa SaaS',
  tenantLogo,
  inviterName,
}) => {
  const previewText = `You've been invited to join ${tenantName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {tenantLogo && (
            <Section style={{ textAlign: 'center', marginBottom: '30px' }}>
              <Img
                src={tenantLogo}
                alt={tenantName}
                style={{ height: '50px', margin: '0 auto' }}
              />
            </Section>
          )}

          <Heading style={styles.h1}>
            Welcome to {tenantName}!
          </Heading>

          <Text style={styles.text}>
            Hello {firstName},
          </Text>

          <Text style={styles.text}>
            {inviterName ? `${inviterName} has` : "You've been"} invited to join the {tenantName} team as a <strong>{role}</strong>.
          </Text>

          <Section style={styles.infoSection}>
            <Text style={styles.text}>
              Your temporary login credentials are:
            </Text>
            
            <Section style={{
              background: '#f4f4f5',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <Text style={{ ...styles.text, margin: '5px 0' }}>
                <strong>Email:</strong> {email}
              </Text>
              <Text style={{ ...styles.text, margin: '5px 0' }}>
                <strong>Password:</strong> <code style={{
                  background: '#e4e4e7',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>{temporaryPassword}</code>
              </Text>
            </Section>

            <Text style={styles.text}>
              <strong>Important:</strong> You will be asked to change your password on your first login.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '30px 0' }}>
            <Button
              style={styles.button}
              href={loginUrl}
            >
              Login to {tenantName}
            </Button>
          </Section>

          <Text style={{ ...styles.text, fontSize: '14px', color: '#71717a' }}>
            If the button above doesn't work, you can copy and paste this link into your browser:
          </Text>
          <Link
            href={loginUrl}
            style={{
              color: '#5469d4',
              fontSize: '14px',
              wordBreak: 'break-all'
            }}
          >
            {loginUrl}
          </Link>

          <Hr style={styles.hr} />

          <Text style={styles.footerText}>
            This invitation was sent to {email}. If you didn't expect this invitation, 
            you can safely ignore this email.
          </Text>

          <Text style={styles.footerText}>
            Best regards,<br />
            The {tenantName} team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default UserInvitationEmail;