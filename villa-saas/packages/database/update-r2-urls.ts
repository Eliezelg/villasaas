import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateR2Urls() {
  const oldDomain = 'https://pub-88cf1b8c19574d4fa2c648f5b8ca9c14.r2.dev'
  const newDomain = 'https://pub-85fe05f2657948159cf737500dd6f474.r2.dev'
  
  // Récupérer toutes les images avec l'ancien domaine
  const images = await prisma.propertyImage.findMany({
    where: {
      url: {
        contains: oldDomain
      }
    }
  })
  
  console.log(`Found ${images.length} images to update`)
  
  // Mettre à jour chaque image
  for (const image of images) {
    const newUrl = image.url.replace(oldDomain, newDomain)
    const newUrls: Record<string, any> = {}
    
    // Mettre à jour toutes les URLs dans le champ JSON
    if (image.urls && typeof image.urls === 'object') {
      for (const [key, value] of Object.entries(image.urls)) {
        if (typeof value === 'string') {
          newUrls[key] = value.replace(oldDomain, newDomain)
        }
      }
    }
    
    await prisma.propertyImage.update({
      where: { id: image.id },
      data: {
        url: newUrl,
        urls: newUrls
      }
    })
    
    console.log(`Updated image ${image.id}`)
  }
  
  console.log('Done!')
}

updateR2Urls()
  .catch(console.error)
  .finally(() => prisma.$disconnect())