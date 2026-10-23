import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
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

    const adapter = new PrismaPg({
      connectionString: url,
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
