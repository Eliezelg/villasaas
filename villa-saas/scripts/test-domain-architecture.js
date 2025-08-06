#!/usr/bin/env node
const { PrismaClient } = require('@villa-saas/database');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Test de l\'architecture des domaines Villa SaaS\n');
  
  try {
    // 1. Vérifier les tenants existants
    console.log('📊 Tenants existants :');
    const tenants = await prisma.tenant.findMany({
      include: {
        publicSite: true
      }
    });

    for (const tenant of tenants) {
      console.log(`\n🏢 ${tenant.name}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Email: ${tenant.email}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      
      if (tenant.publicSite) {
        console.log(`   ✅ PublicSite configuré:`);
        console.log(`      - Subdomain: ${tenant.publicSite.subdomain}`);
        console.log(`      - Domain personnalisé: ${tenant.publicSite.domain || 'Aucun'}`);
        console.log(`      - Actif: ${tenant.publicSite.isActive ? 'Oui' : 'Non'}`);
        
        // URLs d'accès
        console.log(`\n   📍 URLs d'accès:`);
        console.log(`      - Admin: https://www.webpro200.fr/admin/login`);
        if (tenant.publicSite.subdomain) {
          console.log(`      - Site public: https://${tenant.publicSite.subdomain}.webpro200.fr`);
        }
        if (tenant.publicSite.domain) {
          console.log(`      - Domaine personnalisé: https://${tenant.publicSite.domain}`);
        }
      } else {
        console.log(`   ❌ Pas de PublicSite configuré`);
      }
    }

    // 2. Vérifier les PublicSites orphelins
    console.log('\n\n📋 Vérification des PublicSites orphelins :');
    const orphanedSites = await prisma.publicSite.findMany({
      where: {
        tenant: null
      }
    });

    if (orphanedSites.length > 0) {
      console.log(`❌ ${orphanedSites.length} PublicSites orphelins trouvés`);
    } else {
      console.log('✅ Aucun PublicSite orphelin');
    }

    // 3. Résumé de l'architecture
    console.log('\n\n📐 Architecture actuelle :');
    console.log('================================');
    console.log('🏛️  Domaine principal (Admin) : www.webpro200.fr');
    console.log('   → Tous les propriétaires se connectent ici');
    console.log('   → Gestion centralisée des propriétés et réservations');
    console.log('');
    console.log('🌐 Sites publics (Réservations) :');
    
    const activeSites = await prisma.publicSite.findMany({
      where: { isActive: true },
      include: { tenant: true }
    });

    for (const site of activeSites) {
      if (site.subdomain) {
        console.log(`   → ${site.subdomain}.webpro200.fr (${site.tenant?.name})`);
      }
      if (site.domain) {
        console.log(`   → ${site.domain} (domaine personnalisé)`);
      }
    }

    // 4. Instructions pour tester
    console.log('\n\n🧪 Pour tester l\'architecture :');
    console.log('================================');
    console.log('1. Connexion admin : https://www.webpro200.fr/admin/login');
    console.log('2. Site public : https://[subdomain].webpro200.fr');
    console.log('3. Domaine personnalisé : Configurer le DNS (CNAME vers cname.vercel-dns.com)');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);