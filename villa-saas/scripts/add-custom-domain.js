#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCustomDomain(tenantId, customDomain) {
  try {
    // Vérifier que le tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { publicSite: true }
    });

    if (!tenant) {
      console.error(`❌ Tenant ${tenantId} not found`);
      return;
    }

    // Mettre à jour ou créer le PublicSite
    if (tenant.publicSite) {
      // Mettre à jour le domaine existant
      const updated = await prisma.publicSite.update({
        where: { id: tenant.publicSite.id },
        data: { domain: customDomain }
      });
      console.log(`✅ Updated domain for ${tenant.name}: ${customDomain}`);
    } else {
      // Créer un nouveau PublicSite si nécessaire
      const created = await prisma.publicSite.create({
        data: {
          tenantId: tenant.id,
          domain: customDomain,
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
      console.log(`✅ Created PublicSite for ${tenant.name} with domain: ${customDomain}`);
    }

    console.log('\n📝 Next steps:');
    console.log('1. Add the domain to Vercel project');
    console.log('2. Configure DNS records:');
    console.log('   - A record: 76.76.21.21');
    console.log('   - CNAME: cname.vercel-dns.com');
    console.log('3. Wait for DNS propagation (5-30 minutes)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Utilisation en ligne de commande
const [,, tenantId, domain] = process.argv;

if (!tenantId || !domain) {
  console.log('Usage: node add-custom-domain.js <tenantId> <domain>');
  console.log('Example: node add-custom-domain.js tenant-123 www.example.com');
  process.exit(1);
}

addCustomDomain(tenantId, domain);