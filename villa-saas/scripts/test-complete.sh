#!/bin/bash

# Test complet avec création d'un nouvel utilisateur

API_URL="http://127.0.0.1:3001"
TIMESTAMP=$(date +%s)
EMAIL="complete-test-$TIMESTAMP@example.com"
PASSWORD="test123456"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Test complet Villa SaaS ===${NC}\n"

# 1. Register
echo -e "${YELLOW}1. Création d'un nouvel utilisateur${NC}"
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'",
    "firstName": "Complete",
    "lastName": "Test",
    "companyName": "Complete Test '$TIMESTAMP'"
  }' \
  "$API_URL/api/auth/register")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
TENANT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.tenant.id')

if [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Utilisateur créé avec succès${NC}"
  echo "Email: $EMAIL"
  echo "Tenant ID: $TENANT_ID"
else
  echo -e "${RED}✗ Échec de création utilisateur${NC}"
  echo "$REGISTER_RESPONSE" | jq .
  exit 1
fi

# 2. Create Property
echo -e "\n${YELLOW}2. Création d'une propriété${NC}"
PROPERTY_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Villa Complete Test",
    "description": {"fr": "Villa de test complète", "en": "Complete test villa"},
    "propertyType": "VILLA",
    "status": "PUBLISHED",
    "address": "123 Complete Street",
    "city": "Test City",
    "postalCode": "12345",
    "country": "FR",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "maxGuests": 8,
    "bedrooms": 4,
    "bathrooms": 2,
    "surfaceArea": 200,
    "amenities": ["wifi", "pool", "parking"],
    "checkInTime": "15:00",
    "checkOutTime": "11:00",
    "basePrice": 150,
    "cleaningFee": 50,
    "weekendPremium": 20,
    "minNights": 2
  }' \
  "$API_URL/api/properties")

PROPERTY_ID=$(echo "$PROPERTY_RESPONSE" | jq -r '.id')

if [ "$PROPERTY_ID" != "null" ]; then
  echo -e "${GREEN}✓ Propriété créée: $PROPERTY_ID${NC}"
else
  echo -e "${RED}✗ Échec de création propriété${NC}"
  echo "$PROPERTY_RESPONSE" | jq .
fi

# 3. Create Pricing Period
echo -e "\n${YELLOW}3. Création d'une période tarifaire${NC}"
PERIOD_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "propertyId": "'$PROPERTY_ID'",
    "name": "Été 2024",
    "startDate": "2024-07-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z",
    "basePrice": 200,
    "weekendPremium": 50,
    "minNights": 3,
    "priority": 10,
    "isActive": true
  }' \
  "$API_URL/api/periods")

if [ "$(echo "$PERIOD_RESPONSE" | jq -r '.id')" != "null" ]; then
  echo -e "${GREEN}✓ Période tarifaire créée${NC}"
else
  echo -e "${RED}✗ Échec de création période${NC}"
  echo "$PERIOD_RESPONSE" | jq .
fi

# 4. Calculate Price
echo -e "\n${YELLOW}4. Calcul de prix${NC}"
PRICE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "propertyId": "'$PROPERTY_ID'",
    "checkIn": "2024-07-15T00:00:00Z",
    "checkOut": "2024-07-20T00:00:00Z",
    "guests": 4
  }' \
  "$API_URL/api/pricing/calculate")

TOTAL_PRICE=$(echo "$PRICE_RESPONSE" | jq -r '.total // 0')
if [ "$TOTAL_PRICE" != "0" ]; then
  echo -e "${GREEN}✓ Prix calculé: $TOTAL_PRICE EUR${NC}"
else
  echo -e "${RED}✗ Échec calcul de prix${NC}"
  echo "$PRICE_RESPONSE" | jq .
fi

# 5. Create Booking
echo -e "\n${YELLOW}5. Création d'une réservation${NC}"
BOOKING_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "propertyId": "'$PROPERTY_ID'",
    "checkIn": "2024-07-20T00:00:00Z",
    "checkOut": "2024-07-25T00:00:00Z",
    "adults": 4,
    "children": 2,
    "infants": 0,
    "pets": 0,
    "guestFirstName": "Jean",
    "guestLastName": "Dupont",
    "guestEmail": "jean.dupont@example.com",
    "guestPhone": "+33612345678",
    "guestCountry": "FR"
  }' \
  "$API_URL/api/bookings")

BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.id')
BOOKING_REF=$(echo "$BOOKING_RESPONSE" | jq -r '.reference')

if [ "$BOOKING_ID" != "null" ]; then
  echo -e "${GREEN}✓ Réservation créée: $BOOKING_REF${NC}"
else
  echo -e "${RED}✗ Échec de création réservation${NC}"
  echo "$BOOKING_RESPONSE" | jq .
fi

# 6. Analytics Overview
echo -e "\n${YELLOW}6. Analytics - Vue d'ensemble${NC}"
ANALYTICS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/analytics/overview")

if [ "$(echo "$ANALYTICS_RESPONSE" | jq -r '.totalBookings // -1')" != "-1" ]; then
  echo -e "${GREEN}✓ Analytics disponibles${NC}"
  echo "Total réservations: $(echo "$ANALYTICS_RESPONSE" | jq -r '.totalBookings')"
  echo "Revenu total: $(echo "$ANALYTICS_RESPONSE" | jq -r '.totalRevenue') EUR"
else
  echo -e "${RED}✗ Échec analytics${NC}"
  echo "$ANALYTICS_RESPONSE" | jq .
fi

# 7. Test all endpoints
echo -e "\n${YELLOW}7. Test de tous les endpoints principaux${NC}"

# Helper function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local description=$4
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method -H "Authorization: Bearer $TOKEN" "$API_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "$expected_status" ]; then
    echo -e "  ${GREEN}✓${NC} $description"
  else
    echo -e "  ${RED}✗${NC} $description (got $http_code, expected $expected_status)"
  fi
}

test_endpoint "GET" "/api/properties" "200" "Liste des propriétés"
test_endpoint "GET" "/api/properties/$PROPERTY_ID" "200" "Détail propriété"
test_endpoint "GET" "/api/periods?propertyId=$PROPERTY_ID" "200" "Périodes tarifaires"
test_endpoint "GET" "/api/bookings" "200" "Liste des réservations"
test_endpoint "GET" "/api/bookings/$BOOKING_ID" "200" "Détail réservation"
test_endpoint "POST" "/api/bookings/$BOOKING_ID/confirm" "200" "Confirmer réservation"
test_endpoint "GET" "/api/bookings/stats" "200" "Statistiques réservations"
test_endpoint "GET" "/api/availability/availability-calendar?propertyId=$PROPERTY_ID&startDate=2024-07-01&endDate=2024-07-31" "200" "Calendrier disponibilité"
test_endpoint "GET" "/api/analytics/occupancy" "200" "Analytics occupation"
test_endpoint "GET" "/api/analytics/revenue" "200" "Analytics revenus"
test_endpoint "GET" "/api/analytics/export" "200" "Export analytics"

echo -e "\n${GREEN}=== Test complet terminé ===${NC}"