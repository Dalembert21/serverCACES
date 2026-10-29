import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { DeclararPagoDto } from './dto/declarar-pago.dto.js';

@Injectable()
export class SuscripcionesService {
  private readonly logger = new Logger(SuscripcionesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos los planes comerciales activos
   */
  async listarPlanes() {
    return this.prisma.planSuscripcion.findMany({
      where: { activo: true },
      orderBy: { precioDolares: 'asc' },
    });
  }

  /**
   * Consulta la suscripción activa y límites de prueba del usuario autenticado
   */
  async obtenerMiSuscripcion(usuarioId: string) {
    const suscripcion = await this.prisma.suscripcionUsuario.findFirst({
      where: {
        usuarioId,
        estado: 'ACTIVA',
      },
      include: {
        plan: true,
        transacciones: {
          orderBy: { creadoEn: 'desc' },
          take: 1,
        },
      },
      orderBy: { expiraEn: 'desc' },
    });

    if (!suscripcion) {
      return {
        tieneSuscripcionActiva: false,
        estado: 'SIN_SUSCRIPCION',
        plan: null,
      };
    }

    const ahora = new Date();
    const diasRestantes = Math.max(
      0,
      Math.ceil(
        (suscripcion.expiraEn.getTime() - ahora.getTime()) / (1000 * 3600 * 24),
      ),
    );

    return {
      tieneSuscripcionActiva: true,
      suscripcionId: suscripcion.id,
      estado: suscripcion.estado,
      iniciaEn: suscripcion.iniciaEn.toISOString(),
      expiraEn: suscripcion.expiraEn.toISOString(),
      diasRestantes,
      plan: {
        id: suscripcion.plan.id,
        nombre: suscripcion.plan.nombre,
        precioDolares: suscripcion.plan.precioDolares,
        accesoSimuladoresIlimitados: suscripcion.plan.accesoSimuladoresIlimitados,
        accesoAnaliticaAvanzada: suscripcion.plan.accesoAnaliticaAvanzada,
      },
      consumoGratuito: {
        preguntasConsumidas: suscripcion.preguntasGratisConsumidas,
        limitePreguntasGratis: suscripcion.plan.limitePreguntasGratis,
        simuladoresConsumidos: suscripcion.simuladoresGratisConsumidos,
      },
      ultimoComprobante: suscripcion.transacciones[0] || null,
    };
  }

  /**
   * Registra un comprobante de transferencia bancaria para verificación de tesorería
   */
  async declararPago(dto: DeclararPagoDto, usuarioId: string) {
    const plan = await this.prisma.planSuscripcion.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('El plan seleccionado no existe');
    }

    const comprobanteExistente = await this.prisma.transaccionPago.findUnique({
      where: {
        numeroComprobanteReferencia: dto.numeroComprobanteReferencia.trim(),
      },
    });

    if (comprobanteExistente) {
      throw new ConflictException(
        'Este número de comprobante o referencia ya ha sido registrado previamente',
      );
    }

    // Buscar o crear suscripción pendiente de pago
    let suscripcion = await this.prisma.suscripcionUsuario.findFirst({
      where: {
        usuarioId,
        planId: plan.id,
        estado: 'PENDIENTE_PAGO',
      },
    });

    if (!suscripcion) {
      const expiraEn = new Date();
      expiraEn.setDate(expiraEn.getDate() + plan.duracionDiasVigencia);

      suscripcion = await this.prisma.suscripcionUsuario.create({
        data: {
          usuarioId,
          planId: plan.id,
          estado: 'PENDIENTE_PAGO',
          iniciaEn: new Date(),
          expiraEn,
        },
      });
    }

    const transaccion = await this.prisma.transaccionPago.create({
      data: {
        suscripcionUsuarioId: suscripcion.id,
        usuarioPagadorId: usuarioId,
        entidadBancariaOrigen: dto.entidadBancariaOrigen.trim(),
        numeroComprobanteReferencia: dto.numeroComprobanteReferencia.trim(),
        montoDolares: dto.montoDolares,
        urlFotoComprobante: dto.urlFotoComprobante?.trim() || null,
        estado: 'PENDIENTE_VERIFICACION',
        fechaPagoDeclarada: new Date(),
      },
    });

    return {
      mensaje:
        'Tu comprobante ha sido registrado con éxito. El equipo de tesorería validará tu pago en menos de 2 horas.',
      transaccionId: transaccion.id,
      estado: transaccion.estado,
    };
  }
}
