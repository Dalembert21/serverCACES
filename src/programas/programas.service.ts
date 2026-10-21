import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ProgramasService {
  private readonly logger = new Logger(ProgramasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listarProgramas() {
    const programasDb = await this.prisma.programa.findMany({
      where: { activo: true },
      include: {
        plantillasSimuladores: {
          where: { activo: true },
          orderBy: { totalPreguntas: 'desc' },
        },
        versionesTemarios: {
          where: { activo: true },
          include: {
            areas: {
              include: {
                competencias: {
                  include: {
                    temas: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { creadoEn: 'asc' },
    });

    return programasDb.map((prog) => {
      const plantillaOficial =
        prog.plantillasSimuladores.find(
          (p) => p.tipo === 'SIMULACRO_REAL' || p.totalPreguntas >= 100,
        ) ?? prog.plantillasSimuladores[0];

      const temarioActivo = prog.versionesTemarios[0];
      const areasDb = temarioActivo?.areas ?? [];

      const areas = areasDb.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        pesoPorcentual: Math.round(100 / (areasDb.length || 1)),
        cantidadPreguntasEstimada: Math.round(
          (plantillaOficial?.totalPreguntas ?? 150) / (areasDb.length || 1),
        ),
      }));

      const codigoLower = prog.codigo.toLowerCase();
      const idFrontend = codigoLower.startsWith('caces-')
        ? codigoLower
        : `prog-${codigoLower}`;

      return {
        id: idFrontend,
        codigo: `caces-${codigoLower}`,
        titulo: `CACES — ${prog.nombre}`,
        subtitulo: 'Examen de Habilitación para el Ejercicio Profesional',
        descripcion:
          prog.descripcion ??
          `Preparación para el examen oficial CACES de ${prog.nombre}.`,
        totalPreguntasExamen: plantillaOficial?.totalPreguntas ?? 150,
        duracionMinutosExamen: plantillaOficial?.duracionMinutos ?? 240,
        notaMinimaAprobacion: 70,
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
}
