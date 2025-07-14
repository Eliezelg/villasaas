"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = require("crypto");
class S3Service {
    s3;
    bucketName;
    cdnDomain;
    constructor(s3) {
        this.s3 = s3;
        this.bucketName = process.env.AWS_S3_BUCKET || 'familink-test';
        this.cdnDomain = process.env.AWS_CDN_DOMAIN;
    }
    /**
     * Upload une image avec génération automatique de différentes tailles
     */
    async uploadImage(file, _mimetype, options = {}) {
        const folder = options.folder || 'properties';
        const fileId = (0, crypto_1.randomUUID)();
        const baseKey = `${folder}/${fileId}`;
        // Tailles par défaut
        const sizes = options.sizes || [
            { name: 'small', width: 400, quality: 80 },
            { name: 'medium', width: 800, quality: 85 },
            { name: 'large', width: 1200, quality: 90 },
            { name: 'original', width: 1920, quality: 95 },
        ];
        const urls = {};
        // Upload de chaque taille
        for (const size of sizes) {
            let processedImage;
            try {
                if (size.name === 'original') {
                    // Pour l'original, on optimise juste la qualité
                    processedImage = await (0, sharp_1.default)(file)
                        .jpeg({ quality: size.quality, progressive: true })
                        .toBuffer();
                }
                else {
                    // Pour les autres tailles, on redimensionne
                    processedImage = await (0, sharp_1.default)(file)
                        .resize(size.width, size.height, {
                        fit: 'cover',
                        withoutEnlargement: true
                    })
                        .jpeg({ quality: size.quality, progressive: true })
                        .toBuffer();
                }
                console.log(`Processed image ${size.name}: ${processedImage.length} bytes`);
            }
            catch (sharpError) {
                console.error(`Sharp processing failed for ${size.name}:`, sharpError);
                throw new Error(`Image processing failed: ${sharpError.message}`);
            }
            const key = `${baseKey}-${size.name}.jpg`;
            // Upload vers S3
            try {
                await this.s3.send(new client_s3_1.PutObjectCommand({
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
            }
            catch (uploadError) {
                console.error(`Failed to upload ${key}:`, uploadError);
                throw uploadError;
            }
            // Générer l'URL (CDN ou S3 direct)
            urls[size.name] = this.getPublicUrl(key);
        }
        return {
            url: urls.large || urls.original || '',
            urls,
            key: baseKey,
        };
    }
    /**
     * Génère une URL présignée pour l'upload direct depuis le frontend
     */
    async getPresignedUploadUrl(key, contentType, expiresIn = 3600) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, { expiresIn });
    }
    /**
     * Supprime une image et toutes ses variantes
     */
    async deleteImage(baseKey) {
        const sizes = ['small', 'medium', 'large', 'original'];
        const deletePromises = sizes.map(size => this.s3.send(new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: `${baseKey}-${size}.jpg`,
        })));
        await Promise.all(deletePromises);
    }
    /**
     * Obtient l'URL publique d'un objet
     */
    getPublicUrl(key) {
        if (this.cdnDomain) {
            return `${this.cdnDomain}/${key}`;
        }
        // Pour R2, utiliser le domaine public par défaut
        if (process.env.AWS_S3_ENDPOINT?.includes('r2.cloudflarestorage.com')) {
            const accountId = process.env.AWS_S3_ENDPOINT.match(/https:\/\/([^.]+)/)?.[1];
            return `https://pub-${accountId}.r2.dev/${key}`;
        }
        return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
    }
    /**
     * Copie les images d'une propriété (pour la duplication)
     */
    async copyPropertyImages(_sourceFolder, _targetFolder) {
        // TODO: Implémenter la copie des images
        // Utiliser ListObjectsV2Command et CopyObjectCommand
    }
}
exports.S3Service = S3Service;
//# sourceMappingURL=s3.service.js.map