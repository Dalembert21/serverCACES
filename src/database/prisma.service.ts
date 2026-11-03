import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { AuditContextService } from '../common/audit/audit-context.service.js';
import { createAuditExtension } from './prisma-audit.extension.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    configService: ConfigService,
    @Optional() private readonly auditContextService?: AuditContextService,
  ) {
    const url = configService.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error(
        'DATABASE_URL no está configurada en las variables de entorno',
      );
    }

    const isSslEnabled =
      configService.get<boolean>('database.ssl') ||
      url.includes('sslmode=require') ||
      url.includes('supabase.co') ||
      url.includes('supabase.com');

    // Remover sslmode de la URL para que no sobreescriba ssl: { rejectUnauthorized: false }
    const cleanUrl = isSslEnabled
      ? url.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
      : url;

    const adapter = new PrismaPg({
      connectionString: cleanUrl,
      ...(isSslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    super({
      adapter,
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });

    const extended = this.$extends(createAuditExtension(this.auditContextService));

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in extended) {
          return (extended as any)[prop];
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexión exitosa a PostgreSQL mediante Prisma');
    } catch (error) {
      this.logger.error(
        'No se pudo conectar a PostgreSQL al inicializar la aplicación',
        error,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Conexión a PostgreSQL cerrada limpiamente');
  }
}
