const crypto = require('crypto');
const fetch = require('node-fetch');

// Configuration
const WEBHOOK_URL = 'http://localhost:5000/api/public/stripe/webhook';
const WEBHOOK_SECRET = 'whsec_test_secret'; // Remplacer par votre secret réel

// Créer un événement de test
const event = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_' + Math.random().toString(36).substring(7),
      object: 'payment_intent',
      amount: 10000,
      currency: 'eur',
      status: 'succeeded',
      metadata: {
        tenantId: 'test-tenant-id',
        propertyId: 'test-property-id'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  type: 'payment_intent.succeeded'
};

// Générer la signature Stripe
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Envoyer la requête webhook
async function testWebhook() {
  const payload = JSON.stringify(event);
  const signature = generateStripeSignature(payload, WEBHOOK_SECRET);
  
  console.log('Sending webhook test to:', WEBHOOK_URL);
  console.log('Event type:', event.type);
  
  try {
    const startTime = Date.now();
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload,
      timeout: 30000 // 30 secondes de timeout
    });
    
    const responseTime = Date.now() - startTime;
    const responseData = await response.text();
    
    console.log('Response status:', response.status);
    console.log('Response time:', responseTime + 'ms');
    console.log('Response body:', responseData);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    if (error.type === 'request-timeout') {
      console.error('⏱️  The webhook timed out - this is the issue we need to fix!');
    }
  }
}

// Test avec différents types d'événements
async function runTests() {
  // Test 1: payment_intent.succeeded
  await testWebhook();
  
  // Test 2: payment_intent.payment_failed
  event.type = 'payment_intent.payment_failed';
  event.data.object.status = 'failed';
  event.data.object.last_payment_error = {
    message: 'Your card was declined.'
  };
  await testWebhook();
  
  // Test 3: Un événement non géré
  event.type = 'charge.succeeded';
  await testWebhook();
}

console.log('🚀 Starting webhook tests...\n');
runTests();