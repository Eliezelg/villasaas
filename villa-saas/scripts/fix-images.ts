import { PrismaClient } from '@villa-saas/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing property images...');

  // Récupérer toutes les images
  const images = await prisma.propertyImage.findMany();

  for (const image of images) {
    // Extraire l'ID de l'image Unsplash de l'URL
    const match = image.url.match(/photo-(\d+)-/);
    if (match) {
      const baseUrl = `https://images.unsplash.com/photo-${match[1]}`;
      
      console.log(`📸 Updating image ${image.id}...`);
      
      await prisma.propertyImage.update({
        where: { id: image.id },
        data: {
          url: `${baseUrl}?w=1200&q=80`,
          urls: {
            small: `${baseUrl}?w=400&q=80`,
            medium: `${baseUrl}?w=800&q=80`,
            large: `${baseUrl}?w=1200&q=80`,
            original: `${baseUrl}?w=1920&q=90`
          }
        }
      });
    }
  }

  console.log('✅ Images fixed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });