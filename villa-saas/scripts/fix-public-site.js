const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Trouver le tenant "Test Company"
    const tenant = await prisma.tenant.findFirst({
      where: {
        subdomain: 'testcompany'
      }
    });

    if (!tenant) {
      console.error('Tenant not found');
      return;
    }

    console.log('Found tenant:', tenant.id, tenant.name);

    // Vérifier si un PublicSite existe déjà
    const existingPublicSite = await prisma.publicSite.findUnique({
      where: {
        tenantId: tenant.id
      }
    });

    if (existingPublicSite) {
      // Mettre à jour le domaine
      const updated = await prisma.publicSite.update({
        where: {
          id: existingPublicSite.id
        },
        data: {
          domain: 'www.webpro200.fr',
          isActive: true
        }
      });
      console.log('Updated PublicSite:', updated);
    } else {
      // Créer un nouveau PublicSite
      const created = await prisma.publicSite.create({
        data: {
          tenantId: tenant.id,
          domain: 'www.webpro200.fr',
          subdomain: 'testcompany',
          isActive: true,
          defaultLocale: 'fr',
          theme: {
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981'
          }
        }
      });
      console.log('Created PublicSite:', created);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();