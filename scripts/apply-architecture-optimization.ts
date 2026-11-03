import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL no está configurada.');
  }

  const url = rawUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
  const adapter = new PrismaPg({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const prisma = new PrismaClient({ adapter });

  console.log('=== Aplicando Optimización Arquitectónica de Base de Datos ===');
  const sqlPath = path.join(__dirname, '../prisma/migrations/20261103000000_optimizacion_arquitectura_datos/migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Migración SQL ejecutada con éxito en PostgreSQL.');
  } catch (error) {
    console.error('❌ Error ejecutando la migración SQL:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

