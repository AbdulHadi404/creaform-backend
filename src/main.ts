import 'tsconfig-paths/register';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ── CORS ────────────────────────────────────────────────────────────────────
  const frontendUrl = config.get<string>(
    'FRONTEND_URL',
    'http://localhost:5173',
  );
  app.enableCors({
    origin: [
      frontendUrl,
      // Allow Vercel preview deployments automatically
      /^https:\/\/.*\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global prefix ────────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validation ───────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: false, // soft — don't throw on extra fields
      transform: true, // auto-cast query params to declared types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global exception filter ──────────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Swagger (dev + staging only) ─────────────────────────────────────────────
  if (config.get('NODE_ENV') !== 'production') {
    const doc = new DocumentBuilder()
      .setTitle('Creaform Prospect Intelligence API')
      .setDescription(
        'REST API for the Creaform Prospect Intelligence dashboard. ' +
          'Manages prospects, SDR assignments, contacts, notes, and sales sequences.',
      )
      .setVersion('1.0')
      .addTag('prospects')
      .addTag('sdrs')
      .addTag('contacts')
      .addTag('notes')
      .addTag('sequences')
      .addTag('import')
      .build();

    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log('Swagger UI → http://localhost:${port}/api/docs');
  }

  const port = config.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  logger.log(`API running on http://localhost:${port}/api/v1`);
}

bootstrap();
