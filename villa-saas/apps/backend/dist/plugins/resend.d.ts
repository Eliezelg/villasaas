import { FastifyPluginAsync } from 'fastify';
import { Resend } from 'resend';
declare module 'fastify' {
    interface FastifyInstance {
        resend: Resend;
    }
}
declare const _default: FastifyPluginAsync;
export default _default;
//# sourceMappingURL=resend.d.ts.map