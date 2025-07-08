import type { FastifyPluginAsync } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
declare module 'fastify' {
    interface FastifyInstance {
        io: SocketIOServer;
    }
}
declare const _default: FastifyPluginAsync;
export default _default;
//# sourceMappingURL=websocket.d.ts.map