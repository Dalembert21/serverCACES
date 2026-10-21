-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RolNombre" AS ENUM ('ADMIN', 'ESTUDIANTE', 'REVISOR_ACADEMICO', 'TUTOR');

-- CreateEnum
CREATE TYPE "EstadoPregunta" AS ENUM ('BORRADOR', 'EN_REVISION', 'APROBADA', 'PUBLICADA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "DificultadPregunta" AS ENUM ('FACIL', 'MEDIA', 'DIFICIL');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('OPCION_MULTIPLE', 'CASO_CLINICO');

-- CreateEnum
CREATE TYPE "TipoMultimedia" AS ENUM ('RAYOS_X', 'ECG', 'HISTOLOGIA', 'CASO_CLINICO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoSimulador" AS ENUM ('DIAGNOSTICO', 'SIMULACRO_REAL', 'PRACTICA_LIBRE');

-- CreateEnum
CREATE TYPE "EstadoIntento" AS ENUM ('EN_PROGRESO', 'FINALIZADO', 'ABANDONADO', 'EXPIRADO_POR_TIEMPO');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('PENDIENTE', 'ACTIVA', 'VENCIDA', 'CANCELADA', 'PAUSADA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "correoVerificado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" "RolNombre" NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "usuarioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("usuarioId","rolId")
);

-- CreateTable
CREATE TABLE "sesiones_tokens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'EC',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "examenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiones_temarios" (
    "id" TEXT NOT NULL,
    "programaId" TEXT NOT NULL,
    "codigoVersion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaVigencia" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versiones_temarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_academicas" (
    "id" TEXT NOT NULL,
    "temarioVersionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "areas_academicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencias" (
    "id" TEXT NOT NULL,
    "areaAcademicaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "competencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas" (
    "id" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtemas" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "subtemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "subtemaId" TEXT,
    "codigoPublico" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiones_preguntas" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "numeroVersion" INTEGER NOT NULL DEFAULT 1,
    "enunciado" TEXT NOT NULL,
    "explicacionPedagogica" TEXT NOT NULL,
    "dificultad" "DificultadPregunta" NOT NULL DEFAULT 'MEDIA',
    "tipo" "TipoPregunta" NOT NULL DEFAULT 'OPCION_MULTIPLE',
    "estado" "EstadoPregunta" NOT NULL DEFAULT 'BORRADOR',
    "revisorId" TEXT,
    "fechaRevision" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versiones_preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_preguntas" (
    "id" TEXT NOT NULL,
    "preguntaVersionId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "esCorrecta" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL,
    "retroalimentacionEspecifica" TEXT,

    CONSTRAINT "opciones_preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referencias_preguntas" (
    "id" TEXT NOT NULL,
    "preguntaVersionId" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "autor" TEXT,
    "anio" INTEGER,
    "referenciaBibliografica" TEXT NOT NULL,
    "urlReferencia" TEXT,
    "tipoLicencia" TEXT NOT NULL DEFAULT 'REFERENCIA_ACADEMICA',
    "observaciones" TEXT,

    CONSTRAINT "referencias_preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activos_multimedia" (
    "id" TEXT NOT NULL,
    "preguntaVersionId" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "urlAlmacenamiento" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tipoActivo" "TipoMultimedia" NOT NULL DEFAULT 'OTRO',
    "pesoBytes" INTEGER NOT NULL,
    "licenciaUso" TEXT NOT NULL DEFAULT 'PROPIO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activos_multimedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_simuladores" (
    "id" TEXT NOT NULL,
    "programaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoSimulador" NOT NULL DEFAULT 'SIMULACRO_REAL',
    "duracionMinutos" INTEGER NOT NULL,
    "totalPreguntas" INTEGER NOT NULL,
    "ponderacionConfig" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantillas_simuladores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intentos_simuladores" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "plantillaSimuladorId" TEXT,
    "programaId" TEXT NOT NULL,
    "estado" "EstadoIntento" NOT NULL DEFAULT 'EN_PROGRESO',
    "iniciadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEn" TIMESTAMP(3),
    "tiempoConsumidoSegundos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "intentos_simuladores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_intentos" (
    "id" TEXT NOT NULL,
    "intentoId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "preguntaVersionId" TEXT NOT NULL,
    "opcionSeleccionadaId" TEXT,
    "esCorrecta" BOOLEAN NOT NULL DEFAULT false,
    "tiempoRespuestaSegundos" INTEGER,
    "respondidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_intentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_intentos" (
    "id" TEXT NOT NULL,
    "intentoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "puntuacionTotal" DOUBLE PRECISION NOT NULL,
    "totalPreguntas" INTEGER NOT NULL,
    "totalAciertos" INTEGER NOT NULL,
    "totalErrores" INTEGER NOT NULL,
    "totalOmitidas" INTEGER NOT NULL,
    "porcentajeGlobal" DOUBLE PRECISION NOT NULL,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "calculadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultados_intentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_detalles_competencias" (
    "id" TEXT NOT NULL,
    "resultadoIntentoId" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "areaAcademicaId" TEXT NOT NULL,
    "totalPreguntas" INTEGER NOT NULL,
    "aciertos" INTEGER NOT NULL,
    "porcentajeLogrado" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "resultados_detalles_competencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles_conocimiento" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nivelEstimado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSimulacros" INTEGER NOT NULL DEFAULT 0,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfiles_conocimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_dominio_temas" (
    "id" TEXT NOT NULL,
    "perfilConocimientoId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "totalRespondidas" INTEGER NOT NULL DEFAULT 0,
    "totalAciertos" INTEGER NOT NULL DEFAULT 0,
    "porcentajeDominio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_dominio_temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_suscripcion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioCentavos" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "periodoDias" INTEGER NOT NULL DEFAULT 30,
    "limitePreguntasDiarias" INTEGER,
    "permiteSimuladorReal" BOOLEAN NOT NULL DEFAULT true,
    "permiteAnalisisAvanzado" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planes_suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pruebas_gratuitas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "preguntasConsumidas" INTEGER NOT NULL DEFAULT 0,
    "simuladoresConsumidos" INTEGER NOT NULL DEFAULT 0,
    "fechaExpiracion" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pruebas_gratuitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'PENDIENTE',
    "iniciaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renuevaEn" TIMESTAMP(3) NOT NULL,
    "cancelaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones_pagos" (
    "id" TEXT NOT NULL,
    "suscripcionId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "referenciaExterna" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'MOCK',
    "montoCentavos" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "metadatos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacciones_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE INDEX "sesiones_tokens_usuarioId_revocado_idx" ON "sesiones_tokens"("usuarioId", "revocado");

-- CreateIndex
CREATE UNIQUE INDEX "examenes_codigo_key" ON "examenes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "programas_codigo_key" ON "programas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "versiones_temarios_programaId_codigoVersion_key" ON "versiones_temarios"("programaId", "codigoVersion");

-- CreateIndex
CREATE UNIQUE INDEX "competencias_areaAcademicaId_codigo_key" ON "competencias"("areaAcademicaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "preguntas_codigoPublico_key" ON "preguntas"("codigoPublico");

-- CreateIndex
CREATE INDEX "versiones_preguntas_estado_dificultad_idx" ON "versiones_preguntas"("estado", "dificultad");

-- CreateIndex
CREATE UNIQUE INDEX "versiones_preguntas_preguntaId_numeroVersion_key" ON "versiones_preguntas"("preguntaId", "numeroVersion");

-- CreateIndex
CREATE INDEX "intentos_simuladores_usuarioId_estado_idx" ON "intentos_simuladores"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "intentos_simuladores_programaId_idx" ON "intentos_simuladores"("programaId");

-- CreateIndex
CREATE INDEX "respuestas_intentos_intentoId_idx" ON "respuestas_intentos"("intentoId");

-- CreateIndex
CREATE UNIQUE INDEX "respuestas_intentos_intentoId_preguntaId_key" ON "respuestas_intentos"("intentoId", "preguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_intentos_intentoId_key" ON "resultados_intentos"("intentoId");

-- CreateIndex
CREATE INDEX "resultados_intentos_usuarioId_idx" ON "resultados_intentos"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_conocimiento_usuarioId_key" ON "perfiles_conocimiento"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "registros_dominio_temas_perfilConocimientoId_temaId_key" ON "registros_dominio_temas"("perfilConocimientoId", "temaId");

-- CreateIndex
CREATE UNIQUE INDEX "planes_suscripcion_codigo_key" ON "planes_suscripcion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pruebas_gratuitas_usuarioId_key" ON "pruebas_gratuitas"("usuarioId");

-- CreateIndex
CREATE INDEX "suscripciones_usuarioId_estado_idx" ON "suscripciones"("usuarioId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "transacciones_pagos_referenciaExterna_key" ON "transacciones_pagos"("referenciaExterna");

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_tokens" ADD CONSTRAINT "sesiones_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programas" ADD CONSTRAINT "programas_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones_temarios" ADD CONSTRAINT "versiones_temarios_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_academicas" ADD CONSTRAINT "areas_academicas_temarioVersionId_fkey" FOREIGN KEY ("temarioVersionId") REFERENCES "versiones_temarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencias" ADD CONSTRAINT "competencias_areaAcademicaId_fkey" FOREIGN KEY ("areaAcademicaId") REFERENCES "areas_academicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temas" ADD CONSTRAINT "temas_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "competencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtemas" ADD CONSTRAINT "subtemas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_subtemaId_fkey" FOREIGN KEY ("subtemaId") REFERENCES "subtemas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones_preguntas" ADD CONSTRAINT "versiones_preguntas_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones_preguntas" ADD CONSTRAINT "versiones_preguntas_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_preguntas" ADD CONSTRAINT "opciones_preguntas_preguntaVersionId_fkey" FOREIGN KEY ("preguntaVersionId") REFERENCES "versiones_preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias_preguntas" ADD CONSTRAINT "referencias_preguntas_preguntaVersionId_fkey" FOREIGN KEY ("preguntaVersionId") REFERENCES "versiones_preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activos_multimedia" ADD CONSTRAINT "activos_multimedia_preguntaVersionId_fkey" FOREIGN KEY ("preguntaVersionId") REFERENCES "versiones_preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantillas_simuladores" ADD CONSTRAINT "plantillas_simuladores_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_simuladores" ADD CONSTRAINT "intentos_simuladores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_simuladores" ADD CONSTRAINT "intentos_simuladores_plantillaSimuladorId_fkey" FOREIGN KEY ("plantillaSimuladorId") REFERENCES "plantillas_simuladores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_simuladores" ADD CONSTRAINT "intentos_simuladores_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_intentos" ADD CONSTRAINT "respuestas_intentos_intentoId_fkey" FOREIGN KEY ("intentoId") REFERENCES "intentos_simuladores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_intentos" ADD CONSTRAINT "respuestas_intentos_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_intentos" ADD CONSTRAINT "respuestas_intentos_preguntaVersionId_fkey" FOREIGN KEY ("preguntaVersionId") REFERENCES "versiones_preguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_intentos" ADD CONSTRAINT "respuestas_intentos_opcionSeleccionadaId_fkey" FOREIGN KEY ("opcionSeleccionadaId") REFERENCES "opciones_preguntas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_intentos" ADD CONSTRAINT "resultados_intentos_intentoId_fkey" FOREIGN KEY ("intentoId") REFERENCES "intentos_simuladores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_intentos" ADD CONSTRAINT "resultados_intentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_detalles_competencias" ADD CONSTRAINT "resultados_detalles_competencias_resultadoIntentoId_fkey" FOREIGN KEY ("resultadoIntentoId") REFERENCES "resultados_intentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_detalles_competencias" ADD CONSTRAINT "resultados_detalles_competencias_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "competencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_detalles_competencias" ADD CONSTRAINT "resultados_detalles_competencias_areaAcademicaId_fkey" FOREIGN KEY ("areaAcademicaId") REFERENCES "areas_academicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_conocimiento" ADD CONSTRAINT "perfiles_conocimiento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_dominio_temas" ADD CONSTRAINT "registros_dominio_temas_perfilConocimientoId_fkey" FOREIGN KEY ("perfilConocimientoId") REFERENCES "perfiles_conocimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_dominio_temas" ADD CONSTRAINT "registros_dominio_temas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pruebas_gratuitas" ADD CONSTRAINT "pruebas_gratuitas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes_suscripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_pagos" ADD CONSTRAINT "transacciones_pagos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_pagos" ADD CONSTRAINT "transacciones_pagos_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
