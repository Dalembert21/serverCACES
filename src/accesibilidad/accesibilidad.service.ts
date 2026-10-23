import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EspaciadoTexto, PaletaColor, TamanoTexto } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { ActualizarPreferenciaAccesibilidadDto } from './dto/index.js';

export const PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO = {
  tamanoTexto: TamanoTexto.NORMAL,
  altoContraste: false,
  fuenteDislexia: false,
  espaciadoTexto: EspaciadoTexto.NORMAL,
  movimientoReducido: false,
  subtitulosActivados: false,
  cursorGrande: false,
  lecturaGuiada: false,
  paletaColor: PaletaColor.ESTANDAR,
  sintesisVozLectura: false,
} as const;

@Injectable()
export class AccesibilidadService {
  private readonly logger = new Logger(AccesibilidadService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consulta las preferencias de accesibilidad del usuario autenticado.
   * Si el usuario aún no tiene preferencias almacenadas, inicializa y devuelve los valores por defecto.
   */
  async obtenerPreferencias(usuarioId: string) {
    await this.verificarUsuarioExiste(usuarioId);

    const preferenciasExistentes =
      await this.prisma.preferenciaAccesibilidad.findUnique({
        where: { usuarioId },
      });

    if (preferenciasExistentes) {
      return preferenciasExistentes;
    }

    this.logger.log(
      `Inicializando preferencias de accesibilidad por defecto para el usuario: ${usuarioId}`,
    );

    return this.prisma.preferenciaAccesibilidad.create({
      data: {
        usuarioId,
        ...PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO,
      },
    });
  }

  /**
   * Actualiza de forma parcial o total las preferencias de accesibilidad del usuario autenticado.
   */
  async actualizarPreferencias(
    usuarioId: string,
    dto: ActualizarPreferenciaAccesibilidadDto,
  ) {
    await this.verificarUsuarioExiste(usuarioId);

    return this.prisma.preferenciaAccesibilidad.upsert({
      where: { usuarioId },
      update: {
        ...dto,
      },
      create: {
        usuarioId,
        ...PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO,
        ...dto,
      },
    });
  }

  /**
   * Restablece todas las preferencias de accesibilidad a los valores predeterminados del sistema.
   */
  async restablecerPreferencias(usuarioId: string) {
    await this.verificarUsuarioExiste(usuarioId);

    return this.prisma.preferenciaAccesibilidad.upsert({
      where: { usuarioId },
      update: {
        ...PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO,
      },
      create: {
        usuarioId,
        ...PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO,
      },
    });
  }

  /**
   * Validación de existencia del usuario autenticado en la base de datos
   */
  private async verificarUsuarioExiste(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, activo: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }
}
