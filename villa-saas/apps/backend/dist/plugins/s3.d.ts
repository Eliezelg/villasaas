import { FastifyInstance } from 'fastify';
import { S3Client } from '@aws-sdk/client-s3';
declare module 'fastify' {
    interface FastifyInstance {
        s3: S3Client;
    }
}
declare function s3Plugin(fastify: FastifyInstance): Promise<void>;
declare const _default: typeof s3Plugin;
export default _default;
//# sourceMappingURL=s3.d.ts.map