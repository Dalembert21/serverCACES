import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Portabilidad de Base de Datos y Arquitectura Desacoplada (E2E)', () => {
  let appModule: TestingModule;
  let configService: ConfigService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    configService = appModule.get<ConfigService>(ConfigService);
    prismaService = appModule.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await appModule.close();
  });

  it('Debe tener configurada una URL de conexión estándar a PostgreSQL', () => {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    expect(databaseUrl).toBeDefined();
    expect(
      databaseUrl.startsWith('postgresql://') ||
        databaseUrl.startsWith('postgres://'),
    ).toBe(true);
  });

  it('No debe contener dependencias directas ni configuración obligatoria de Supabase', () => {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const supabaseKey = configService.get<string>('SUPABASE_KEY');
    const supabaseServiceRole = configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    // La aplicación debe funcionar sin variables privativas de Supabase
    expect(supabaseUrl).toBeUndefined();
    expect(supabaseKey).toBeUndefined();
    expect(supabaseServiceRole).toBeUndefined();
  });

  it('PrismaService debe estar instanciado correctamente con adaptador PostgreSQL nativo', () => {
    expect(prismaService).toBeDefined();
    expect(typeof prismaService.$transaction).toBe('function');
    expect(typeof prismaService.$connect).toBe('function');
    expect(typeof prismaService.$disconnect).toBe('function');
  });

  it('Debe permitir habilitar SSL para despliegues en la nube o VPS de manera parametrizada', () => {
    const isSslConfigured = configService.get<boolean>('database.ssl');
    expect(typeof isSslConfigured).toBe('boolean');
  });
});
