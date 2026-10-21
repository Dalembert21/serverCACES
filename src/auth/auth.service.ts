import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RolNombre } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { RenovarTokenDto } from './dto/renovar-token.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Registro público de nuevos estudiantes
   */
  async registrar(dto: RegistroDto) {
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });

    if (usuarioExistente) {
      throw new ConflictException(
        'El correo electrónico ya se encuentra registrado',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(dto.contrasena, salt);

    // Obtener o asegurar rol ESTUDIANTE
    const rolEstudiante = await this.prisma.rol.findUnique({
      where: { nombre: RolNombre.ESTUDIANTE },
    });

    if (!rolEstudiante) {
      throw new BadRequestException(
        'El rol de estudiante no se encuentra configurado en la base de datos',
      );
    }

    // Creación transaccional: Usuario + Asignación de Rol + Registro de Prueba Gratuita
    const nuevoUsuario = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          correo: dto.correo,
          nombreCompleto: dto.nombreCompleto,
          contrasenaHash,
          correoVerificado: false,
        },
      });

      await tx.usuarioRol.create({
        data: {
          usuarioId: usuario.id,
          rolId: rolEstudiante.id,
        },
      });

      await tx.pruebaGratuita.create({
        data: {
          usuarioId: usuario.id,
          preguntasConsumidas: 0,
          simuladoresConsumidos: 0,
        },
      });

      return usuario;
    });

    const roles = [RolNombre.ESTUDIANTE];
    const tokens = await this.generarYGuardarTokens(
      nuevoUsuario.id,
      nuevoUsuario.correo,
      roles,
    );

    return {
      usuario: {
        id: nuevoUsuario.id,
        correo: nuevoUsuario.correo,
        nombreCompleto: nuevoUsuario.nombreCompleto,
        roles,
      },
      tokens,
    };
  }

  /**
   * Inicio de sesión de usuarios existentes
   */
  async iniciarSesion(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('La cuenta se encuentra desactivada');
    }

    const contrasenaValida = await bcrypt.compare(
      dto.contrasena,
      usuario.contrasenaHash,
    );

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const roles = usuario.roles.map((r) => r.rol.nombre);
    const tokens = await this.generarYGuardarTokens(
      usuario.id,
      usuario.correo,
      roles,
    );

    return {
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        nombreCompleto: usuario.nombreCompleto,
        roles,
      },
      tokens,
    };
  }

  /**
   * Renovación de token de acceso mediante refresh token
   */
  async renovarToken(dto: RenovarTokenDto) {
    const refreshSecret = this.configService.get<string>(
      'auth.jwtRefreshSecret',
    );

    let payload: { sub: string; correo: string; roles: string[] };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('El token de refresco es inválido o expiró');
    }

    // Validar token en la tabla de sesiones activas
    const sesion = await this.prisma.sesionToken.findFirst({
      where: {
        usuarioId: payload.sub,
        tokenHash: dto.refreshToken,
        revocado: false,
        expiraEn: {
          gt: new Date(),
        },
      },
    });

    if (!sesion) {
      throw new UnauthorizedException(
        'La sesión no es válida, ha sido revocada o expiró',
      );
    }

    // Generar nuevo access token
    const jwtSecret = this.configService.get<string>('auth.jwtSecret');
    const jwtExpiresIn = this.configService.get<string>(
      'auth.jwtExpiresIn',
      '1d',
    );

    const nuevoAccessToken = this.jwtService.sign(
      {
        sub: payload.sub,
        correo: payload.correo,
        roles: payload.roles,
      },
      {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn as any,
      },
    );

    return {
      accessToken: nuevoAccessToken,
    };
  }

  /**
   * Cierre de sesión y revocación de tokens
   */
  async cerrarSesion(usuarioId: string) {
    await this.prisma.sesionToken.updateMany({
      where: {
        usuarioId,
        revocado: false,
      },
      data: {
        revocado: true,
      },
    });

    return {
      mensaje: 'Sesión cerrada correctamente',
    };
  }

  /**
   * Obtener perfil detallado del usuario autenticado
   */
  async obtenerPerfil(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        correo: true,
        nombreCompleto: true,
        activo: true,
        correoVerificado: true,
        creadoEn: true,
        roles: {
          select: {
            rol: {
              select: {
                nombre: true,
                descripcion: true,
              },
            },
          },
        },
        pruebaGratuita: {
          select: {
            preguntasConsumidas: true,
            simuladoresConsumidos: true,
          },
        },
        suscripciones: {
          where: {
            estado: 'ACTIVA',
          },
          orderBy: {
            renuevaEn: 'desc',
          },
          take: 1,
          select: {
            id: true,
            estado: true,
            iniciaEn: true,
            renuevaEn: true,
            plan: {
              select: {
                codigo: true,
                nombre: true,
                permiteSimuladorReal: true,
                permiteAnalisisAvanzado: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      ...usuario,
      roles: usuario.roles.map((r) => r.rol.nombre),
      suscripcionActiva: usuario.suscripciones[0] || null,
    };
  }

  /**
   * Utilidad interna para firmar tokens JWT y registrar la sesión en base de datos
   */
  private async generarYGuardarTokens(
    usuarioId: string,
    correo: string,
    roles: string[],
  ) {
    const jwtSecret = this.configService.get<string>('auth.jwtSecret');
    const jwtExpiresIn = this.configService.get<string>(
      'auth.jwtExpiresIn',
      '1d',
    );
    const refreshSecret = this.configService.get<string>(
      'auth.jwtRefreshSecret',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'auth.jwtRefreshExpiresIn',
      '7d',
    );

    const payload = { sub: usuarioId, correo, roles };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    // Guardar sesión en base de datos (expiración a 7 días)
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7);

    await this.prisma.sesionToken.create({
      data: {
        usuarioId,
        tokenHash: refreshToken,
        expiraEn,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: jwtExpiresIn,
    };
  }
}
