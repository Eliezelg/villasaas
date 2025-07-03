// Script pour créer un site public pour le tenant demo
// À exécuter depuis la racine avec: node scripts/setup-public-site.js

require('dotenv').config({ path: './apps/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Trouver le tenant demo
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { email: 'demo@villa-booking.com' },
        { subdomain: 'demo' }
      ]
    }
  });

  if (!tenant) {
    console.error('❌ Tenant demo non trouvé');
    return;
  }

  console.log('✅ Tenant trouvé:', tenant.id);

  // Vérifier si un site public existe déjà
  const existingSite = await prisma.publicSite.findUnique({
    where: { tenantId: tenant.id }
  });

  if (existingSite) {
    console.log('✅ Site public déjà existant:', existingSite.subdomain);
    return;
  }

  // Créer le site public
  const publicSite = await prisma.publicSite.create({
    data: {
      tenantId: tenant.id,
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
      locales: JSON.stringify(['fr', 'en'])
    }
  });
  
  console.log('✅ Site public créé:', publicSite.subdomain);
  console.log('🌐 URL: http://demo.localhost:3002');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());