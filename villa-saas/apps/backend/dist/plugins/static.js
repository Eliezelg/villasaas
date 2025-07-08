"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const staticPlugin = async (fastify) => {
    const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
    // Ensure uploads directory exists
    try {
        await promises_1.default.access(uploadsDir);
    }
    catch {
        await promises_1.default.mkdir(uploadsDir, { recursive: true });
    }
    // Serve static files from uploads directory
    fastify.get('/uploads/*', async (request, reply) => {
        const filePath = request.params['*'];
        const fullPath = path_1.default.join(uploadsDir, filePath);
        try {
            // Security: Ensure the path doesn't escape the uploads directory
            const resolvedPath = path_1.default.resolve(fullPath);
            if (!resolvedPath.startsWith(path_1.default.resolve(uploadsDir))) {
                reply.status(403).send({ error: 'Forbidden' });
                return;
            }
            const file = await promises_1.default.readFile(fullPath);
            const ext = path_1.default.extname(fullPath).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
            };
            const mimeType = mimeTypes[ext] || 'application/octet-stream';
            reply
                .header('Content-Type', mimeType)
                .header('Cache-Control', 'public, max-age=31536000') // 1 year cache
                .header('Access-Control-Allow-Origin', '*')
                .header('Cross-Origin-Resource-Policy', 'cross-origin')
                .send(file);
        }
        catch (error) {
            reply.status(404).send({ error: 'File not found' });
        }
    });
};
exports.default = (0, fastify_plugin_1.default)(staticPlugin, {
    name: 'static',
});
//# sourceMappingURL=static.js.map