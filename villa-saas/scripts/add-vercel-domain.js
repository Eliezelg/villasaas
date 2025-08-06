import { PrismaClient } from '@villa-saas/database';

const prisma = new PrismaClient();

async function updatePublicSiteForVercel() {
  try {
    // Trouver le tenant testcompany
    const tenant = await prisma.tenant.findFirst({
      where: { 
        subdomain: 'testcompany' 
      }
    });

    if (!tenant) {
      console.error('❌ Tenant testcompany non trouvé');
      return;
    }

    console.log('✅ Tenant trouvé:', tenant.id);

    // Vérifier si un PublicSite existe déjà
    const existingSite = await prisma.publicSite.findUnique({
      where: { tenantId: tenant.id }
    });

    if (existingSite) {
      console.log('📋 PublicSite existant trouvé:', {
        domain: existingSite.domain,
        subdomain: existingSite.subdomain,
        isActive: existingSite.isActive
      });

      // Pour le moment, on garde www.webpro200.com comme domaine principal
      // Le domaine Vercel sera géré via le subdomain
      console.log('\n🔍 Configuration actuelle:');
      console.log('- Domaine principal:', existingSite.domain);
      console.log('- Subdomain:', existingSite.subdomain);
      console.log('- Actif:', existingSite.isActive);
      
      console.log('\n💡 Note: Le domaine Vercel (villasaas10-blbcz4adr-villa-saas.vercel.app)');
      console.log('devrait accéder au tenant via le subdomain "testcompany"');
      
    } else {
      // Créer un nouveau PublicSite si nécessaire
      const newSite = await prisma.publicSite.create({
        data: {
          tenantId: tenant.id,
          domain: 'www.webpro200.com',
          subdomain: 'testcompany',
          isActive: true,
          defaultLocale: 'fr',
          theme: {
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981'
          }
        }
      });
      console.log('✅ PublicSite créé:', newSite);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePublicSiteForVercel();