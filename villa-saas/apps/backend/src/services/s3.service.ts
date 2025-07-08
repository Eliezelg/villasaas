import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

export interface UploadOptions {
  folder?: string;
  sizes?: Array<{
    name: string;
    width: number;
    height?: number;
    quality?: number;
  }>;
}

export class S3Service {
  private s3: S3Client;
  private bucketName: string;
  private cdnDomain?: string;

  constructor(s3: S3Client) {
    this.s3 = s3;
    this.bucketName = process.env.AWS_S3_BUCKET || 'familink-test';
    this.cdnDomain = process.env.AWS_CDN_DOMAIN;
  }

  /**
   * Upload une image avec génération automatique de différentes tailles
   */
  async uploadImage(
    file: Buffer,
    mimetype: string,
    options: UploadOptions = {}
  ): Promise<{
    url: string;
    urls: Record<string, string>;
    key: string;
  }> {
    const folder = options.folder || 'properties';
    const fileId = randomUUID();
    const extension = mimetype.split('/')[1] || 'jpg';
    const baseKey = `${folder}/${fileId}`;

    // Tailles par défaut
    const sizes = options.sizes || [
      { name: 'small', width: 400, quality: 80 },
      { name: 'medium', width: 800, quality: 85 },
      { name: 'large', width: 1200, quality: 90 },
      { name: 'original', width: 1920, quality: 95 },
    ];

    const urls: Record<string, string> = {};

    // Upload de chaque taille
    for (const size of sizes) {
      let processedImage: Buffer;
      
      try {
        if (size.name === 'original') {
          // Pour l'original, on optimise juste la qualité
          processedImage = await sharp(file)
            .jpeg({ quality: size.quality, progressive: true })
            .toBuffer();
        } else {
          // Pour les autres tailles, on redimensionne
          processedImage = await sharp(file)
            .resize(size.width, size.height, { 
              fit: 'cover',
              withoutEnlargement: true 
            })
            .jpeg({ quality: size.quality, progressive: true })
            .toBuffer();
        }
        console.log(`Processed image ${size.name}: ${processedImage.length} bytes`);
      } catch (sharpError) {
        console.error(`Sharp processing failed for ${size.name}:`, sharpError);
        throw new Error(`Image processing failed: ${sharpError.message}`);
      }

      const key = `${baseKey}-${size.name}.jpg`;
      
      // Upload vers S3
      try {
        await this.s3.send(new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: processedImage,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000', // 1 an
          Metadata: {
            'x-amz-meta-size': size.name,
            'x-amz-meta-width': size.width.toString(),
          }
        }));
      } catch (uploadError) {
        console.error(`Failed to upload ${key}:`, uploadError);
        throw uploadError;
      }

      // Générer l'URL (CDN ou S3 direct)
      urls[size.name] = this.getPublicUrl(key);
    }

    return {
      url: urls.large || urls.original,
      urls,
      key: baseKey,
    };
  }

  /**
   * Génère une URL présignée pour l'upload direct depuis le frontend
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Supprime une image et toutes ses variantes
   */
  async deleteImage(baseKey: string): Promise<void> {
    const sizes = ['small', 'medium', 'large', 'original'];
    
    const deletePromises = sizes.map(size => 
      this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: `${baseKey}-${size}.jpg`,
      }))
    );

    await Promise.all(deletePromises);
  }

  /**
   * Obtient l'URL publique d'un objet
   */
  private getPublicUrl(key: string): string {
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${key}`;
    }
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
  }

  /**
   * Copie les images d'une propriété (pour la duplication)
   */
  async copyPropertyImages(sourceFolder: string, targetFolder: string): Promise<void> {
    // TODO: Implémenter la copie des images
    // Utiliser ListObjectsV2Command et CopyObjectCommand
  }
}