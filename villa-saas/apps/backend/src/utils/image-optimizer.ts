import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface ImageSize {
  width: number;
  height: number;
  suffix: string;
}

const IMAGE_SIZES: ImageSize[] = [
  { width: 1920, height: 1080, suffix: 'large' },   // Full size
  { width: 800, height: 600, suffix: 'medium' },    // Medium size
  { width: 400, height: 300, suffix: 'small' },     // Thumbnail
];

export async function optimizeImage(
  inputPath: string,
  outputDir: string,
  baseFilename: string
): Promise<{ [key: string]: string }> {
  const ext = '.webp'; // Convert all images to WebP for better compression
  const urls: { [key: string]: string } = {};

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Read the original image
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Generate optimized versions
  for (const size of IMAGE_SIZES) {
    const filename = `${baseFilename}_${size.suffix}${ext}`;
    const outputPath = path.join(outputDir, filename);

    // Only resize if the original is larger
    if (metadata.width && metadata.height && 
        (metadata.width > size.width || metadata.height > size.height)) {
      await image
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(outputPath);
    } else {
      // If original is smaller, just convert to WebP
      await image
        .webp({ quality: 85 })
        .toFile(outputPath);
    }

    urls[size.suffix] = `/uploads/properties/${filename}`;
  }

  // Create a high-quality original version in WebP
  const originalFilename = `${baseFilename}_original${ext}`;
  const originalPath = path.join(outputDir, originalFilename);
  await sharp(inputPath)
    .webp({ quality: 90 })
    .toFile(originalPath);
  
  urls.original = `/uploads/properties/${originalFilename}`;

  // Delete the original uploaded file to save space
  await fs.unlink(inputPath);

  return urls;
}

export async function deleteImageVariants(baseUrl: string, uploadDir: string): Promise<void> {
  // Extract base filename from URL
  const filename = path.basename(baseUrl);
  const baseName = filename.split('_')[0] + '_' + filename.split('_')[1];

  // Delete all variants
  const suffixes = ['small', 'medium', 'large', 'original'];
  
  for (const suffix of suffixes) {
    const variantPath = path.join(uploadDir, `${baseName}_${suffix}.webp`);
    try {
      await fs.unlink(variantPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }
}