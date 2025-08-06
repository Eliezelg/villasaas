const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTenantPublicSite() {
  try {
    // Trouver tous les tenants qui n'ont pas de PublicSite
    const tenants = await prisma.tenant.findMany({
      where: {
        publicSite: null
      }
    });

    console.log(`Found ${tenants.length} tenants without PublicSite`);

    for (const tenant of tenants) {
      // Créer un PublicSite pour chaque tenant
      const publicSite = await prisma.publicSite.create({
        data: {
          tenantId: tenant.id,
          domain: `${tenant.subdomain}.webpro200.fr`,
          subdomain: tenant.subdomain,
          isActive: true,
          defaultLocale: 'fr',
          theme: {
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981',
            fontFamily: 'Inter',
            borderRadius: 'md'
          }
        }
      });

      console.log(`Created PublicSite for tenant ${tenant.name} (${tenant.subdomain})`);
    }

    // Vérifier aussi si webpro200.fr est configuré
    const mainSite = await prisma.publicSite.findFirst({
      where: {
        domain: 'www.webpro200.fr'
      }
    });

    if (!mainSite) {
      // Trouver le tenant testcompany
      const testTenant = await prisma.tenant.findFirst({
        where: {
          subdomain: 'testcompany'
        }
      });

      if (testTenant) {
        await prisma.publicSite.create({
          data: {
            tenantId: testTenant.id,
            domain: 'www.webpro200.fr',
            subdomain: 'testcompany',
            isActive: true,
            defaultLocale: 'fr',
            theme: {
              primaryColor: '#3B82F6',
              secondaryColor: '#10B981',
              fontFamily: 'Inter',
              borderRadius: 'md'
            }
          }
        });
        console.log('Created PublicSite for www.webpro200.fr');
      }
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTenantPublicSite();