import { PrismaClient } from '@villa-saas/database';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up demo data...');

  // Créer le tenant demo
  let tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' }
  });

  if (!tenant) {
    console.log('📦 Creating demo tenant...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Villa Rentals',
        subdomain: 'demo',
        settings: {
          theme: {
            primaryColor: '#0f172a',
            secondaryColor: '#3b82f6'
          }
        }
      }
    });
  }

  // Créer un utilisateur admin
  let user = await prisma.user.findFirst({
    where: {
      email: 'admin@demo.localhost',
      tenantId: tenant.id
    }
  });

  if (!user) {
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Demo1234!', 10);
    user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@demo.localhost',
        firstName: 'Admin',
        lastName: 'Demo',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });
  }

  // Créer le PublicSite
  let publicSite = await prisma.publicSite.findFirst({
    where: { tenantId: tenant.id }
  });

  if (!publicSite) {
    console.log('🌐 Creating public site...');
    publicSite = await prisma.publicSite.create({
      data: {
        tenantId: tenant.id,
        subdomain: 'demo',
        isActive: true,
        defaultLocale: 'fr',
        locales: ['fr', 'en'],
        metadata: {
          title: 'Demo Villa Rentals',
          description: 'Location de villas de luxe'
        }
      }
    });
  }

  // Créer une propriété de démonstration
  let property = await prisma.property.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Villa Paradis'
    }
  });

  if (!property) {
    console.log('🏠 Creating demo property...');
    property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        name: 'Villa Paradis',
        slug: 'villa-paradis',
        propertyType: 'VILLA',
        status: 'PUBLISHED',
        description: {
          fr: "Magnifique villa avec vue sur mer, piscine privée et jardin tropical. Idéale pour des vacances de rêve en famille ou entre amis. Cette villa moderne offre tout le confort nécessaire pour un séjour inoubliable sur la Côte d'Azur.",
          en: "Magnificent villa with sea view, private pool and tropical garden. Ideal for dream holidays with family or friends. This modern villa offers all the necessary comfort for an unforgettable stay on the French Riviera."
        },
        address: '123 Rue de la Plage',
        city: 'Nice',
        postalCode: '06000',
        country: 'France',
        latitude: 43.6951,
        longitude: 7.2619,
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        surfaceArea: 250,
        basePrice: 350,
        cleaningFee: 150,
        securityDeposit: 1000,
        weekendPremium: 50,
        minNights: 3,
        checkInTime: '16:00',
        checkOutTime: '11:00',
        amenities: {
          wifi: true,
          pool: true,
          parking: true,
          airConditioning: true,
          kitchen: true,
          washingMachine: true,
          dishwasher: true,
          tv: true,
          heating: true,
          bbq: true,
          garden: true,
          terrace: true
        },
        atmosphere: {
          familyFriendly: 0.9,
          luxury: 0.8,
          beachfront: 0.9,
          peaceful: 0.7
        },
      }
    });

    // Ajouter quelques images de démonstration
    console.log('📸 Adding demo images...');
    const demoImages = [
      { 
        base: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9', 
        alt: 'Vue extérieure' 
      },
      { 
        base: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c', 
        alt: 'Salon' 
      },
      { 
        base: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d', 
        alt: 'Piscine' 
      },
      { 
        base: 'https://images.unsplash.com/photo-1600607688066-890987f18a86', 
        alt: 'Chambre principale' 
      }
    ];

    for (let i = 0; i < demoImages.length; i++) {
      await prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          url: `${demoImages[i].base}?w=1200&q=80`,
          alt: demoImages[i].alt,
          order: i,
          urls: {
            small: `${demoImages[i].base}?w=400&q=80`,
            medium: `${demoImages[i].base}?w=800&q=80`,
            large: `${demoImages[i].base}?w=1200&q=80`,
            original: `${demoImages[i].base}?w=1920&q=90`
          }
        }
      });
    }
  }

  console.log('✅ Demo data setup complete!');
  console.log(`\n🔐 Login credentials:
  Email: admin@demo.localhost
  Password: Demo1234!
  
🌐 Access the booking site at:
  http://demo.localhost:3002
  
📊 Access the admin dashboard at:
  http://localhost:3000
  
🏠 View the property at:
  http://demo.localhost:3002/properties/${property.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });