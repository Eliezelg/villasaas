#!/bin/bash

# Configuration
API_URL="http://127.0.0.1:3001"
EMAIL="john@example.com"
PASSWORD="password123"

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Method: $method"
    echo "Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        echo "Data: $data"
    fi
    
    # Construire la commande curl
    if [ "$method" = "GET" ]; then
        if [ -f /tmp/token.txt ]; then
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $(cat /tmp/token.txt)" "$API_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
        fi
    else
        if [ -f /tmp/token.txt ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $(cat /tmp/token.txt)" \
                -d "$data" \
                "$API_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint")
        fi
    fi
    
    # Extraire le code de statut
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "Response Status: $http_code"
    echo "Response Body: $body" | jq . 2>/dev/null || echo "$body"
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED - Expected status $expected_status but got $http_code${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Nettoyer les fichiers temporaires
rm -f /tmp/token.txt /tmp/tenant_id.txt /tmp/property_id.txt /tmp/period_id.txt /tmp/booking_id.txt

echo "==================================="
echo "Testing Villa SaaS Backend APIs"
echo "==================================="

# 1. Test Health Check
test_endpoint "GET" "/health" "" "200" "Health check"

# 2. Test Auth - Register
TIMESTAMP=$(date +%s)
TEST_EMAIL="apitest$TIMESTAMP@example.com"
REGISTER_DATA='{
  "email": "'$TEST_EMAIL'",
  "password": "'$PASSWORD'",
  "firstName": "Test",
  "lastName": "User",
  "companyName": "Test Company '$TIMESTAMP'"
}'
if test_endpoint "POST" "/api/auth/register" "$REGISTER_DATA" "201" "Register new user"; then
  EMAIL=$TEST_EMAIL
fi

# 3. Test Auth - Login
LOGIN_DATA='{
  "email": "'$EMAIL'",
  "password": "'$PASSWORD'"
}'
response=$(curl -s -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$API_URL/api/auth/login")
echo "$response" | jq -r '.accessToken' > /tmp/token.txt
echo "$response" | jq -r '.user.tenantId' > /tmp/tenant_id.txt
test_endpoint "POST" "/api/auth/login" "$LOGIN_DATA" "200" "Login"

# 4. Test Auth - Me
test_endpoint "GET" "/api/auth/me" "" "200" "Get current user"

# 5. Test Properties - Create
PROPERTY_DATA='{
  "name": "Test Villa",
  "description": {
    "fr": "Belle villa de test",
    "en": "Beautiful test villa"
  },
  "propertyType": "VILLA",
  "status": "DRAFT",
  "address": "123 Test Street",
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
  "cleaningFee": 50
}'
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $(cat /tmp/token.txt)" \
    -d "$PROPERTY_DATA" \
    "$API_URL/api/properties")
echo "$response" | jq -r '.id' > /tmp/property_id.txt
test_endpoint "POST" "/api/properties" "$PROPERTY_DATA" "201" "Create property"

# 6. Test Properties - List
test_endpoint "GET" "/api/properties" "" "200" "List properties"

# 7. Test Properties - Get by ID
PROPERTY_ID=$(cat /tmp/property_id.txt 2>/dev/null || echo "test-id")
test_endpoint "GET" "/api/properties/$PROPERTY_ID" "" "200" "Get property by ID"

# 8. Test Properties - Update
UPDATE_PROPERTY_DATA='{
  "name": "Updated Test Villa",
  "status": "PUBLISHED"
}'
test_endpoint "PATCH" "/api/properties/$PROPERTY_ID" "$UPDATE_PROPERTY_DATA" "200" "Update property"

# 9. Test Pricing Periods - Create
PERIOD_DATA='{
  "propertyId": "'$PROPERTY_ID'",
  "name": "High Season",
  "startDate": "2024-07-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z",
  "basePrice": 200,
  "weekendPremium": 50,
  "minNights": 3,
  "priority": 10,
  "isActive": true
}'
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $(cat /tmp/token.txt)" \
    -d "$PERIOD_DATA" \
    "$API_URL/api/periods")
echo "$response" | jq -r '.id' > /tmp/period_id.txt
test_endpoint "POST" "/api/periods" "$PERIOD_DATA" "201" "Create pricing period"

# 10. Test Pricing Periods - List
test_endpoint "GET" "/api/periods?propertyId=$PROPERTY_ID" "" "200" "List pricing periods"

# 11. Test Pricing - Calculate
PRICING_DATA='{
  "propertyId": "'$PROPERTY_ID'",
  "checkIn": "2024-07-15T00:00:00Z",
  "checkOut": "2024-07-20T00:00:00Z",
  "guests": 4
}'
test_endpoint "POST" "/api/pricing/calculate" "$PRICING_DATA" "200" "Calculate pricing"

