# AtuRitmo Backend - Arquitectura, Persistencia y Guía de Portabilidad

Backend oficial para **AtuRitmo**, plataforma ecuatoriana de preparación y simulacros para los exámenes de habilitación profesional CACES/EHEP (Medicina, Odontología, Enfermería y carreras afines).

Construido con **NestJS 11**, **TypeScript**, **Prisma ORM 7** y **PostgreSQL**.

---

## 1. Principio Fundamental de Arquitectura y Portabilidad

El sistema está diseñado bajo el principio de **desacoplamiento total del proveedor de base de datos**:
- **PostgreSQL** es el motor estándar de base de datos relacional.
- **Supabase** es tratado exclusivamente como un proveedor inicial de hosting para la instancia de PostgreSQL.
- **Cero Vendor Lock-in**: La aplicación no depende de Supabase Auth (GoTrue), Supabase Edge Functions, Supabase Realtime ni APIs propietarias. Toda la lógica de negocio, autenticación, autorización y persistencia reside 100% dentro del código de NestJS.
- El backend puede cambiar de proveedor (de Supabase a un VPS propio con Docker/Ubuntu, AWS RDS, DigitalOcean, Hetzner, etc.) simplemente actualizando la cadena de conexión `DATABASE_URL` y variables de red/SSL, sin requerir reescritura de módulos ni alterar la lógica de negocio.

---

## 2. Arquitectura de Acceso a Datos y ORM

### Tecnología: Prisma ORM v7 con Adaptador Nativo `@prisma/adapter-pg`

- **Justificación**:
  - **Tipado seguro de extremo a extremo**: Genera tipos TypeScript exactos derivados del esquema relacional, previniendo errores en tiempo de compilación.
  - **Migraciones determinísticas y versionadas**: Cada cambio estructural en la base de datos queda registrado en archivos SQL planos (`prisma/migrations`), reproducibles en cualquier entorno PostgreSQL estándar.
  - **Conexión estándar con Driver `pg`**: Emplea el cliente nativo de PostgreSQL (`pg` / `node-postgres`) a través de `@prisma/adapter-pg`, permitiendo control granular de pools de conexión, timeouts y parámetros SSL.
  - **Transaccionalidad Atómica**: Toda operación de negocio que requiera consistencia entre múltiples escrituras utiliza `prisma.$transaction(...)`.

### Capa de Persistencia
- Las operaciones de base de datos se centralizan a través del servicio inyectable `PrismaService` (`src/database/prisma.service.ts`).
- Los controladores nunca acceden directamente a la base de datos; delegan las operaciones a servicios de dominio (`AuthService`, `ProgramasService`, `AccesibilidadService`, etc.).

---

## 3. Autenticación y Seguridad (Autónoma y Desacoplada)

A diferencia de sistemas acoplados a Supabase Auth (`auth.users`):
- La identidad se gestiona directamente en las tablas del esquema público: `USUARIOS`, `ROLES`, `USUARIOS_ROLES`, `SESIONES_AUTENTICACION` y `TOKENS_RECUPERACION`.
- **Encriptación**: Las contraseñas se almacenan con hash irreversible usando `bcryptjs`.
- **Tokens**: Autenticación desacoplada basada en JWT (`@nestjs/jwt` y `passport-jwt`) con tokens de acceso y tokens de refresco persistidos y revocables.
- **RBAC**: Control de acceso basado en roles (`SUPERADMIN`, `TESORERIA`, `ESTUDIANTE`).
- **Migración transparente**: Al migrar la base de datos, los usuarios, credenciales, sesiones e historial se transfieren íntegramente con un simple volcado SQL (`pg_dump`), sin depender de exportadores externos de identidad.

---

## 4. Estrategia de Almacenamiento y Multimedia

Para la gestión de imágenes de preguntas médicas, exámenes complementarios (Rayos X, ECG, Histología) y documentos:
- El esquema registra las URLs/rutas agnósticas en `ActivoMultimedia` (`urlAlmacenamiento`).
- Los módulos interactúan con el contrato agnóstico `IServicioAlmacenamiento` (`src/common/interfaces/almacenamiento.interface.ts`), lo que permite utilizar indistintamente:
  - Supabase Storage (mediante su endpoint compatible con S3).
  - AWS S3 / Cloudflare R2 / MinIO.
  - Almacenamiento local en disco en un VPS con Nginx como servidor de estáticos.

