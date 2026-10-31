import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import {
  ExcepcionHttpFilter,
  TransformarRespuestaInterceptor,
} from './common/index.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const puerto = configService.get<number>('app.puerto', 3000);
  const prefijo = configService.get<string>('app.prefijoApi', 'api/v1');
  const corsRaw = configService.get<string>(
    'app.corsOrigen',
    'http://localhost:4200',
  );
  const corsOrigen = corsRaw.includes(',')
    ? corsRaw.split(',').map((o) => o.trim())
    : corsRaw;

  // Seguridad: Helmet
  app.use(helmet());

  // Seguridad: CORS
  app.enableCors({
    origin: corsOrigen,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Prefijo global de API
  app.setGlobalPrefix(prefijo);

  // Filtros e interceptores globales
  app.useGlobalFilters(new ExcepcionHttpFilter());
  app.useGlobalInterceptors(new TransformarRespuestaInterceptor());

  // Validación estricta global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Documentación OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS CACES & Simuladores Educativos API')
    .setDescription(
      'API REST empresarial para evaluación, diagnóstico y preparación para exámenes CACES (Medicina, Odontología, Enfermería) y admisión universitaria en Ecuador.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Introduce tu token JWT de acceso',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefijo}/docs`, app, document, {
    customSiteTitle: 'Documentación API CACES SaaS',
  });

  app.enableShutdownHooks();

  await app.listen(puerto);
  logger.log(`Servidor iniciado en puerto: ${puerto}`);
  logger.log(
    `Documentación Swagger disponible en: http://localhost:${puerto}/${prefijo}/docs`,
  );
}

bootstrap();
