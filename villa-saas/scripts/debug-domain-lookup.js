#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDomainLookup() {
  try {
    console.log('🔍 Débogage de la recherche de domaine...\n');
    
    // 1. Vérifier tous les PublicSites
    const publicSites = await prisma.publicSite.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            customDomain: true
          }
        }
      }
    });

    console.log(`📋 PublicSites trouvés: ${publicSites.length}`);
    publicSites.forEach(site => {
      console.log(`\n🏢 Tenant: ${site.tenant.name}`);
      console.log(`   ID: ${site.tenant.id}`);
      console.log(`   Sous-domaine: ${site.subdomain}`);
      console.log(`   Domaine personnalisé: ${site.domain || 'Aucun'}`);
      console.log(`   Actif: ${site.isActive ? 'Oui' : 'Non'}`);
    });

    // 2. Rechercher spécifiquement www.webpro200.com
    console.log('\n🔎 Recherche de www.webpro200.com...');
    const siteWithDomain = await prisma.publicSite.findFirst({
      where: { domain: 'www.webpro200.com' },
      include: { tenant: true }
    });

    if (siteWithDomain) {
      console.log('✅ Domaine trouvé !');
      console.log(`   Tenant: ${siteWithDomain.tenant.name}`);
      console.log(`   Tenant ID: ${siteWithDomain.tenant.id}`);
    } else {
      console.log('❌ Domaine non trouvé dans PublicSite');
    }

    // 3. Vérifier aussi la table Tenant directement
    console.log('\n🔎 Recherche dans la table Tenant...');
    const tenantWithDomain = await prisma.tenant.findFirst({
      where: { customDomain: 'www.webpro200.com' }
    });

    if (tenantWithDomain) {
      console.log('✅ Domaine trouvé dans Tenant !');
      console.log(`   Tenant: ${tenantWithDomain.name}`);
      console.log(`   ID: ${tenantWithDomain.id}`);
    } else {
      console.log('❌ Domaine non trouvé dans Tenant.customDomain');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDomainLookup();