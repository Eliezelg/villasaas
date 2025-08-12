#!/bin/bash

echo "🔧 Test du webhook Stripe"
echo "========================="
echo ""

# Récupérer un payment intent récent
PAYMENT_INTENT_ID="pi_3RvH8eGhq4GfuGUq0WIVdApw"

echo "📝 Test avec Payment Intent: $PAYMENT_INTENT_ID"
echo ""

# Créer un payload de test
PAYLOAD='{
  "id": "evt_test_webhook",
  "object": "event",
  "api_version": "2023-10-16",
  "created": 1755001100,
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "'$PAYMENT_INTENT_ID'",
      "object": "payment_intent",
      "amount": 150000,
      "currency": "eur",
      "status": "succeeded",
      "metadata": {
        "tenantId": "cm9gv5ql80004u8m0v3w4qpsu",
        "propertyId": "cmdz19w9d000gnq0fk8876k2c",
        "checkIn": "2025-08-15",
        "checkOut": "2025-08-22",
        "guestEmail": "test@example.com",
        "guestName": "Test User"
      }
    }
  }
}'

echo "🚀 Envoi du webhook de test..."
echo ""

# Envoyer la requête (sans signature pour le test)
curl -X POST https://api.webpro200.fr/api/public/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d "$PAYLOAD" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "✅ Test terminé"
echo ""
echo "⚠️  Note: Ce test va probablement échouer avec une erreur de signature."
echo "   C'est normal car nous n'avons pas la bonne signature."
echo "   Le but est de vérifier que le webhook est accessible."