import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const url = process.env.DATABASE_URL;

  console.log('\n==================================================');
  console.log('🔍 VERIFICADOR DE CONEXIÓN A BASE DE DATOS (SUPABASE / POSTGRES)');
  console.log('==================================================\n');

  if (!url) {
    console.error('❌ ERROR: La variable DATABASE_URL no está definida en el archivo .env');
    process.exit(1);
  }

  // Ocultar contraseña para logs seguros
  const maskedUrl = url.replace(/:([^:@]+)@/, ':****@');
  console.log(`📡 URL detectada: ${maskedUrl}`);

  const isSupabase = url.includes('supabase.co') || url.includes('supabase.com');
  const isSslEnabled =
    process.env.DATABASE_SSL === 'true' ||
    url.includes('sslmode=require') ||
    isSupabase;

  console.log(`🔒 SSL Activado: ${isSslEnabled ? 'SÍ (Requerido para Supabase)' : 'NO'}`);
  console.log(`☁️  Proveedor detectado: ${isSupabase ? 'Supabase Cloud 🚀' : 'Local / VPS estándar'}\n`);

  console.log('⏳ Probando conexión...');

  const cleanUrl = isSslEnabled
    ? url.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
    : url;

  const adapter = new PrismaPg({
    connectionString: cleanUrl,
    ...(isSslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const startTime = Date.now();
    await prisma.$connect();

    // Consulta de prueba
    const result = await prisma.$queryRawUnsafe<any[]>(
      'SELECT NOW() as current_time, version() as pg_version, current_database() as database_name;'
    );

    const elapsed = Date.now() - startTime;
    console.log(`✅ ¡CONEXIÓN EXITOSA! (Tiempo de respuesta: ${elapsed}ms)`);
    console.log(`   Base de datos actual: ${result[0]?.database_name}`);
    console.log(`   Fecha/Hora servidor:  ${result[0]?.current_time}`);
    console.log(`   Versión PostgreSQL:   ${result[0]?.pg_version.split(',')[0]}\n`);

    // Verificar si existen tablas
    const tables = await prisma.$queryRawUnsafe<any[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5;"
    );

    if (tables.length > 0) {
      console.log(`📊 Tablas encontradas en schema 'public': ${tables.map((t) => t.table_name).join(', ')}...`);
      console.log('🎉 La base de datos ya tiene tablas creadas.');
    } else {
      console.log('ℹ️  Aún no hay tablas en el schema público.');
      console.log('👉 Ejecuta `npm run prisma:deploy` para aplicar las migraciones a Supabase.');
      console.log('👉 Y luego `npm run prisma:seed` para cargar los datos iniciales.');
    }

    console.log('\n==================================================\n');
  } catch (error: any) {
    console.error('\n❌ ERROR AL CONECTAR CON LA BASE DE DATOS:\n');
    console.error(error.message || error);

    console.log('\n💡 GUÍA RÁPIDA DE DIAGNÓSTICO:');
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('28p01') || msg.includes('password') || msg.includes('autentific')) {
      console.log(' 👉 [Error 28P01] Contraseña o usuario incorrecto.');
      console.log('    1. Ve a Supabase -> Project Settings -> Database.');
      console.log('    2. Si no recuerdas tu contraseña, pulsa en "Reset Database Password".');
      console.log('    3. Si tu contraseña incluye caracteres especiales (como @, #, $, %, &, :), debes codificarlos en URL (por ejemplo "@" -> "%40", "#" -> "%23").');
    } else if (msg.includes('getaddrinfo') || msg.includes('enotfound')) {
      console.log(' 👉 [Error DNS / Host] No se encuentra el host.');
      console.log('    Verifica que la URL del host (ej. aws-0-us-east-1.pooler.supabase.com) esté bien copiada.');
    } else if (msg.includes('timeout') || msg.includes('etimedout') || msg.includes('reach database server')) {
      console.log(' 👉 [Error de Red / IPv6 - Can\'t reach database server]');
      console.log('    La URL directa (db.xxx.supabase.co) solo tiene IPv6 y tu conexión de internet no la alcanza.');
      console.log('    SOLUCIÓN: En Supabase ve a Database -> Connection string y activa "Connection Pooling" (Session mode).');
      console.log('    Usa el host pooler.supabase.com que sí tiene IPv4.');
    } else if (msg.includes('ssl')) {
      console.log(' 👉 [Error SSL]');
      console.log('    Asegúrate de colocar DATABASE_SSL=true en tu archivo .env y agregar ?sslmode=require al final del DATABASE_URL.');
    } else if (msg.includes('3d000')) {
      console.log(' 👉 [Error 3D000] La base de datos especificada no existe (en Supabase la base por defecto es "postgres").');
    }
    console.log('\n==================================================\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
