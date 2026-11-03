import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { FiltrosHistorialDto } from './dto/filtros-historial.dto.js';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consulta paginada del historial de auditoría de operaciones del sistema
   */
  async consultarHistorial(filtros: FiltrosHistorialDto) {
    const {
      tablaAfectada,
      registroId,
      usuarioId,
      tipoAccion,
      tipoActor,
      modulo,
      desde,
      hasta,
      pagina = 1,
      limite = 20,
    } = filtros;

    const skip = (pagina - 1) * limite;
    const where: any = {};

    if (tablaAfectada) {
      where.nombreTablaAfectada = {
        equals: tablaAfectada.trim().toUpperCase(),
      };
    }

    if (registroId) {
      where.identificadorRegistroAfectado = registroId.trim();
    }

    if (usuarioId) {
      where.usuarioOperadorId = usuarioId.trim();
    }

    if (tipoAccion) {
      where.tipoAccion = tipoAccion;
    }

    if (tipoActor) {
      where.tipoActor = tipoActor;
    }

    if (modulo) {
      where.modulo = {
        contains: modulo.trim(),
        mode: 'insensitive',
      };
    }

    if (desde || hasta) {
      where.fechaHoraRegistro = {};
      if (desde) {
        where.fechaHoraRegistro.gte = new Date(desde);
      }
      if (hasta) {
        where.fechaHoraRegistro.lte = new Date(hasta);
      }
    }

    const [total, registros] = await Promise.all([
      this.prisma.auditoriaOperacionSistema.count({ where }),
      this.prisma.auditoriaOperacionSistema.findMany({
        where,
        include: {
          usuarioOperador: {
            select: {
              id: true,
              nombreCompleto: true,
              correo: true,
            },
          },
        },
        orderBy: {
          fechaHoraRegistro: 'desc',
        },
        skip,
        take: limite,
      }),
    ]);

    const items = registros.map((r) => ({
      id: r.id.toString(),
      tablaAfectada: r.nombreTablaAfectada,
      registroId: r.identificadorRegistroAfectado,
      accion: r.tipoAccion as 'INSERT' | 'UPDATE' | 'DELETE',
      usuarioId: r.usuarioOperadorId,
      usuarioNombre: r.usuarioOperador?.nombreCompleto || null,
      usuarioCorreo: r.usuarioOperador?.correo || null,
      tipoActor: r.tipoActor,
      fechaOperacion: r.fechaHoraRegistro,
      valoresAnteriores: r.datosAnterioresJson,
      valoresNuevos: r.datosNuevosJson,
      ipOrigen: r.direccionIpCliente,
      userAgent: r.agenteDispositivoUserAgent,
      modulo: r.modulo,
      motivo: r.motivoJustificacion,
    }));

    return {
      datos: items,
      meta: {
        totalRegistros: total,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        registrosPorPagina: limite,
      },
    };
  }

  /**
   * Reconstruye la trazabilidad completa y línea de tiempo de un registro específico
   */
  async consultarTrazabilidadRegistro(tabla: string, registroId: string) {
    const tablaNormalizada = tabla.trim().toUpperCase();
    const idNormalizado = registroId.trim();

    const registros = await this.prisma.auditoriaOperacionSistema.findMany({
      where: {
        nombreTablaAfectada: tablaNormalizada,
        identificadorRegistroAfectado: idNormalizado,
      },
      include: {
        usuarioOperador: {
          select: {
            id: true,
            nombreCompleto: true,
            correo: true,
          },
        },
      },
      orderBy: {
        fechaHoraRegistro: 'asc',
      },
    });

    if (!registros.length) {
      throw new NotFoundException(
        `No se encontraron registros de auditoría para la entidad "${tablaNormalizada}" con ID "${idNormalizado}"`,
      );
    }

    const eventoCreacion = registros.find((r) => r.tipoAccion === 'INSERT') || registros[0];
    const eventoUltimaModificacion = [...registros]
      .reverse()
      .find((r) => r.tipoAccion === 'UPDATE') || null;
    const eventoEliminacion = registros.find((r) => r.tipoAccion === 'DELETE') || null;

    const cantidadModificaciones = registros.filter(
      (r) => r.tipoAccion === 'UPDATE',
    ).length;

    const ultimoEvento = registros[registros.length - 1];

    return {
      tablaAfectada: tablaNormalizada,
      registroId: idNormalizado,
      quienCreo: {
        usuarioId: eventoCreacion.usuarioOperadorId,
        nombre: eventoCreacion.usuarioOperador?.nombreCompleto || 'Sistema / Desconocido',
        correo: eventoCreacion.usuarioOperador?.correo || null,
        tipoActor: eventoCreacion.tipoActor,
      },
      cuandoSeCreo: eventoCreacion.fechaHoraRegistro,
      quienModificoUltimaVez: eventoUltimaModificacion
        ? {
            usuarioId: eventoUltimaModificacion.usuarioOperadorId,
            nombre:
              eventoUltimaModificacion.usuarioOperador?.nombreCompleto ||
              'Sistema / Desconocido',
            correo: eventoUltimaModificacion.usuarioOperador?.correo || null,
            tipoActor: eventoUltimaModificacion.tipoActor,
          }
        : null,
      cuandoSeModifico: eventoUltimaModificacion?.fechaHoraRegistro || null,
      cantidadModificaciones,
      estaEliminado: eventoEliminacion !== null,
      fechaEliminacion: eventoEliminacion?.fechaHoraRegistro || null,
      estadoActual: eventoEliminacion ? null : ultimoEvento.datosNuevosJson,
      lineaDeTiempo: registros.map((r) => ({
        id: r.id.toString(),
        accion: r.tipoAccion,
        fecha: r.fechaHoraRegistro,
        usuarioId: r.usuarioOperadorId,
        usuarioNombre: r.usuarioOperador?.nombreCompleto || 'Sistema / Desconocido',
        tipoActor: r.tipoActor,
        ip: r.direccionIpCliente,
        userAgent: r.agenteDispositivoUserAgent,
        modulo: r.modulo,
        valoresAnteriores: r.datosAnterioresJson,
        valoresNuevos: r.datosNuevosJson,
      })),
    };
  }

  /**
   * Registra un evento de seguridad o acceso
   */
  async registrarAccesoSeguridad(params: {
    usuarioId?: string | null;
    correoIngresado: string;
    eventoSeguridad: string;
    accesoPermitido: boolean;
    detalleObservacion?: string;
    direccionIpOrigen: string;
    agenteDispositivo?: string;
  }) {
    try {
      await this.prisma.auditoriaAccesoSeguridad.create({
        data: {
          usuarioId: params.usuarioId || null,
          correoIngresado: params.correoIngresado,
          eventoSeguridad: params.eventoSeguridad,
          accesoPermitido: params.accesoPermitido,
          detalleObservacion: params.detalleObservacion || null,
          direccionIpOrigen: params.direccionIpOrigen || '127.0.0.1',
          agenteDispositivo: params.agenteDispositivo || 'Desconocido',
        },
      });
    } catch (error) {
      this.logger.error('No se pudo registrar la auditoría de acceso de seguridad', error);
    }
  }

  /**
   * Consulta paginada del historial de accesos de seguridad
   */
  async consultarAccesosSeguridad(pagina = 1, limite = 20, usuarioId?: string) {
    const skip = (pagina - 1) * limite;
    const where: any = {};
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    const [total, registros] = await Promise.all([
      this.prisma.auditoriaAccesoSeguridad.count({ where }),
      this.prisma.auditoriaAccesoSeguridad.findMany({
        where,
        orderBy: { fechaHoraEvento: 'desc' },
        skip,
        take: limite,
      }),
    ]);

    return {
      datos: registros.map((r) => ({
        ...r,
        id: r.id.toString(),
      })),
      meta: {
        totalRegistros: total,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        registrosPorPagina: limite,
      },
    };
  }
}

