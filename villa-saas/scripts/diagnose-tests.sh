#!/bin/bash

# Script de diagnostic détaillé des tests qui échouent

API_URL="http://127.0.0.1:3001"
TOKEN=$(cat /tmp/token.txt 2>/dev/null)

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Diagnostic détaillé des tests ====${NC}\n"

# 1. Vérifier la création de propriété
echo -e "${YELLOW}1. Test de création de propriété${NC}"
PROPERTY_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Property for Diagnosis",
    "description": {"fr": "Test"},
    "propertyType": "VILLA",
    "status": "PUBLISHED",
    "address": "123 Test",
    "city": "Test",
    "postalCode": "12345",
    "country": "FR",
    "maxGuests": 4,
    "bedrooms": 2,
    "bathrooms": 1,
    "basePrice": 100
  }' \
  "$API_URL/api/properties")

PROPERTY_ID=$(echo "$PROPERTY_RESPONSE" | jq -r '.id // empty')
if [ -n "$PROPERTY_ID" ]; then
  echo -e "${GREEN}✓ Property created: $PROPERTY_ID${NC}"
else
  echo -e "${RED}✗ Property creation failed${NC}"
  echo "$PROPERTY_RESPONSE" | jq .
fi

# 2. Test de liste des propriétés
echo -e "\n${YELLOW}2. Test de liste des propriétés${NC}"
curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/properties" | jq '.properties | length'

# 3. Test de création de période tarifaire
echo -e "\n${YELLOW}3. Test de création de période tarifaire${NC}"
if [ -n "$PROPERTY_ID" ]; then
  PERIOD_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "propertyId": "'$PROPERTY_ID'",
      "name": "Test Period",
      "startDate": "2024-07-01T00:00:00Z",
      "endDate": "2024-08-31T23:59:59Z",
      "basePrice": 150,
      "weekendPremium": 20,
      "minNights": 2,
      "priority": 10,
      "isActive": true
    }' \
    "$API_URL/api/periods")
  
  echo "$PERIOD_RESPONSE" | jq .
fi

# 4. Test de calcul de prix
echo -e "\n${YELLOW}4. Test de calcul de prix${NC}"
if [ -n "$PROPERTY_ID" ]; then
  PRICE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "propertyId": "'$PROPERTY_ID'",
      "checkIn": "2024-07-15T00:00:00Z",
      "checkOut": "2024-07-20T00:00:00Z",
      "guests": 2
    }' \
    "$API_URL/api/pricing/calculate")
  
  echo "$PRICE_RESPONSE" | jq .
fi

# 5. Test de disponibilité
echo -e "\n${YELLOW}5. Test de disponibilité${NC}"
if [ -n "$PROPERTY_ID" ]; then
  curl -s -H "Authorization: Bearer $TOKEN" \
    "$API_URL/api/pricing/availability?propertyId=$PROPERTY_ID&checkIn=2024-07-15&checkOut=2024-07-20" | jq .
fi

# 6. Test de création de réservation
echo -e "\n${YELLOW}6. Test de création de réservation${NC}"
if [ -n "$PROPERTY_ID" ]; then
  BOOKING_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "propertyId": "'$PROPERTY_ID'",
      "checkIn": "2024-08-01T00:00:00Z",
      "checkOut": "2024-08-05T00:00:00Z",
      "adults": 2,
      "children": 0,
      "infants": 0,
      "pets": 0,
      "guestFirstName": "Test",
      "guestLastName": "Guest",
      "guestEmail": "test@guest.com",
      "guestPhone": "+33612345678"
    }' \
    "$API_URL/api/bookings")
  
  BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.id // empty')
  if [ -n "$BOOKING_ID" ]; then
    echo -e "${GREEN}✓ Booking created: $BOOKING_ID${NC}"
  else
    echo -e "${RED}✗ Booking creation failed${NC}"
    echo "$BOOKING_RESPONSE" | jq .
  fi
fi

# 7. Test analytics
echo -e "\n${YELLOW}7. Test analytics overview${NC}"
curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/analytics/overview" | jq .

echo -e "\n${GREEN}=== Diagnostic terminé ===${NC}"