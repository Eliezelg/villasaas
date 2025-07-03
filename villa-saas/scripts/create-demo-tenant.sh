#!/bin/bash

# Script pour créer un tenant de démonstration avec site public

API_URL="http://localhost:3001"

echo "🏗️  Création d'un tenant de démonstration..."

# 1. Créer un utilisateur/tenant
echo "1. Création du tenant..."
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@villa-booking.com",
    "password": "demo123456",
    "firstName": "Demo",
    "lastName": "User",
    "companyName": "Villa Demo"
  }' \
  "$API_URL/api/auth/register")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
TENANT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.tenant.id')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur lors de la création du tenant"
  echo "$REGISTER_RESPONSE" | jq .
  exit 1
fi

echo "✅ Tenant créé avec succès"
echo "   ID: $TENANT_ID"
echo "   Token: $TOKEN"

# 2. Créer le site public via Prisma
echo -e "\n2. Création du site public..."
cat > /tmp/create-public-site.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = process.argv[2];
  
  const publicSite = await prisma.publicSite.create({
    data: {
      tenantId,
      subdomain: 'demo',
      isActive: true,
      theme: {
        primaryColor: '221.2 83.2% 53.3%',
        secondaryColor: '210 40% 96.1%',
        fontFamily: 'Inter'
      },
      metadata: {
        title: 'Villa Demo - Location de villas de luxe',
        description: 'Découvrez notre sélection de villas exceptionnelles',
        keywords: ['villa', 'location', 'vacances', 'luxe']
      },
      defaultLocale: 'fr',
      locales: ['fr', 'en']
    }
  });
  
  console.log('Public site created:', publicSite);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOF

cd packages/database && node /tmp/create-public-site.js "$TENANT_ID"
cd ../..

# 3. Créer quelques propriétés de test
echo -e "\n3. Création de propriétés de test..."

# Propriété 1
PROPERTY1=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Villa Azur - Vue Mer Panoramique",
    "description": {
      "fr": "Magnifique villa avec vue imprenable sur la mer Méditerranée. Cette propriété d exception offre tout le confort moderne dans un cadre idyllique. Profitez de la piscine à débordement, du jacuzzi et des vastes espaces de vie pour des vacances inoubliables.",
      "en": "Magnificent villa with breathtaking views of the Mediterranean Sea. This exceptional property offers all modern comforts in an idyllic setting. Enjoy the infinity pool, jacuzzi and spacious living areas for an unforgettable vacation."
    },
    "propertyType": "VILLA",
    "status": "PUBLISHED",
    "address": "123 Chemin des Oliviers",
    "city": "Saint-Tropez",
    "postalCode": "83990",
    "country": "FR",
    "latitude": 43.2677,
    "longitude": 6.6407,
    "maxGuests": 10,
    "bedrooms": 5,
    "bathrooms": 4,
    "surfaceArea": 350,
    "amenities": ["wifi", "pool", "parking", "airConditioning", "kitchen", "washingMachine", "dryer", "tv", "heating", "jacuzzi", "garden", "bbq", "gym"],
    "atmosphere": ["luxury", "familyFriendly", "romantic", "seaside", "peaceful"],
    "checkInTime": "16:00",
    "checkOutTime": "10:00",
    "basePrice": 800,
    "weekendPremium": 100,
    "cleaningFee": 200,
    "securityDeposit": 2000,
    "minNights": 7
  }' \
  "$API_URL/api/properties")

PROPERTY1_ID=$(echo "$PROPERTY1" | jq -r '.id')
echo "✅ Propriété 1 créée: $PROPERTY1_ID"

# Propriété 2
PROPERTY2=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Mas Provençal - Charme Authentique",
    "description": {
      "fr": "Authentique mas provençal rénové avec goût, niché au cœur des vignobles. Cette demeure de caractère allie le charme de l ancien au confort moderne. Idéal pour des vacances en famille ou entre amis dans la campagne provençale.",
      "en": "Authentic Provencal farmhouse tastefully renovated, nestled in the heart of the vineyards. This character property combines old-world charm with modern comfort. Ideal for family holidays or with friends in the Provencal countryside."
    },
    "propertyType": "HOUSE",
    "status": "PUBLISHED",
    "address": "456 Route des Vignes",
    "city": "Gordes",
    "postalCode": "84220",
    "country": "FR",
    "latitude": 43.9116,
    "longitude": 5.2002,
    "maxGuests": 8,
    "bedrooms": 4,
    "bathrooms": 3,
    "surfaceArea": 280,
    "amenities": ["wifi", "pool", "parking", "airConditioning", "kitchen", "washingMachine", "tv", "heating", "fireplace", "garden", "bbq", "petanque"],
    "atmosphere": ["rustic", "familyFriendly", "countryside", "peaceful", "charming"],
    "checkInTime": "15:00",
    "checkOutTime": "11:00",
    "basePrice": 450,
    "weekendPremium": 50,
    "cleaningFee": 150,
    "securityDeposit": 1500,
    "minNights": 4
  }' \
  "$API_URL/api/properties")

PROPERTY2_ID=$(echo "$PROPERTY2" | jq -r '.id')
echo "✅ Propriété 2 créée: $PROPERTY2_ID"

# 4. Créer des périodes tarifaires
echo -e "\n4. Création de périodes tarifaires..."

# Haute saison pour propriété 1
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "propertyId": "'$PROPERTY1_ID'",
    "name": "Haute Saison 2024",
    "startDate": "2024-07-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z",
    "basePrice": 1200,
    "weekendPremium": 150,
    "minNights": 7,
    "priority": 10,
    "isActive": true
  }' \
  "$API_URL/api/periods" > /dev/null

echo "✅ Périodes tarifaires créées"

# 5. Afficher les informations de connexion
echo -e "\n${GREEN}✅ Tenant de démonstration créé avec succès !${NC}"
echo -e "\n📋 Informations de connexion :"
echo "   Email: demo@villa-booking.com"
echo "   Mot de passe: demo123456"
echo -e "\n🌐 URLs de test :"
echo "   Dashboard: http://localhost:3000"
echo "   Site public: http://demo.localhost:3002"
echo -e "\n💡 Le sous-domaine 'demo' est maintenant configuré pour ce tenant."

rm -f /tmp/create-public-site.js