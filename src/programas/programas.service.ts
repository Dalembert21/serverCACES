import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ProgramasService {
  private readonly logger = new Logger(ProgramasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listarProgramas() {
    const programasDb = await this.prisma.programaAcademico.findMany({
      where: { activo: true },
      include: {
        configuracionesSimulador: {
          where: { activo: true },
          orderBy: { totalPreguntas: 'desc' },
        },
        versionesTemarios: {
          where: { activo: true },
          include: {
            areas: {
              include: {
                subareasCompetencias: true,
              },
            },
          },
        },
      },
      orderBy: { creadoEn: 'asc' },
    });

    return programasDb.map((prog) => {
      const plantillaOficial =
        prog.configuracionesSimulador.find(
          (p) => p.modalidad === 'SIMULACRO_OFICIAL' || p.totalPreguntas >= 100,
        ) ?? prog.configuracionesSimulador[0];

      const temarioActivo = prog.versionesTemarios[0];
      const areasDb = temarioActivo?.areas ?? [];

      const areas = areasDb.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        pesoPorcentual:
          a.pesoPorcentual || Math.round(100 / (areasDb.length || 1)),
        cantidadPreguntasEstimada: Math.round(
          (plantillaOficial?.totalPreguntas ?? 150) / (areasDb.length || 1),
        ),
      }));

      const baseId = (prog.id || '').toLowerCase().replace('caces-', '').replace('prog-', '');
      const idFrontend = `prog-${baseId}`;
      const codigoCaces = `caces-${baseId}`;

      return {
        id: idFrontend,
        codigo: codigoCaces,
        titulo: `CACES — ${prog.nombre}`,
        subtitulo: 'Examen de Habilitación para el Ejercicio Profesional',
        descripcion:
          prog.descripcion ??
          `Preparación para el examen oficial CACES de ${prog.nombre}.`,
        totalPreguntasExamen: plantillaOficial?.totalPreguntas ?? 150,
        duracionMinutosExamen: plantillaOficial?.duracionMinutos ?? 240,
        notaMinimaAprobacion: plantillaOficial?.notaMinimaAprobacion ?? 70,
        areas,
        estaActivo: prog.activo,
      };
    });
  }

  async obtenerProgramaPorId(id: string) {
    const programas = await this.listarProgramas();
    const encontrado = programas.find(
      (p) =>
        p.id === id ||
        p.codigo === id ||
        p.codigo.endsWith(id.replace('prog-', '')),
    );
    if (!encontrado) {
      throw new NotFoundException(`Programa con id ${id} no encontrado`);
    }
    return encontrado;
  }

  async obtenerEstructuraPrograma(id: string) {
    const progLimpio = id.trim();
    const programa = await this.prisma.programaAcademico.findFirst({
      where: {
        activo: true,
        OR: [
          { id: progLimpio },
          { id: progLimpio.toUpperCase() },
          { id: `caces-${progLimpio.toLowerCase().replace('prog-', '')}` },
          { codigoOficialCaces: progLimpio },
        ],
      },
      include: {
        versionesTemarios: {
          where: { activo: true },
          include: {
            areas: {
              include: {
                subareasCompetencias: true,
              },
              orderBy: { nombre: 'asc' },
            },
          },
          orderBy: { fechaInicioVigencia: 'desc' },
          take: 1,
        },
      },
    });

    if (!programa) {
      throw new NotFoundException(`Programa con identificador ${id} no encontrado`);
    }

    const temario = programa.versionesTemarios[0];
    const areas = (temario?.areas || []).map((area) => ({
      id: area.id,
      nombre: area.nombre,
      pesoPorcentual: area.pesoPorcentual,
      subareas: area.subareasCompetencias.map((sub) => ({
        id: sub.id,
        codigoOficial: sub.codigoOficial,
        nombre: sub.nombre,
        descripcion: sub.descripcion,
      })),
    }));

    return {
      programaId: programa.id,
      nombrePrograma: programa.nombre,
      codigoOficialCaces: programa.codigoOficialCaces,
      totalAreas: areas.length,
      areas,
    };
  }
}
