import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import {
  appConfig,
  authConfig,
  configuracionSchema,
  databaseConfig,
} from './config/index.js';
import { PrismaModule } from './database/index.js';
import { AuditoriaModule } from './auditoria/index.js';
import { AuditInterceptor } from './common/audit/audit.interceptor.js';
import { AuthModule } from './auth/index.js';
import { AccesibilidadModule } from './accesibilidad/index.js';
import { ProgramasModule } from './programas/index.js';
import { PracticaModule } from './practica/index.js';
import { SimuladoresModule } from './simuladores/index.js';
import { SuscripcionesModule } from './suscripciones/index.js';
import { AdminModule } from './admin/index.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      validationSchema: configuracionSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('app.rateLimit.ttl', 60) * 1000,
          limit: config.get<number>('app.rateLimit.limite', 100),
        },
        {
          name: 'auth',
          ttl: 60 * 1000, // 60 segundos
          limit: 5, // Máximo 5 intentos de autenticación por minuto por IP
          blockDuration: 5 * 60 * 1000, // Si excede 5 intentos, bloqueado por 5 minutos
        },
      ],
    }),
    AuditoriaModule,
    PrismaModule,
    AuthModule,
    AccesibilidadModule,
    ProgramasModule,
    PracticaModule,
    SimuladoresModule,
    SuscripcionesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
