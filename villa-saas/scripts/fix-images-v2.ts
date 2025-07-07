import { PrismaClient } from '@villa-saas/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing property images URLs...');

  // Les vraies URLs complètes des images Unsplash
  const correctImages = [
    {
      id: 'photo-1600596542815-ffad4c1539a9',
      alt: 'Vue extérieure'
    },
    {
      id: 'photo-1600607687939-ce8a6c25118c',
      alt: 'Salon'
    },
    {
      id: 'photo-1600607687920-4e2a09cf159d',
      alt: 'Piscine'
    },
    {
      id: 'photo-1600607688066-890987f18a86',
      alt: 'Chambre principale'
    }
  ];

  // Récupérer la propriété Villa Paradis
  const property = await prisma.property.findFirst({
    where: {
      name: 'Villa Paradis'
    },
    include: {
      images: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!property) {
    console.log('❌ Property Villa Paradis not found');
    return;
  }

  // Supprimer les anciennes images
  await prisma.propertyImage.deleteMany({
    where: { propertyId: property.id }
  });

  console.log('📸 Creating new images with correct URLs...');

  // Créer de nouvelles images avec les bonnes URLs
  for (let i = 0; i < correctImages.length; i++) {
    const baseUrl = `https://images.unsplash.com/${correctImages[i].id}`;
    
    await prisma.propertyImage.create({
      data: {
        propertyId: property.id,
        url: `${baseUrl}?w=1200&q=80`,
        alt: correctImages[i].alt,
        order: i,
        isPrimary: i === 0,
        urls: {
          small: `${baseUrl}?w=400&q=80`,
          medium: `${baseUrl}?w=800&q=80`,
          large: `${baseUrl}?w=1200&q=80`,
          original: `${baseUrl}?w=1920&q=90`
        }
      }
    });
    
    console.log(`✅ Created image ${i + 1}: ${correctImages[i].alt}`);
  }

  console.log('✅ All images fixed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });