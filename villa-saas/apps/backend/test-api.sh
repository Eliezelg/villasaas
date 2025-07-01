#!/bin/bash

echo "🧪 Test de l'API Villa SaaS"
echo "=========================="

# Test health check
echo -n "1. Health check: "
curl -s http://localhost:3001/health | jq -r '.status' || echo "❌ Erreur"

# Test register
echo -e "\n2. Test inscription:"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "companyName": "Test Company",
    "phone": "+33612345678"
  }')

if echo "$REGISTER_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
  echo "✅ Inscription réussie"
  TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
  echo "Token: ${TOKEN:0:20}..."
else
  echo "❌ Erreur inscription:"
  echo "$REGISTER_RESPONSE" | jq '.'
fi

# Test login
echo -e "\n3. Test connexion:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@demo.villa-saas.com",
    "password": "Demo1234!"
  }')

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
  echo "✅ Connexion réussie"
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
  
  # Test authenticated route
  echo -e "\n4. Test route protégée (/api/auth/me):"
  ME_RESPONSE=$(curl -s http://localhost:3001/api/auth/me \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$ME_RESPONSE" | jq -e '.email' > /dev/null 2>&1; then
    echo "✅ Route protégée accessible"
    echo "Utilisateur: $(echo "$ME_RESPONSE" | jq -r '.email')"
  else
    echo "❌ Erreur route protégée"
  fi
else
  echo "❌ Erreur connexion:"
  echo "$LOGIN_RESPONSE" | jq '.'
fi