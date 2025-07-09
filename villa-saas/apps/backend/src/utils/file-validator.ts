import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';

// Types de fichiers autorisés avec leurs magic bytes
const ALLOWED_TYPES = {
  'image/jpeg': {
    extensions: ['jpg', 'jpeg'],
    mimeTypes: ['image/jpeg'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  'image/png': {
    extensions: ['png'],
    mimeTypes: ['image/png'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  'image/webp': {
    extensions: ['webp'],
    mimeTypes: ['image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  'image/gif': {
    extensions: ['gif'],
    mimeTypes: ['image/gif'],
    maxSize: 3 * 1024 * 1024, // 3MB pour les GIFs
  },
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: {
    mime: string;
    ext: string;
  };
}

/**
 * Valide un fichier uploadé en vérifiant son type réel et sa taille
 */
export async function validateUploadedFile(
  buffer: Buffer,
  declaredMimeType?: string,
  declaredFilename?: string
): Promise<FileValidationResult> {
  // Vérifier la taille du buffer
  if (buffer.length === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Détecter le type de fichier réel
  const fileType = await fileTypeFromBuffer(buffer);
  
  if (!fileType) {
    return { valid: false, error: 'Unable to determine file type' };
  }

  // Vérifier si le type est autorisé
  const allowedType = Object.values(ALLOWED_TYPES).find(
    type => type.mimeTypes.includes(fileType.mime)
  );

  if (!allowedType) {
    return { 
      valid: false, 
      error: `File type ${fileType.mime} is not allowed. Allowed types: ${Object.values(ALLOWED_TYPES).flatMap(t => t.mimeTypes).join(', ')}` 
    };
  }

  // Vérifier la taille
  if (buffer.length > allowedType.maxSize) {
    return { 
      valid: false, 
      error: `File size ${Math.round(buffer.length / 1024 / 1024 * 100) / 100}MB exceeds maximum allowed size of ${allowedType.maxSize / 1024 / 1024}MB` 
    };
  }

  // Vérifier la cohérence avec le type déclaré
  if (declaredMimeType && !allowedType.mimeTypes.includes(declaredMimeType)) {
    return { 
      valid: false, 
      error: `Declared MIME type ${declaredMimeType} does not match actual file type ${fileType.mime}` 
    };
  }

  // Vérifier l'extension du fichier déclaré
  if (declaredFilename) {
    const ext = declaredFilename.split('.').pop()?.toLowerCase();
    if (ext && !allowedType.extensions.includes(ext)) {
      return { 
        valid: false, 
        error: `File extension .${ext} does not match actual file type ${fileType.mime}` 
      };
    }
  }

  return { 
    valid: true,
    fileType: {
      mime: fileType.mime,
      ext: fileType.ext
    }
  };
}

/**
 * Nettoie et sécurise un nom de fichier
 */
export function sanitizeFilename(filename: string): string {
  // Extraire l'extension
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const baseName = parts.join('.');

  // Nettoyer le nom de base
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')  // Remplacer les caractères non autorisés
    .replace(/\.{2,}/g, '_')        // Supprimer les doubles points
    .replace(/_{2,}/g, '_')         // Supprimer les underscores multiples
    .replace(/^[_.-]+|[_.-]+$/g, '') // Supprimer les caractères spéciaux au début/fin
    .substring(0, 100);             // Limiter la longueur

  // Reconstituer avec l'extension
  return ext ? `${sanitized}.${ext.toLowerCase()}` : sanitized;
}

/**
 * Génère un nom de fichier unique et sécurisé
 */
export function generateSecureFilename(originalFilename: string, prefix?: string): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  
  const parts = [prefix, timestamp, uniqueId].filter(Boolean);
  return `${parts.join('_')}.${ext}`;
}

/**
 * Vérifie si un buffer contient du contenu potentiellement malveillant
 */
export function scanForMaliciousContent(buffer: Buffer): boolean {
  const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
  
  // Patterns malveillants courants
  const maliciousPatterns = [
    /<script[\s>]/i,
    /<iframe[\s>]/i,
    /javascript:/i,
    /onclick=/i,
    /onerror=/i,
    /onload=/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /<\?php/i,
    /<%[\s=]/,
  ];

  return maliciousPatterns.some(pattern => pattern.test(bufferString));
}

/**
 * Valide complètement un fichier uploadé
 */
export async function validateFileUpload(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<FileValidationResult> {
  // Validation de base
  const validationResult = await validateUploadedFile(buffer, mimeType, filename);
  
  if (!validationResult.valid) {
    return validationResult;
  }

  // Scan pour contenu malveillant
  if (scanForMaliciousContent(buffer)) {
    return { 
      valid: false, 
      error: 'File contains potentially malicious content' 
    };
  }

  return validationResult;
}