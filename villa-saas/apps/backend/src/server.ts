import 'dotenv/config';
import { buildApp } from './app';

const start = async (): Promise<void> => {
  try {
    const app = await buildApp({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV === 'development'
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
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

void start();