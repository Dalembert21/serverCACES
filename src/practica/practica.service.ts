import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ResponderPreguntaDto } from './dto/responder-pregunta.dto.js';

@Injectable()
export class PracticaService {
  private readonly logger = new Logger(PracticaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene banco de preguntas formateado exactamente según PreguntaAcademica
   */
  async obtenerPreguntas(programaId?: string, areaId?: string) {
    const preguntasDb = await this.prisma.pregunta.findMany({
      include: {
        casoClinico: true,
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
        const area = p.subarea.areaAcademica;
        const progCodigo = (
          area.temarioVersion.programaAcademicoId || ''
        ).toLowerCase().replace('caces-', '').replace('prog-', '');

        const multimedia = version.activosMultimedia[0];
        const referencia = version.referencias[0];

        const opcionCorrecta = version.opciones.find((o) => o.esCorrecta);

        return {
          id: p.id,
          codigoPublico: p.codigoPublico,
          programaId: `prog-${progCodigo}`,
          areaId: area.id,
          areaNombre: area.nombre,
          subareaNombre: p.subarea.nombre,
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

    // Filtros por carrera o área
    let resultado = preguntasFormateadas;

    if (programaId) {
      const progClean = programaId.toLowerCase().replace('caces-', '').replace('prog-', '');
      const filtradas = resultado.filter((p) => p.programaId.includes(progClean));
      if (filtradas.length > 0) {
        resultado = filtradas;
      }
    }

    if (areaId) {
      const filtradasArea = resultado.filter((p) => p.areaId === areaId);
      if (filtradasArea.length > 0) {
        resultado = filtradasArea;
      }
    }

    return resultado;
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
