import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ResponderPreguntaDto } from './dto/responder-pregunta.dto.js';

@Injectable()
export class PracticaService {
  private readonly logger = new Logger(PracticaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene banco de preguntas formateado exactamente según PreguntaAcademica.
   * Regla de negocio crítica: Si un módulo o submódulo está suspendido/inactivo,
   * sus preguntas NUNCA deben aparecer en prácticas ni simuladores.
   */
  async obtenerPreguntas(programaId?: string, areaId?: string, submoduloId?: string) {
    const where: any = {
      AND: [
        // 1. Exclusión estricta: módulo y submódulo deben estar activos
        {
          OR: [
            {
              submodulo: {
                activo: true,
                programa: { activo: true },
              },
            },
            {
              submoduloId: null,
              subarea: {
                areaAcademica: {
                  temarioVersion: {
                    activo: true,
                    programa: { activo: true },
                  },
                },
              },
            },
          ],
        },
        // 2. Solo preguntas con versiones vigentes (no retiradas)
        {
          versiones: {
            some: {
              estado: { not: 'RETIRADA' },
            },
          },
        },
      ],
    };

    if (submoduloId && submoduloId.trim()) {
      where.AND.push({
        submoduloId: submoduloId.trim(),
        submodulo: {
          activo: true,
          programa: { activo: true },
        },
      });
    }

    if (programaId && programaId.trim()) {
      const progClean = programaId.toLowerCase().replace('caces-', '').replace('prog-', '').trim();
      const progNum = Number(progClean);
      where.AND.push({
        OR: [
          {
            submodulo: {
              OR: [
                ...(isNaN(progNum) ? [] : [{ programaAcademicoId: progNum }]),
                { programa: { nombre: { contains: progClean, mode: 'insensitive' } } },
              ],
            },
          },
          {
            subarea: {
              areaAcademica: {
                temarioVersion: {
                  OR: [
                    ...(isNaN(progNum) ? [] : [{ programaAcademicoId: progNum }]),
                    { programa: { nombre: { contains: progClean, mode: 'insensitive' } } },
                  ],
                },
              },
            },
          },
        ],
      });
    }

    if (areaId && areaId.trim()) {
      where.AND.push({
        subarea: {
          areaAcademicaId: areaId.trim(),
        },
      });
    }

    const preguntasDb = await this.prisma.pregunta.findMany({
      where,
      include: {
        casoClinico: true,
        submodulo: {
          include: {
            programa: true,
          },
        },
        subarea: {
          include: {
            areaAcademica: {
              include: {
                temarioVersion: true,
              },
            },
          },
        },
        versiones: {
          orderBy: { numeroVersion: 'desc' },
          take: 1,
          include: {
            opciones: {
              orderBy: { letra: 'asc' },
            },
            referencias: true,
            activosMultimedia: true,
          },
        },
      },
    });

    const preguntasFormateadas = preguntasDb
      .filter((p) => p.versiones.length > 0)
      .map((p) => {
        const version = p.versiones[0];
        const area = p.subarea?.areaAcademica;
        const progIdNum =
          p.submodulo?.programaAcademicoId ??
          area?.temarioVersion?.programaAcademicoId ??
          '';
        const progCodigo = String(progIdNum).toLowerCase();

        const multimedia = version.activosMultimedia[0];
        const referencia = version.referencias[0];

        const opcionCorrecta = version.opciones.find((o) => o.esCorrecta);

        return {
          id: p.id,
          codigoPublico: p.codigoPublico,
          programaId: `prog-${progCodigo}`,
          submoduloId: p.submoduloId || undefined,
          submoduloNombre: p.submodulo?.nombre || undefined,
          areaId: area?.id || p.submoduloId || undefined,
          areaNombre: area?.nombre || p.submodulo?.nombre || 'General',
          subareaNombre: p.subarea?.nombre || p.submodulo?.nombre || 'General',
          casoClinico: p.casoClinico?.narrativaClinica || undefined,
          imagenClinicaUrl: multimedia?.urlAlmacenamiento || undefined,
          imagenClinicaDescripcion: multimedia?.descripcionAccesible || undefined,
          imagenClinicaTipo: multimedia ? ('esencial_clinica' as const) : undefined,
          enunciado: version.enunciado,
          opciones: version.opciones.map((o) => ({
            id: o.id,
            letra: o.letra as 'A' | 'B' | 'C' | 'D',
            texto: o.texto,
            explicacionOpcion: o.justificacion || undefined,
          })),
          opcionCorrectaId: opcionCorrecta?.id || '',
          justificacionClinica: version.explicacionPedagogica,
          bibliografiaOficial: referencia
            ? `${referencia.fuenteOficial} - ${referencia.tituloPublicacion} (${referencia.anioPublicacion})`
            : 'Guía y Temario Oficial CACES 2026',
          dificultad: (version.dificultad.toLowerCase() || 'media') as
            | 'baja'
            | 'media'
            | 'alta',
        };
      });

    return preguntasFormateadas;
  }

  /**
   * Valida la respuesta enviada por el estudiante y registra progreso cognitivo
   */
  async registrarRespuesta(dto: ResponderPreguntaDto, usuarioId?: string) {
    const opcion = await this.prisma.preguntaOpcion.findUnique({
      where: { id: dto.opcionId },
      include: {
        preguntaVersion: {
          include: {
            pregunta: true,
          },
        },
      },
    });

    if (!opcion) {
      throw new NotFoundException('La opción seleccionada no fue encontrada');
    }

    const esCorrecta = opcion.esCorrecta;

    // Si hay usuario autenticado, acumular analítica en DominioCognitivoCompetencia
    if (usuarioId && opcion.preguntaVersion.pregunta.subareaCompetenciaId) {
      const subareaId = opcion.preguntaVersion.pregunta.subareaCompetenciaId;

      await this.prisma.dominioCognitivoCompetencia.upsert({
        where: {
          usuarioId_subareaCompetenciaId: {
            usuarioId,
            subareaCompetenciaId: subareaId,
          },
        },
        create: {
          usuarioId,
          subareaCompetenciaId: subareaId,
          totalRespondidas: 1,
          totalAciertos: esCorrecta ? 1 : 0,
          indiceDominio: esCorrecta ? 100 : 0,
        },
        update: {
          totalRespondidas: { increment: 1 },
          ...(esCorrecta ? { totalAciertos: { increment: 1 } } : {}),
        },
      });
    }

    return {
      registrada: true,
      esCorrecta,
    };
  }
}
