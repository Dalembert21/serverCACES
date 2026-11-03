import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const url = process.env.DATABASE_URL!.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
  const adapter = new PrismaPg({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const prisma = new PrismaClient({ adapter });

  console.log('--- Aplicando migración de auditoría integral y trazabilidad ---');
  const sqlPath = path.join(__dirname, '../prisma/migrations/20261102230000_auditoria_integral_trazabilidad/migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Migración SQL ejecutada con éxito en PostgreSQL.');
  } catch (error) {
    console.error('❌ Error aplicando la migración SQL:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

