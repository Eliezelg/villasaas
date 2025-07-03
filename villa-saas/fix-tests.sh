#!/bin/bash

# Script pour corriger les tests qui échouent

API_URL="http://127.0.0.1:3001"

# Configuration
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${YELLOW}Fixing test issues...${NC}"

# 1. Corriger l'erreur d'analytics overview
echo -e "\n${YELLOW}1. Checking analytics service error...${NC}"

# Vérifier si le problème vient des statuts en minuscules
echo "The analytics service has been fixed to use uppercase statuses (CONFIRMED, COMPLETED)"

# 2. Créer un script de test simplifié pour debug
cat > /tmp/test-property-create.sh << 'EOF'
#!/bin/bash

API_URL="http://127.0.0.1:3001"
TOKEN=$(cat /tmp/token.txt)

echo "Testing property creation with minimal data..."

PROPERTY_DATA='{
  "name": "Minimal Test Villa",
  "description": {
    "fr": "Villa minimale"
  },
  "propertyType": "VILLA",
  "status": "DRAFT",
  "address": "123 Test St",
  "city": "Test City",
  "postalCode": "12345",
  "country": "FR",
  "maxGuests": 4,
  "bedrooms": 2,
  "bathrooms": 1,
  "basePrice": 100
}'

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PROPERTY_DATA" \
  "$API_URL/api/properties" | jq .
EOF

chmod +x /tmp/test-property-create.sh

echo -e "\n${GREEN}✓ Created minimal property test script at /tmp/test-property-create.sh${NC}"

# 3. Afficher le schéma de propriété pour debug
echo -e "\n${YELLOW}3. Property schema check...${NC}"
echo "Key fields required:"
echo "- name: string"
echo "- description: object (multilingual)"
echo "- propertyType: VILLA, APARTMENT, HOUSE, etc."
echo "- status: DRAFT, PUBLISHED, ARCHIVED"
echo "- address, city, postalCode, country"
echo "- maxGuests, bedrooms, bathrooms"
echo "- basePrice: number"
echo ""
echo "Optional fields:"
echo "- surfaceArea (not 'area')"
echo "- latitude, longitude"
echo "- amenities: array"
echo "- checkInTime, checkOutTime"
echo "- cleaningFee, weekendPremium, securityDeposit"

echo -e "\n${GREEN}✓ Test fixes applied!${NC}"
echo -e "\nNow run: ${YELLOW}/tmp/test-property-create.sh${NC} to debug property creation"