#!/bin/bash

# Test spécifique pour les analytics

API_URL="http://127.0.0.1:3001"
TIMESTAMP=$(date +%s)
EMAIL="analytics-test-$TIMESTAMP@example.com"
PASSWORD="test123456"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Test Analytics Villa SaaS ===${NC}\n"

# 1. Register
echo -e "${YELLOW}1. Création d'un nouvel utilisateur${NC}"
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'",
    "firstName": "Analytics",
    "lastName": "Test",
    "companyName": "Analytics Test '$TIMESTAMP'"
  }' \
  "$API_URL/api/auth/register")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')

if [ "$TOKEN" = "null" ]; then
  echo -e "${RED}✗ Échec de création utilisateur${NC}"
  echo "$REGISTER_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✓ Utilisateur créé${NC}"

# 2. Test direct des endpoints analytics
echo -e "\n${YELLOW}2. Test analytics/overview${NC}"
OVERVIEW_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/analytics/overview")

HTTP_CODE=$(echo "$OVERVIEW_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$OVERVIEW_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Overview OK${NC}"
  echo "$BODY" | jq .
else
  echo -e "${RED}✗ Overview failed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq .
fi

# 3. Test analytics/occupancy
echo -e "\n${YELLOW}3. Test analytics/occupancy${NC}"
OCCUPANCY_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/analytics/occupancy")

HTTP_CODE=$(echo "$OCCUPANCY_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$OCCUPANCY_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Occupancy OK${NC}"
  echo "$BODY" | jq .
else
  echo -e "${RED}✗ Occupancy failed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq .
fi

# 4. Test analytics/revenue
echo -e "\n${YELLOW}4. Test analytics/revenue${NC}"
REVENUE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/analytics/revenue")

HTTP_CODE=$(echo "$REVENUE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$REVENUE_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Revenue OK${NC}"
  echo "$BODY" | jq .
else
  echo -e "${RED}✗ Revenue failed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq .
fi

# 5. Test analytics/export
echo -e "\n${YELLOW}5. Test analytics/export${NC}"
EXPORT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/analytics/export")

HTTP_CODE=$(echo "$EXPORT_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Export OK${NC}"
  echo "CSV export successful"
else
  echo -e "${RED}✗ Export failed (HTTP $HTTP_CODE)${NC}"
fi

echo -e "\n${GREEN}=== Test terminé ===${NC}"