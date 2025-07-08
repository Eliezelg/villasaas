"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeImage = optimizeImage;
exports.deleteImageVariants = deleteImageVariants;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
async function optimizeImage(inputPath, outputDir, baseFilename) {
    // For now, just move the file without optimization
    // In production, you would use sharp or a cloud service
    const ext = path_1.default.extname(inputPath);
    const filename = `${baseFilename}${ext}`;
    const outputPath = path_1.default.join(outputDir, filename);
    // Move file to final location
    await promises_1.default.rename(inputPath, outputPath);
    // Return URLs for different sizes (all pointing to the same file for now)
    const url = `/uploads/properties/${filename}`;
    return {
        small: url,
        medium: url,
        large: url,
        original: url
    };
}
async function deleteImageVariants(baseUrl, uploadDir) {
    // Extract filename from URL
    const filename = path_1.default.basename(baseUrl);
    const filePath = path_1.default.join(uploadDir, filename);
    try {
        await promises_1.default.unlink(filePath);
    }
    catch (error) {
        // Ignore if file doesn't exist
    }
}
//# sourceMappingURL=simple-image-optimizer.js.map