# 12. Test Pricing - Check availability
test_endpoint "GET" "/api/pricing/availability?propertyId=$PROPERTY_ID&checkIn=2024-07-15&checkOut=2024-07-20" "" "200" "Check availability"

# 13. Test Availability - Create blocked period
BLOCKED_DATA='{
  "propertyId": "'$PROPERTY_ID'",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-10T23:59:59Z",
  "reason": "Maintenance"
}'
test_endpoint "POST" "/api/availability/blocked-periods" "$BLOCKED_DATA" "201" "Create blocked period"

# 14. Test Availability - Check availability
CHECK_AVAILABILITY_DATA='{
  "propertyId": "'$PROPERTY_ID'",
  "checkIn": "2024-07-20T00:00:00Z",
  "checkOut": "2024-07-25T00:00:00Z"
}'
test_endpoint "POST" "/api/availability/check-availability" "$CHECK_AVAILABILITY_DATA" "200" "Check availability"

# 15. Test Availability - Get calendar
test_endpoint "GET" "/api/availability/availability-calendar?propertyId=$PROPERTY_ID&startDate=2024-07-01&endDate=2024-07-31" "" "200" "Get availability calendar"

# 16. Test Bookings - Calculate price
BOOKING_CALC_DATA='{
  "propertyId": "'$PROPERTY_ID'",
  "checkIn": "2024-07-15T00:00:00Z",
  "checkOut": "2024-07-20T00:00:00Z",
  "adults": 4,
  "children": 2,
  "infants": 0,
  "pets": 0
}'
test_endpoint "POST" "/api/bookings/calculate-price" "$BOOKING_CALC_DATA" "200" "Calculate booking price"

# 17. Test Bookings - Create
BOOKING_DATA='{
  "propertyId": "'$PROPERTY_ID'",
  "checkIn": "2024-07-15T00:00:00Z",
  "checkOut": "2024-07-20T00:00:00Z",
  "adults": 4,
  "children": 2,
  "infants": 0,
  "pets": 0,
  "guestFirstName": "John",
  "guestLastName": "Doe",
  "guestEmail": "john.doe@example.com",
  "guestPhone": "+33612345678",
  "guestCountry": "FR"
}'
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $(cat /tmp/token.txt)" \
    -d "$BOOKING_DATA" \
    "$API_URL/api/bookings")
echo "$response" | jq -r '.id' > /tmp/booking_id.txt
test_endpoint "POST" "/api/bookings" "$BOOKING_DATA" "201" "Create booking"

# 18. Test Bookings - List
test_endpoint "GET" "/api/bookings" "" "200" "List bookings"

# 19. Test Bookings - Get by ID
BOOKING_ID=$(cat /tmp/booking_id.txt 2>/dev/null || echo "test-id")
test_endpoint "GET" "/api/bookings/$BOOKING_ID" "" "200" "Get booking by ID"

# 20. Test Bookings - Update
UPDATE_BOOKING_DATA='{
  "guestNotes": "Special dietary requirements"
}'
test_endpoint "PATCH" "/api/bookings/$BOOKING_ID" "$UPDATE_BOOKING_DATA" "200" "Update booking"

# 21. Test Bookings - Confirm
test_endpoint "POST" "/api/bookings/$BOOKING_ID/confirm" "" "200" "Confirm booking"

# 22. Test Bookings - Stats
test_endpoint "GET" "/api/bookings/stats?propertyId=$PROPERTY_ID" "" "200" "Get booking statistics"

# 23. Test Tenants - Get current
test_endpoint "GET" "/api/tenants/current" "" "200" "Get current tenant"

# 24. Test Users - List
test_endpoint "GET" "/api/users" "" "200" "List users"

# 25. Test Users - Get current
test_endpoint "GET" "/api/users/me" "" "200" "Get current user"

# 26. Test Swagger Documentation
test_endpoint "GET" "/documentation/json" "" "200" "Get Swagger JSON"

# 27. Test Analytics - Overview
test_endpoint "GET" "/api/analytics/overview" "" "200" "Get analytics overview"

# 28. Test Analytics - Occupancy
test_endpoint "GET" "/api/analytics/occupancy?propertyId=$PROPERTY_ID" "" "200" "Get occupancy analytics"

# 29. Test Analytics - Revenue
test_endpoint "GET" "/api/analytics/revenue" "" "200" "Get revenue analytics"

echo -e "\n==================================="
echo "Test Summary"
echo "==================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed! ✗${NC}"
    exit 1
fi