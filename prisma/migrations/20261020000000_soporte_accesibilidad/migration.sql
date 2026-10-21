-- CreateEnum
CREATE TYPE "TamanoTexto" AS ENUM ('PEQUENO', 'NORMAL', 'GRANDE', 'EXTRA_GRANDE');

-- CreateEnum
CREATE TYPE "EspaciadoTexto" AS ENUM ('NORMAL', 'AMPLIO', 'EXTRA_AMPLIO');

-- CreateEnum
CREATE TYPE "PaletaColor" AS ENUM ('ESTANDAR', 'PROTANOPIA', 'DEUTERANOPIA', 'TRITANOPIA', 'MONOCROMATICO');

-- CreateTable
CREATE TABLE "preferencias_accesibilidad" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tamanoTexto" "TamanoTexto" NOT NULL DEFAULT 'NORMAL',
    "altoContraste" BOOLEAN NOT NULL DEFAULT false,
    "fuenteDislexia" BOOLEAN NOT NULL DEFAULT false,
    "espaciadoTexto" "EspaciadoTexto" NOT NULL DEFAULT 'NORMAL',
    "movimientoReducido" BOOLEAN NOT NULL DEFAULT false,
    "subtitulosActivados" BOOLEAN NOT NULL DEFAULT false,
    "cursorGrande" BOOLEAN NOT NULL DEFAULT false,
    "lecturaGuiada" BOOLEAN NOT NULL DEFAULT false,
    "paletaColor" "PaletaColor" NOT NULL DEFAULT 'ESTANDAR',
    "sintesisVozLectura" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferencias_accesibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "preferencias_accesibilidad_usuarioId_key" ON "preferencias_accesibilidad"("usuarioId");

-- AddForeignKey
ALTER TABLE "preferencias_accesibilidad" ADD CONSTRAINT "preferencias_accesibilidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
