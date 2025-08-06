#!/usr/bin/env node
const { PrismaClient } = require('@villa-saas/database');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Correction de la configuration des domaines...\n');
  
  try {
    // Trouver le PublicSite qui utilise incorrectement www.webpro200.com
    const incorrectSite = await prisma.publicSite.findFirst({
      where: {
        domain: 'www.webpro200.com'
      },
      include: {
        tenant: true
      }
    });

    if (incorrectSite) {
      console.log(`❌ Trouvé un PublicSite utilisant incorrectement www.webpro200.com`);
      console.log(`   Tenant: ${incorrectSite.tenant.name}`);
      console.log(`   ID: ${incorrectSite.id}`);
      
      // Retirer le domaine personnalisé
      const updated = await prisma.publicSite.update({
        where: { id: incorrectSite.id },
        data: { domain: null }
      });
      
      console.log(`✅ Domaine personnalisé retiré`);
      console.log(`   Le site est maintenant accessible sur: ${updated.subdomain}.webpro200.com`);
    } else {
      console.log('✅ Aucune configuration incorrecte trouvée');
    }

    // Afficher la configuration correcte
    console.log('\n📐 Configuration correcte :');
    console.log('================================');
    console.log('🏛️  www.webpro200.com → Administration centralisée (tous les propriétaires)');
    console.log('🌐 [subdomain].webpro200.com → Sites publics de réservation');
    console.log('🔗 [custom-domain].com → Domaines personnalisés (optionnel)');
    
    // Lister tous les sites correctement configurés
    console.log('\n📋 Sites actuels :');
    const sites = await prisma.publicSite.findMany({
      where: { isActive: true },
      include: { tenant: true }
    });

    for (const site of sites) {
      console.log(`\n🏢 ${site.tenant.name}`);
      console.log(`   - Admin: www.webpro200.com`);
      console.log(`   - Site public: ${site.subdomain}.webpro200.com`);
      if (site.domain) {
        console.log(`   - Domaine personnalisé: ${site.domain}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);