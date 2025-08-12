#!/bin/bash

echo "=== Test du flow de signup complet ==="

# 1. Créer une session
echo -e "\n1. Création de la session..."
SESSION_RESPONSE=$(curl -s -X POST http://api.webpro200.com/api/auth/signup/session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

SESSION_TOKEN=$(echo $SESSION_RESPONSE | jq -r .sessionToken)
EMAIL=$(echo $SESSION_RESPONSE | jq -r .email)

echo "Session créée: $SESSION_TOKEN"
echo "Email: $EMAIL"

# 2. Ajouter les informations personnelles
echo -e "\n2. Ajout des informations personnelles..."
curl -s -X POST http://api.webpro200.com/api/auth/signup/personal-info \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionToken\": \"$SESSION_TOKEN\",
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"companyName\": \"Test Company\",
    \"phone\": \"+33612345678\",
    \"address\": \"123 rue de la Paix\",
    \"city\": \"Paris\",
    \"postalCode\": \"75001\",
    \"country\": \"FR\"
  }" | jq .

# 3. Sélectionner le plan
echo -e "\n3. Sélection du plan..."
curl -s -X POST http://api.webpro200.com/api/auth/signup/select-plan \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionToken\": \"$SESSION_TOKEN\",
    \"plan\": \"starter\"
  }" | jq .

# 4. Créer la session Stripe Checkout
echo -e "\n4. Création de la session Stripe Checkout..."
CHECKOUT_RESPONSE=$(curl -s -X POST http://api.webpro200.com/api/subscriptions/signup-checkout \
  -H "Content-Type: application/json" \
  -d "{
    \"plan\": \"starter\",
    \"email\": \"$EMAIL\",
    \"successUrl\": \"http://localhost:3000/fr/admin/signup?step=4&session_id={CHECKOUT_SESSION_ID}&token=$SESSION_TOKEN\",
    \"cancelUrl\": \"http://localhost:3000/fr/admin/signup?step=3&token=$SESSION_TOKEN\"
  }")

CHECKOUT_URL=$(echo $CHECKOUT_RESPONSE | jq -r .url)
STRIPE_SESSION_ID=$(echo $CHECKOUT_RESPONSE | jq -r .sessionId)

echo "Session Stripe créée: $STRIPE_SESSION_ID"
echo -e "\n🔗 URL de paiement Stripe:"
echo "$CHECKOUT_URL"

# 5. Mettre à jour la session avec l'ID Stripe
echo -e "\n5. Mise à jour de la session avec l'ID Stripe..."
curl -s -X POST http://api.webpro200.com/api/auth/signup/select-plan \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionToken\": \"$SESSION_TOKEN\",
    \"plan\": \"starter\",
    \"stripeSessionId\": \"$STRIPE_SESSION_ID\"
  }" | jq .

echo -e "\n📋 Pour finaliser le test:"
echo "1. Ouvrez l'URL Stripe ci-dessus dans votre navigateur"
echo "2. Utilisez la carte de test: 4242 4242 4242 4242"
echo "3. Date d'expiration: n'importe quelle date future"
echo "4. CVC: n'importe quel 3 chiffres"
echo "5. Après le paiement, exécutez la commande suivante:"
echo ""
echo "curl -X POST http://api.webpro200.com/api/auth/signup/complete \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"sessionToken\": \"$SESSION_TOKEN\","
echo "    \"propertyName\": \"Ma Villa Test\","
echo "    \"domainType\": \"subdomain\","
echo "    \"subdomain\": \"villa-$(date +%s)\","
echo "    \"propertyType\": \"VILLA\","
echo "    \"description\": {\"fr\": \"Bienvenue dans ma villa\"}"
echo "  }' | jq ."