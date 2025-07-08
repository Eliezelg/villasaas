"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeImage = optimizeImage;
exports.deleteImageVariants = deleteImageVariants;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const IMAGE_SIZES = [
    { width: 1920, height: 1080, suffix: 'large' }, // Full size
    { width: 800, height: 600, suffix: 'medium' }, // Medium size
    { width: 400, height: 300, suffix: 'small' }, // Thumbnail
];
async function optimizeImage(inputPath, outputDir, baseFilename) {
    const ext = '.webp'; // Convert all images to WebP for better compression
    const urls = {};
    // Ensure output directory exists
    await promises_1.default.mkdir(outputDir, { recursive: true });
    // Read the original image
    const image = (0, sharp_1.default)(inputPath);
    const metadata = await image.metadata();
    // Generate optimized versions
    for (const size of IMAGE_SIZES) {
        const filename = `${baseFilename}_${size.suffix}${ext}`;
        const outputPath = path_1.default.join(outputDir, filename);
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
        }
        else {
            // If original is smaller, just convert to WebP
            await image
                .webp({ quality: 85 })
                .toFile(outputPath);
        }
        urls[size.suffix] = `/uploads/properties/${filename}`;
    }
    // Create a high-quality original version in WebP
    const originalFilename = `${baseFilename}_original${ext}`;
    const originalPath = path_1.default.join(outputDir, originalFilename);
    await (0, sharp_1.default)(inputPath)
        .webp({ quality: 90 })
        .toFile(originalPath);
    urls.original = `/uploads/properties/${originalFilename}`;
    // Delete the original uploaded file to save space
    await promises_1.default.unlink(inputPath);
    return urls;
}
async function deleteImageVariants(baseUrl, uploadDir) {
    // Extract base filename from URL
    const filename = path_1.default.basename(baseUrl);
    const baseName = filename.split('_')[0] + '_' + filename.split('_')[1];
    // Delete all variants
    const suffixes = ['small', 'medium', 'large', 'original'];
    for (const suffix of suffixes) {
        const variantPath = path_1.default.join(uploadDir, `${baseName}_${suffix}.webp`);
        try {
            await promises_1.default.unlink(variantPath);
        }
        catch (error) {
            // Ignore if file doesn't exist
        }
    }
}
//# sourceMappingURL=image-optimizer.js.map