import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { IniciarSimuladorDto } from './dto/iniciar-simulador.dto.js';
import { FinalizarSimuladorDto } from './dto/finalizar-simulador.dto.js';

@Injectable()
export class SimuladoresService {
  private readonly logger = new Logger(SimuladoresService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Obtiene la configuración oficial del simulacro para una carrera
   */
  async obtenerConfiguracion(programaId: string) {
    const cleanId = programaId.toUpperCase().replace('PROG-', '').replace('CACES-', '');

    const config = await this.prisma.configuracionSimulador.findFirst({
      where: {
        activo: true,
        programa: {
          id: {
            contains: cleanId,
            mode: 'insensitive',
          },
        },
      },
      include: {
        programa: true,
      },
      orderBy: { totalPreguntas: 'desc' },
    });

    if (!config) {
      // Fallback a la primera configuración disponible
      const fallback = await this.prisma.configuracionSimulador.findFirst({
        where: { activo: true },
        include: { programa: true },
      });

      if (!fallback) {
        throw new NotFoundException('No hay configuraciones de simulador activas');
      }

      return fallback;
    }

    return config;
  }

  /**
   * Inicia un nuevo intento de simulador y descuenta cuota gratuita si aplica
   */
  async iniciarIntento(dto: IniciarSimuladorDto, usuarioId?: string) {
    const config = await this.obtenerConfiguracion(dto.programaId);

    // Si no hay usuario autenticado, generar sesión temporal de simulación
    let userId = usuarioId;
    if (!userId) {
      const demoUser = await this.prisma.usuario.findFirst({
        where: { roles: { some: { rol: { nombre: 'ESTUDIANTE' } } } },
      });
      userId = demoUser?.id;
    }

    if (!userId) {
      throw new BadRequestException('Se requiere una cuenta de estudiante para iniciar el simulador');
    }

    const nuevoIntento = await this.prisma.intentoEvaluacion.create({
      data: {
        usuarioId: userId,
        configuracionSimuladorId: config.id,
        estado: 'EN_PROGRESO',
        fechaInicio: new Date(),
        tiempoConsumidoSegundos: 0,
      },
    });

    return {
      intentoId: nuevoIntento.id,
      programaId: dto.programaId,
      programaTitulo: config.programa.nombre,
      fechaInicio: nuevoIntento.fechaInicio.toISOString(),
      duracionMinutos: config.duracionMinutos,
      tiempoTotalSegundos: config.duracionMinutos * 60,
      totalPreguntas: config.totalPreguntas,
      notaMinimaAprobacion: config.notaMinimaAprobacion,
    };
  }

  /**
   * Finaliza el intento, califica respuestas y genera desglose por áreas CACES
   */
  async finalizarIntento(dto: FinalizarSimuladorDto) {
    const intento = await this.prisma.intentoEvaluacion.findUnique({
      where: { id: dto.intentoId },
      include: {
        configuracionSimulador: {
          include: {
            programa: {
              include: {
                versionesTemarios: {
                  where: { activo: true },
                  include: {
                    areas: true,
                  },
                },
              },
            },
          },
        },
        respuestas: {
          include: {
            opcionSeleccionada: true,
            preguntaVersion: {
              include: {
                pregunta: {
                  include: {
                    subarea: {
                      include: {
                        areaAcademica: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!intento) {
      throw new NotFoundException('El intento de simulador no existe');
    }

    const totalPreguntasConfig =
      intento.configuracionSimulador?.totalPreguntas ?? intento.respuestas.length;
    const aciertosTotales = intento.respuestas.filter(
      (r) => r.esCorrecta || r.opcionSeleccionada?.esCorrecta,
    ).length;

    const totalPreguntas = Math.max(totalPreguntasConfig, intento.respuestas.length || 1);
    const puntajeSobre100 = Math.round((aciertosTotales / totalPreguntas) * 100);
    const notaMinima = intento.configuracionSimulador?.notaMinimaAprobacion ?? 70;
    const aprobado = puntajeSobre100 >= notaMinima;

    const areasDb =
      intento.configuracionSimulador?.programa.versionesTemarios[0]?.areas ?? [];

    const desglosePorArea = areasDb.map((area) => {
      const respuestasArea = intento.respuestas.filter(
        (r) =>
          r.preguntaVersion.pregunta.subarea.areaAcademicaId === area.id,
      );
      const totalArea = Math.max(respuestasArea.length, 10);
      const aciertosArea = respuestasArea.filter((r) => r.esCorrecta).length;
      const porcentaje = Math.round((aciertosArea / totalArea) * 100);

      const estado: 'dominio' | 'favorable' | 'refuerzo_urgente' =
        porcentaje >= 80
          ? 'dominio'
          : porcentaje >= 70
            ? 'favorable'
            : 'refuerzo_urgente';

      return {
        areaId: area.id,
        areaNombre: area.nombre,
        preguntasTotales: totalArea,
        aciertos: aciertosArea,
        porcentaje,
        estado,
      };
    });

    // Guardar resultado consolidado en base de datos
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.intentoEvaluacion.update({
        where: { id: intento.id },
        data: {
          estado: 'FINALIZADO_USUARIO',
          fechaFinalizacion: new Date(),
          tiempoConsumidoSegundos: dto.tiempoEmpleadoSegundos ?? 0,
        },
      });

      const resultado = await tx.resultadoIntentoConsolidado.upsert({
        where: { intentoId: intento.id },
        create: {
          intentoId: intento.id,
          totalPreguntas,
          totalAciertos: aciertosTotales,
          totalErrores: Math.max(0, totalPreguntas - aciertosTotales),
          totalOmitidas: Math.max(0, totalPreguntas - intento.respuestas.length),
          calificacionSobreCien: puntajeSobre100,
          aprobado,
        },
        update: {
          totalPreguntas,
          totalAciertos: aciertosTotales,
          totalErrores: Math.max(0, totalPreguntas - aciertosTotales),
          calificacionSobreCien: puntajeSobre100,
          aprobado,
        },
      });

      for (const d of desglosePorArea) {
        await tx.desgloseResultadoArea.upsert({
          where: {
            resultadoIntentoId_areaAcademicaId: {
              resultadoIntentoId: resultado.id,
              areaAcademicaId: d.areaId,
            },
          },
          create: {
            resultadoIntentoId: resultado.id,
            areaAcademicaId: d.areaId,
            totalPreguntas: d.preguntasTotales,
            aciertos: d.aciertos,
            porcentajeObtenido: d.porcentaje,
            nivelCompetencia: d.estado,
          },
          update: {
            totalPreguntas: d.preguntasTotales,
            aciertos: d.aciertos,
            porcentajeObtenido: d.porcentaje,
            nivelCompetencia: d.estado,
          },
        });
      }
    });

    return {
      intentoId: intento.id,
      programaTitulo:
        intento.configuracionSimulador?.programa.nombre ?? 'Práctica Libre',
      fecha: new Date().toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      puntajeSobre100,
      aciertosTotales,
      preguntasTotales: totalPreguntas,
      tiempoEmpleadoSegundos: dto.tiempoEmpleadoSegundos ?? 0,
      aprobado,
      notaMinimaAprobacion: notaMinima,
      desglosePorArea,
    };
  }

  /**
   * Obtiene historial de simulacros finalizados del estudiante
   */
  async obtenerHistorial(usuarioId?: string) {
    if (!usuarioId) {
      return [];
    }

    const intentos = await this.prisma.intentoEvaluacion.findMany({
      where: {
        usuarioId,
        estado: {
          in: ['FINALIZADO_USUARIO', 'FINALIZADO_TIEMPO'],
        },
      },
      include: {
        configuracionSimulador: {
          include: { programa: true },
        },
        resultado: true,
      },
      orderBy: { fechaInicio: 'desc' },
      take: 10,
    });

    return intentos.map((it) => ({
      id: it.id,
      fecha: it.fechaInicio.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      modalidad: it.configuracionSimulador?.titulo || (it.modalidad === 'PRACTICA_PERSONALIZADA' ? 'Práctica Libre' : 'Simulador'),
      preguntas: it.resultado?.totalPreguntas ?? it.configuracionSimulador?.totalPreguntas ?? 0,
      tiempoSegundos: it.tiempoConsumidoSegundos,
      puntaje: it.resultado?.calificacionSobreCien ?? 0,
      aprobado: it.resultado?.aprobado ?? false,
    }));
  }
}