---

## 5. Variables de Entorno

Copiar el archivo de plantilla para configurar el entorno local o de producción:

```bash
cp .env.example .env
```

| Variable | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | Entorno de ejecución (`development`, `production`, `test`) | `development` |
| `PORT` | `number` | Puerto HTTP donde escuchará el servidor NestJS | `3000` |
| `API_PREFIX` | `string` | Prefijo global de rutas de la API | `api/v1` |
| `DATABASE_URL` | `string` | Cadena de conexión estándar a PostgreSQL | `postgresql://user:pass@host:5432/caces_db?schema=public` |
| `DATABASE_SSL` | `boolean`| Habilita soporte SSL/TLS para proveedores cloud (Supabase, RDS, VPS) | `false` (local) / `true` (producción) |
| `JWT_SECRET` | `string` | Clave secreta para firma de Access Tokens (mínimo 32 caracteres) | *Cadena aleatoria segura* |
| `JWT_EXPIRES_IN` | `string` | Tiempo de vida del Access Token | `1d` |
| `JWT_REFRESH_SECRET` | `string` | Clave secreta para Refresh Tokens (mínimo 32 caracteres) | *Cadena aleatoria segura* |
| `JWT_REFRESH_EXPIRES_IN` | `string` | Tiempo de vida del Refresh Token | `7d` |
| `CORS_ORIGIN` | `string` | Origen permitido para solicitudes web (Angular / Frontend) | `http://localhost:4200` |
| `THROTTLE_TTL` | `number` | Ventana de tiempo (segundos) para rate limiting | `60` |
| `THROTTLE_LIMIT` | `number` | Número máximo de peticiones por ventana de tiempo | `100` |
| `TRIAL_MAX_PREGUNTAS` | `number` | Límite de preguntas habilitadas en cuenta gratuita | `30` |
| `TRIAL_MAX_SIMULADORES`| `number`| Límite de simulacros para cuenta gratuita | `1` |

---

## 6. Procedimiento para Base de Datos PostgreSQL Local

El repositorio incluye un archivo `docker-compose.yml` para levantar una instancia limpia de PostgreSQL 16 sin depender de servicios externos:

### Iniciar contenedor Docker:
```bash
docker compose up -d
```

### Detener contenedor:
```bash
docker compose down
```

### Verificar que PostgreSQL esté listo:
```bash
docker compose exec postgres pg_isready -U postgres -d caces_db
```

---

## 7. Gestión de Migraciones y Versionamiento del Esquema

### Generar el cliente de Prisma:
```bash
npm run prisma:generate
```

### Crear y aplicar migraciones en desarrollo:
Detecta cambios en `prisma/schema.prisma` y genera un archivo de migración SQL versionado en `prisma/migrations/`:
```bash
npm run prisma:migrate
```

### Aplicar migraciones en producción o nueva instancia (Deploy):
Aplica todas las migraciones pendientes sin modificar el archivo de esquema:
```bash
npm run prisma:deploy
```

### Cargar datos semilla (Roles, carreras y configuración base):
```bash
npm run prisma:seed
```

### Visualizador de datos (Prisma Studio):
```bash
npm run prisma:studio
```

---

## 8. Copias de Seguridad (Backup y Restore)

Dado que la base de datos es PostgreSQL estándar, se utilizan las herramientas oficiales de PostgreSQL (`pg_dump` y `pg_restore` / `psql`):

### Crear copia de seguridad consistente (desde Supabase o VPS):
```bash
# Formato binario comprimido custom (recomendado):
pg_dump -h <HOST> -p <PUERTO> -U <USUARIO> -d <NOMBRE_DB> -F c -b -v -f caces_backup_$(date +%Y%m%d).dump

# O formato SQL plano:
pg_dump -h <HOST> -p <PUERTO> -U <USUARIO> -d <NOMBRE_DB> --clean --if-exists --no-owner --no-privileges -f caces_backup.sql
```

### Restaurar copia de seguridad en una nueva instancia:
```bash
# Restaurar archivo binario:
pg_restore -h <NUEVO_HOST> -p <PUERTO> -U <USUARIO> -d <NOMBRE_DB> -v caces_backup_20261022.dump

# O restaurar archivo SQL plano:
psql -h <NUEVO_HOST> -p <PUERTO> -U <USUARIO> -d <NOMBRE_DB> -f caces_backup.sql
```

