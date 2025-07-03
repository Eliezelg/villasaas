#!/bin/bash

# Test spécifique pour la création de réservation

API_URL="http://127.0.0.1:3001"
TIMESTAMP=$(date +%s)
EMAIL="booking-test-$TIMESTAMP@example.com"
PASSWORD="test123456"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Test Création Réservation ===${NC}\n"

# 1. Register
echo -e "${YELLOW}1. Création d'un nouvel utilisateur${NC}"
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'",
    "firstName": "Booking",
    "lastName": "Test",
    "companyName": "Booking Test '$TIMESTAMP'"
  }' \
  "$API_URL/api/auth/register")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')

if [ "$TOKEN" = "null" ]; then
  echo -e "${RED}✗ Échec de création utilisateur${NC}"
  exit 1
fi

# 2. Create Property
echo -e "\n${YELLOW}2. Création d'une propriété simple${NC}"
PROPERTY_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Property",
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
    "surfaceArea": 100,
    "basePrice": 100,
    "cleaningFee": 50,
    "minNights": 1
  }' \
  "$API_URL/api/properties")

PROPERTY_ID=$(echo "$PROPERTY_RESPONSE" | jq -r '.id')

if [ "$PROPERTY_ID" = "null" ]; then
  echo -e "${RED}✗ Échec de création propriété${NC}"
  echo "$PROPERTY_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✓ Propriété créée: $PROPERTY_ID${NC}"

# 3. Test direct création réservation
echo -e "\n${YELLOW}3. Création de réservation${NC}"
echo "Sending request..."

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
    "guestPhone": "+33612345678",
    "guestCountry": "FR"
  }' \
  "$API_URL/api/bookings" 2>&1)

echo -e "\n${YELLOW}Response:${NC}"
echo "$BOOKING_RESPONSE" | jq .

# Check if successful
BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.id // empty')
if [ -n "$BOOKING_ID" ]; then
  echo -e "\n${GREEN}✓ Réservation créée avec succès!${NC}"
  echo "ID: $BOOKING_ID"
  echo "Reference: $(echo "$BOOKING_RESPONSE" | jq -r '.reference')"
else
  echo -e "\n${RED}✗ Échec de création${NC}"
fi