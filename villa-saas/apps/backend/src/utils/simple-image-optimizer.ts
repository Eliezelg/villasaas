import path from 'path';
import fs from 'fs/promises';

interface ImageUrls {
  [key: string]: string;
}

export async function optimizeImage(
  inputPath: string,
  outputDir: string,
  baseFilename: string
): Promise<ImageUrls> {
  // For now, just move the file without optimization
  // In production, you would use sharp or a cloud service
  
  const ext = path.extname(inputPath);
  const filename = `${baseFilename}${ext}`;
  const outputPath = path.join(outputDir, filename);
  
  // Move file to final location
  await fs.rename(inputPath, outputPath);
  
  // Return URLs for different sizes (all pointing to the same file for now)
  const url = `/uploads/properties/${filename}`;
  
  return {
    small: url,
    medium: url,
    large: url,
    original: url
  };
}

export async function deleteImageVariants(baseUrl: string, uploadDir: string): Promise<void> {
  // Extract filename from URL
  const filename = path.basename(baseUrl);
  const filePath = path.join(uploadDir, filename);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
  }
}