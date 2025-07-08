import { S3Client } from '@aws-sdk/client-s3';
export interface UploadOptions {
    folder?: string;
    sizes?: Array<{
        name: string;
        width: number;
        height?: number;
        quality?: number;
    }>;
}
export declare class S3Service {
    private s3;
    private bucketName;
    private cdnDomain?;
    constructor(s3: S3Client);
    /**
     * Upload une image avec génération automatique de différentes tailles
     */
    uploadImage(file: Buffer, mimetype: string, options?: UploadOptions): Promise<{
        url: string;
        urls: Record<string, string>;
        key: string;
    }>;
    /**
     * Génère une URL présignée pour l'upload direct depuis le frontend
     */
    getPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
    /**
     * Supprime une image et toutes ses variantes
     */
    deleteImage(baseKey: string): Promise<void>;
    /**
     * Obtient l'URL publique d'un objet
     */
    private getPublicUrl;
    /**
     * Copie les images d'une propriété (pour la duplication)
     */
    copyPropertyImages(sourceFolder: string, targetFolder: string): Promise<void>;
}
//# sourceMappingURL=s3.service.d.ts.map