---

## 9. Procedimiento de Migración: De Supabase a VPS Propio

Siga esta guía paso a paso para migrar el sistema desde Supabase a un servidor VPS (Ubuntu/Debian con PostgreSQL nativo o Docker):

### Paso 1: Aprovisionar PostgreSQL en el nuevo VPS
1. Instalar PostgreSQL 16 en el VPS:
   ```bash
   sudo apt update && sudo apt install -y postgresql postgresql-contrib
   ```
2. Crear la base de datos y usuario dedicado:
   ```sql
   sudo -u postgres psql
   CREATE USER caces_user WITH PASSWORD 'PasswordSeguro2026!';
   CREATE DATABASE caces_db OWNER caces_user;
   GRANT ALL PRIVILEGES ON DATABASE caces_db TO caces_user;
   \q
   ```
3. Configurar `pg_hba.conf` y `postgresql.conf` para permitir conexiones seguras desde la IP de la aplicación.

### Paso 2: Extraer la copia de seguridad de Supabase
1. Conectar a la base de datos de Supabase vía `pg_dump` (utilizando la cadena de conexión de sesión directa puerto 5432):
   ```bash
   pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
     --schema=public \
     --clean \
     --if-exists \
     --no-owner \
     --no-privileges \
     -F c \
     -f aturitmo_supabase_export.dump
   ```
   > **Nota**: El parámetro `--schema=public` asegura que únicamente se exporten las tablas y datos de la aplicación AtuRitmo, ignorando esquemas internos de Supabase (`auth`, `storage`, `graphql`).

### Paso 3: Restaurar en el VPS de destino
```bash
pg_restore -h localhost -p 5432 -U caces_user -d caces_db -v aturitmo_supabase_export.dump
```

### Paso 4: Validar integridad de datos
Conectarse al PostgreSQL del VPS y verificar que las tablas y conteos coincidan:
```sql
SELECT count(*) FROM "USUARIOS";
SELECT count(*) FROM "PREGUNTAS";
SELECT count(*) FROM "ROLES";
```

### Paso 5: Actualizar variables de entorno en el Backend
En el archivo `.env` del servidor donde corre NestJS:
```env
DATABASE_URL="postgresql://caces_user:PasswordSeguro2026!@IP_DEL_VPS:5432/caces_db?schema=public"
DATABASE_SSL=false # O true si configuró certificados SSL en PostgreSQL
```

### Paso 6: Sincronizar migraciones y arrancar
```bash
npm run prisma:deploy
npm run test:e2e
npm run start:prod
```

### Paso 7: Plan de Reversión (Rollback)
Si durante la ventana de mantenimiento se detecta cualquier problema de conectividad o latencia en el nuevo VPS:
1. Revertir la variable `DATABASE_URL` en el backend a la URL de Supabase.
2. Reiniciar el servicio backend (`pm2 restart serve-back` o `systemctl restart`).
3. El tráfico vuelve instantáneamente a Supabase sin pérdida estructural.

---

## 10. Dependencias Específicas de Supabase que Permanecen en el Proyecto

- **Ninguna**: El repositorio no contiene paquetes `@supabase/*` ni referencias hardcodeadas a la infraestructura de Supabase.

---

## 11. Limitaciones Conocidas de Portabilidad

1. **Archivos Binarios (Storage)**: Si se almacenan imágenes en un bucket de Supabase Storage mediante el dashboard, los objetos binarios no residen dentro del dump relacional de PostgreSQL. Deben sincronizarse mediante herramientas compatibles con S3 (`rclone` o AWS CLI) hacia el bucket S3 o carpeta estática del VPS.
2. **Pooler de Transacciones vs Migraciones**: En Supabase, el pooler Transaction Mode (puerto 6543) no admite comandos DDL con Prepared Statements (`prisma migrate dev`). Para ejecutar migraciones siempre debe usarse el puerto directo 5432 (Session Mode) o configurar `directUrl` en `prisma.config.ts`.

---

## 12. Comandos de Verificación y Pruebas

```bash
# Compilación del proyecto:
npm run build

# Pruebas unitarias de servicios y controladores:
npm test

# Pruebas end-to-end y verificación de portabilidad:
npm run test:e2e
```
