// Script pour ajouter une propriété de démonstration avec images
const fetch = require('node-fetch');

const API_URL = 'http://api.webpro200.com';

async function login() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@demo.localhost',
      password: 'Demo1234!'
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Login failed: ${data.error || 'Unknown error'}`);
  }

  return data.accessToken;
}

async function createProperty(token) {
  const response = await fetch(`${API_URL}/api/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Villa Paradis',
      type: 'VILLA',
      status: 'PUBLISHED',
      description: {
        fr: "Magnifique villa avec vue sur mer, piscine privée et jardin tropical. Idéale pour des vacances de rêve en famille ou entre amis.",
        en: "Magnificent villa with sea view, private pool and tropical garden. Ideal for dream holidays with family or friends."
      },
      address: '123 Rue de la Plage',
      city: 'Nice',
      postalCode: '06000',
      country: 'France',
      latitude: 43.6951,
      longitude: 7.2619,
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 3,
      beds: 6,
      surfaceArea: 250,
      plot: 1200,
      yearBuilt: 2018,
      renovatedYear: 2023,
      floors: 2,
      propertyType: 'DETACHED',
      basePrice: 350,
      cleaningFee: 150,
      securityDeposit: 1000,
      taxRate: 0.033,
      weekendPremium: 50,
      minNights: 3,
      maxNights: 30,
      checkInTime: '16:00',
      checkOutTime: '11:00',
      amenities: ['wifi', 'pool', 'parking', 'airConditioning', 'kitchen', 'washingMachine', 'dishwasher', 'tv', 'heating', 'bbq', 'garden', 'terrace'],
      atmosphere: ['familyFriendly', 'luxury', 'beachfront', 'peaceful'],
      houseRules: {
        smokingAllowed: false,
        petsAllowed: true,
        partiesAllowed: false,
        childrenAllowed: true,
        additionalRules: "Respectez le voisinage. Pas de bruit après 22h."
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Create property failed: ${data.error || 'Unknown error'}`);
  }

  return data;
}

async function main() {
  try {
    console.log('🔐 Connexion...');
    const token = await login();
    console.log('✅ Connecté avec succès');

    console.log('🏠 Création de la propriété...');
    const property = await createProperty(token);
    console.log('✅ Propriété créée:', property.name);

    console.log('\n📸 Note: Pour ajouter des images, utilisez l\'interface d\'administration ou l\'API d\'upload');
    console.log(`Property ID: ${property.id}`);
    console.log(`URL: http://demo.webpro200.com/properties/${property.id}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();