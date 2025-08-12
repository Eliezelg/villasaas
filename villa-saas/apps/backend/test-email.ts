import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { render } from '@react-email/components';
import BookingConfirmationEmail from './src/emails/templates/booking-confirmation.js';

// Charger les variables d'environnement
dotenv.config();

async function testEmail() {
  console.log('🔧 Test d\'envoi d\'email avec Resend');
  console.log('=====================================\n');

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'noreply@villa-saas.com';

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY n\'est pas défini dans les variables d\'environnement');
    process.exit(1);
  }

  console.log('✅ Clé API Resend trouvée:', apiKey.substring(0, 10) + '...');
  console.log('✅ Email expéditeur:', fromEmail);

  const resend = new Resend(apiKey);

  try {
    // Test 1: Email simple
    console.log('\n📧 Test 1: Envoi d\'un email simple...');
    const simpleResult = await resend.emails.send({
      from: fromEmail,
      to: 'eli@webpro200.com',
      subject: 'Test Villa SaaS - Email Simple',
      html: '<h1>Test Email</h1><p>Ceci est un test d\'envoi d\'email depuis Villa SaaS.</p>',
    });

    if (simpleResult.data) {
      console.log('✅ Email simple envoyé avec succès!');
      console.log('   ID de l\'email:', simpleResult.data.id);
    } else {
      console.error('❌ Erreur lors de l\'envoi de l\'email simple:', simpleResult.error);
    }

    // Test 2: Email de confirmation de réservation
    console.log('\n📧 Test 2: Envoi d\'un email de confirmation de réservation...');
    
    const templateParams = {
      bookingReference: 'TEST-2025-001',
      guestName: 'John Doe',
      guestEmail: 'eli@webpro200.com',
      propertyName: 'Villa Test - Bord de mer',
      checkIn: new Date('2025-02-15').toISOString(),
      checkOut: new Date('2025-02-22').toISOString(),
      guests: 4,
      totalAmount: 1500,
      currency: 'EUR',
      propertyImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
      tenantName: 'Villa SaaS Test',
      tenantSubdomain: 'test',
      locale: 'fr'
    };

    const emailHtml = await render(BookingConfirmationEmail(templateParams));

    const confirmationResult = await resend.emails.send({
      from: fromEmail,
      to: 'eli@webpro200.com',
      subject: `Confirmation de réservation ${templateParams.bookingReference}`,
      html: emailHtml as string,
    });

    if (confirmationResult.data) {
      console.log('✅ Email de confirmation envoyé avec succès!');
      console.log('   ID de l\'email:', confirmationResult.data.id);
    } else {
      console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', confirmationResult.error);
    }

    // Test 3: Vérifier le domaine
    console.log('\n🔍 Test 3: Vérification du domaine...');
    const domains = await resend.domains.list();
    
    if (domains.data) {
      console.log('✅ Domaines configurés:');
      domains.data.data?.forEach(domain => {
        console.log(`   - ${domain.name} (${domain.status})`);
      });
    } else {
      console.error('❌ Erreur lors de la récupération des domaines:', domains.error);
    }

  } catch (error) {
    console.error('\n❌ Erreur générale:', error);
  }

  console.log('\n=====================================');
  console.log('✅ Test terminé');
}

// Exécuter le test
testEmail().catch(console.error);