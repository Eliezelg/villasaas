"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const start = async () => {
    try {
        const app = await (0, app_1.buildApp)({
            logger: {
                level: process.env.LOG_LEVEL || 'info',
                transport: process.env.NODE_ENV === 'development'
                    ? {
                        target: 'pino-pretty',
                        options: {
                            translateTime: 'HH:MM:ss Z',
                            ignore: 'pid,hostname',
                        },
                    }
                    : undefined,
            },
        });
        const port = parseInt(process.env.PORT || '3001', 10);
        const host = process.env.HOST || '0.0.0.0';
        await app.listen({ port, host });
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};
void start();
//# sourceMappingURL=server.js.map