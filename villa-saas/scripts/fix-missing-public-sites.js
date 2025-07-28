#!/usr/bin/env node
const { PrismaClient } = require('@villa-saas/database');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Recherche des tenants sans PublicSite...');
  
  try {
    // Récupérer tous les tenants qui n'ont pas de PublicSite
    const tenantsWithoutPublicSite = await prisma.tenant.findMany({
      where: {
        publicSite: null
      },
      include: {
        publicSite: true
      }
    });

    console.log(`📊 ${tenantsWithoutPublicSite.length} tenants trouvés sans PublicSite`);

    if (tenantsWithoutPublicSite.length === 0) {
      console.log('✅ Tous les tenants ont déjà un PublicSite!');
      return;
    }

    // Créer un PublicSite pour chaque tenant qui n'en a pas
    for (const tenant of tenantsWithoutPublicSite) {
      console.log(`\n🏢 Traitement du tenant: ${tenant.name} (${tenant.id})`);
      console.log(`  📧 Email: ${tenant.email}`);
      console.log(`  🌐 Subdomain: ${tenant.subdomain}`);
      console.log(`  🔗 Custom Domain: ${tenant.customDomain || 'Aucun'}`);

      try {
        // Créer le PublicSite
        const publicSite = await prisma.publicSite.create({
          data: {
            tenantId: tenant.id,
            subdomain: tenant.subdomain,
            domain: tenant.customDomain, // Utiliser le customDomain du tenant s'il existe
            theme: {
              primaryColor: '#6B46C1',
              secondaryColor: '#9333EA',
              fontFamily: 'Inter',
              showPrices: true,
              allowBooking: true,
              showAvailability: true,
            },
            isActive: true,
            logo: null,
            favicon: null,
            metadata: {
              seo: {
                title: `${tenant.name} - Locations de vacances`,
                description: `Découvrez nos propriétés disponibles à la location`,
                keywords: ['location', 'vacances', 'villa', 'appartement'],
              },
              socialLinks: {},
              analytics: {},
            },
            defaultLocale: 'fr',
            locales: ['fr'],
            googleAnalyticsId: null,
            facebookPixelId: null,
          },
        });

        console.log(`  ✅ PublicSite créé avec succès!`);
        console.log(`     - ID: ${publicSite.id}`);
        console.log(`     - Subdomain: ${publicSite.subdomain}`);
        console.log(`     - Domain: ${publicSite.domain || 'Aucun'}`);

        // Log d'audit
        await prisma.auditLog.create({
          data: {
            tenantId: tenant.id,
            action: 'publicSite.created.script',
            entity: 'publicSite',
            entityId: publicSite.id,
            details: {
              createdBy: 'fix-missing-public-sites.js',
              subdomain: publicSite.subdomain,
              domain: publicSite.domain,
            },
          },
        });

      } catch (error) {
        console.error(`  ❌ Erreur lors de la création du PublicSite:`, error.message);
      }
    }

    console.log('\n✅ Script terminé!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);