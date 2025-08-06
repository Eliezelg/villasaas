#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupCustomDomain() {
  try {
    // Trouver le tenant principal (ou créer un tenant de test)
    const tenant = await prisma.tenant.findFirst({
      include: { publicSite: true }
    });

    if (!tenant) {
      console.error('❌ Aucun tenant trouvé. Créez d\'abord un tenant.');
      return;
    }

    console.log(`✅ Tenant trouvé: ${tenant.name} (${tenant.id})`);

    // Vérifier si un PublicSite existe déjà
    if (!tenant.publicSite) {
      // Créer le PublicSite
      const publicSite = await prisma.publicSite.create({
        data: {
          tenantId: tenant.id,
          domain: 'www.webpro200.fr',
          subdomain: tenant.subdomain || 'demo',
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
      console.log('✅ PublicSite créé avec succès');
    } else {
      // Mettre à jour le domaine existant
      const updated = await prisma.publicSite.update({
        where: { id: tenant.publicSite.id },
        data: { 
          domain: 'www.webpro200.fr',
          isActive: true
        }
      });
      console.log('✅ PublicSite mis à jour avec le domaine www.webpro200.fr');
    }

    console.log('\n📝 Configuration terminée !');
    console.log('Le site devrait maintenant être accessible sur www.webpro200.fr');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupCustomDomain();