interface ImageUrls {
    [key: string]: string;
}
export declare function optimizeImage(inputPath: string, outputDir: string, baseFilename: string): Promise<ImageUrls>;
export declare function deleteImageVariants(baseUrl: string, uploadDir: string): Promise<void>;
export {};
//# sourceMappingURL=simple-image-optimizer.d.ts.map