"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const client_s3_1 = require("@aws-sdk/client-s3");
async function s3Plugin(fastify) {
    const s3Config = {
        region: process.env.AWS_REGION || 'eu-central-1',
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        } : undefined,
    };
    const s3 = new client_s3_1.S3Client(s3Config);
    fastify.decorate('s3', s3);
    fastify.log.info('S3 plugin loaded');
}
exports.default = (0, fastify_plugin_1.default)(s3Plugin, {
    name: 's3',
});
//# sourceMappingURL=s3.js.map