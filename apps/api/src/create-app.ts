import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { json } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AUTH } from './auth/auth.module';
import type { Auth } from './auth/auth';
import { config } from './config';

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({ origin: config.webOrigin(), credentials: true });

  // better-auth must see the raw body, so mount it before the JSON parser.
  const auth = app.get<Auth>(AUTH);
  app.getHttpAdapter().getInstance().all('/api/auth/{*splat}', toNodeHandler(auth));
  app.use(json({ limit: '1mb' }));

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  return app;
}
