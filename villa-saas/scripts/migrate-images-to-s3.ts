import { PrismaClient } from '@villa-saas/database';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Configuration S3
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.AWS_S3_BUCKET || 'familink-test';

async function uploadToS3(url: string, key: string): Promise<string> {
  try {
    // Télécharger l'image
    const response = await fetch(url);
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Upload vers S3
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    }));

    // Retourner l'URL S3
    return `https://${bucketName}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error(`Failed to upload ${url}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting image migration to S3...');

  // Récupérer toutes les images
  const images = await prisma.propertyImage.findMany({
    include: {
      property: {
        select: {
          id: true,
          tenantId: true,
        },
      },
    },
  });

  console.log(`Found ${images.length} images to migrate`);

  for (const image of images) {
    console.log(`\n📸 Processing image ${image.id}...`);

    // Skip si déjà sur S3
    if (image.url.includes('s3.amazonaws.com') || image.url.includes('cloudfront.net')) {
      console.log('✅ Already on S3, skipping');
      continue;
    }

    try {
      const baseKey = `properties/${image.property.tenantId}/${image.property.id}/${Date.now()}-${image.id}`;
      const newUrls: Record<string, string> = {};

      // Upload chaque taille si elle existe
      if (image.urls && typeof image.urls === 'object') {
        const urls = image.urls as any;
        
        for (const [size, url] of Object.entries(urls)) {
          if (typeof url === 'string') {
            const key = `${baseKey}-${size}.jpg`;
            console.log(`  Uploading ${size}...`);
            newUrls[size] = await uploadToS3(url, key);
          }
        }
      } else {
        // Si pas de variantes, uploader juste l'image principale
        const key = `${baseKey}-original.jpg`;
        console.log(`  Uploading original...`);
        newUrls.original = await uploadToS3(image.url, key);
        newUrls.large = newUrls.original;
        newUrls.medium = newUrls.original;
        newUrls.small = newUrls.original;
      }

      // Mettre à jour en base de données
      await prisma.propertyImage.update({
        where: { id: image.id },
        data: {
          url: newUrls.large || newUrls.original,
          urls: newUrls,
        },
      });

      console.log('✅ Image migrated successfully');
    } catch (error) {
      console.error(`❌ Failed to migrate image ${image.id}:`, error);
    }
  }

  console.log('\n✅ Migration complete!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });