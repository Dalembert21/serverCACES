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
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../database/prisma.service.js';
import {
  validarCedulaEcuatoriana,
  validarClaveSegura,
  validarNombrePersona,
} from '../common/index.js';
import { CompletarPerfilDto } from './dto/completar-perfil.dto.js';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
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
    const correo = dto.correo.toLowerCase().trim();

    // Validación rigurosa de cédula ecuatoriana si es provista
    if (dto.cedula) {
      const valCedula = validarCedulaEcuatoriana(dto.cedula);
      if (!valCedula.esValida) {
        throw new BadRequestException(
          valCedula.motivo || 'La cédula de identidad no es válida',
        );
      }
    }

    // Validación de nombres y apellidos (evitar puntos, símbolos o valores incoherentes)
    if (dto.nombre) {
      const valNombre = validarNombrePersona(dto.nombre);
      if (!valNombre.esValido) {
        throw new BadRequestException(
          valNombre.motivo || 'El nombre ingresado no es válido',
        );
      }
    }

    if (dto.apellido) {
      const valApellido = validarNombrePersona(dto.apellido);
      if (!valApellido.esValido) {
        throw new BadRequestException(
          valApellido.motivo || 'El apellido ingresado no es válido',
        );
      }
    }

    const usuarioExistente = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: { equals: correo, mode: 'insensitive' } },
          ...(dto.cedula ? [{ cedula: dto.cedula.trim() }] : []),
        ],
      },
    });

    if (usuarioExistente) {
      const coincideCorreo =
        usuarioExistente.correo.toLowerCase().trim() === correo;
      if (coincideCorreo) {
        throw new ConflictException(
          'El correo electrónico ya se encuentra registrado. Por favor, inicia sesión con tus credenciales o solicita la recuperación de tu contraseña.',
        );
      }
      throw new ConflictException(
        'El número de cédula de identidad ya se encuentra registrado en el sistema.',
      );
    }

    const passwordPlano = dto.contrasena || dto.clave;
    if (!passwordPlano) {
      throw new BadRequestException('Debe ingresar una contraseña');
    }

    const valClave = validarClaveSegura(passwordPlano);
    if (!valClave.esValida) {
      throw new BadRequestException(
        valClave.motivo || 'La contraseña no cumple con los requisitos de seguridad',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(passwordPlano, salt);

    // Obtener o asegurar rol ESTUDIANTE
    const rolEstudiante = await this.prisma.rol.findUnique({
      where: { nombre: RolNombre.ESTUDIANTE },
    });

    if (!rolEstudiante) {
      throw new BadRequestException(
        'El rol de estudiante no se encuentra configurado en la base de datos',
      );
    }

    const nombreCompleto =
      dto.nombreCompleto?.trim() ||
      [dto.nombre?.trim(), dto.apellido?.trim()].filter(Boolean).join(' ') ||
      'Estudiante CACES';

    // Creación transaccional: Usuario + Asignación de Rol + Suscripción Inicial Gratuita
    const nuevoUsuario = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          correo,
          cedula: dto.cedula?.trim() || null,
          nombre: dto.nombre?.trim() || null,
          apellido: dto.apellido?.trim() || null,
          nombreCompleto,
          contrasenaHash,
          rol: 'estudiante',
          programaActivoId: dto.programaInicialId || 'prog-medicina',
          proveedorAuth: 'local',
          correoVerificado: false,
        },
      });

      await tx.usuarioRol.create({
        data: {
          usuarioId: usuario.id,
          rolId: rolEstudiante.id,
        },
      });

      // Crear suscripción inicial en el plan base gratuito (vigencia 1 año)
      const expiraEn = new Date();
      expiraEn.setDate(expiraEn.getDate() + 365);

      await tx.suscripcionUsuario.create({
        data: {
          usuarioId: usuario.id,
          planId: 'PLAN_GRATUITO_BASE',
          estado: 'ACTIVA',
          iniciaEn: new Date(),
          expiraEn,
          preguntasGratisConsumidas: 0,
          simuladoresGratisConsumidos: 0,
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

    const nombresDivididos = nuevoUsuario.nombreCompleto.split(' ');
    const primerNombre = nuevoUsuario.nombre || nombresDivididos[0] || 'Estudiante';
    const apellidos = nuevoUsuario.apellido || nombresDivididos.slice(1).join(' ') || '';

    const usuarioFormateado = {
      id: nuevoUsuario.id,
      cedula: nuevoUsuario.cedula || undefined,
      nombre: primerNombre,
      apellido: apellidos,
      nombreCompleto: nuevoUsuario.nombreCompleto,
      correo: nuevoUsuario.correo,
      rol: 'estudiante',
      roles,
      programaActivoId: nuevoUsuario.programaActivoId || dto.programaInicialId || 'prog-medicina',
      fechaRegistro: (nuevoUsuario.creadoEn || new Date()).toISOString(),
    };

    return {
      usuario: usuarioFormateado,
      tokens,
      tokenAcceso: tokens.accessToken,
      tokenRefresco: tokens.refreshToken,
    };
  }

  /**
   * Inicio de sesión de usuarios existentes (por correo o cédula)
   */
  async iniciarSesion(dto: LoginDto) {
    const identificador = (dto.identificador || dto.correo || '').trim();
    const passwordPlano = dto.contrasena || dto.clave;

    if (!identificador) {
      throw new BadRequestException('Debe ingresar su correo o cédula');
    }

    if (!passwordPlano) {
      throw new BadRequestException('Debe ingresar su contraseña');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: identificador.toLowerCase() },
          { cedula: identificador },
        ],
      },
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

    if (!usuario.contrasenaHash) {
      throw new UnauthorizedException(
        'Esta cuenta fue registrada mediante Google. Por favor, inicia sesión con el botón de Google.',
      );
    }

    const contrasenaValida = await bcrypt.compare(
      passwordPlano,
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

    const esAdmin = roles.includes(RolNombre.SUPERADMIN) || roles.includes(RolNombre.TESORERIA);
    const rolFront = esAdmin ? 'administrador_academico' : (usuario.rol || 'estudiante');

    const nombresDivididos = usuario.nombreCompleto.split(' ');
    const primerNombre = usuario.nombre || nombresDivididos[0] || 'Usuario';
    const apellidos = usuario.apellido || nombresDivididos.slice(1).join(' ') || '';

    const usuarioFormateado = {
      id: usuario.id,
      cedula: usuario.cedula || undefined,
      nombre: primerNombre,
      apellido: apellidos,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      rol: rolFront,
      roles,
      programaActivoId: usuario.programaActivoId || 'prog-medicina',
      fechaRegistro: (usuario.creadoEn || new Date()).toISOString(),
    };

    return {
      usuario: usuarioFormateado,
      tokens,
      tokenAcceso: tokens.accessToken,
      tokenRefresco: tokens.refreshToken,
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
      throw new UnauthorizedException(
        'El token de refresco es inválido o expiró',
      );
    }

    // Validar token en la tabla de sesiones activas
    const sesion = await this.prisma.sesionAutenticacion.findFirst({
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
    await this.prisma.sesionAutenticacion.updateMany({
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
        nombre: true,
        apellido: true,
        nombreCompleto: true,
        tipoIdentificacion: true,
        cedula: true,
        rol: true,
        programaActivoId: true,
        googleId: true,
        fotoUrl: true,
        proveedorAuth: true,
        telefonoContacto: true,
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
        suscripciones: {
          where: {
            estado: 'ACTIVA',
          },
          orderBy: {
            expiraEn: 'desc',
          },
          take: 1,
          select: {
            id: true,
            estado: true,
            iniciaEn: true,
            expiraEn: true,
            preguntasGratisConsumidas: true,
            simuladoresGratisConsumidos: true,
            plan: {
              select: {
                id: true,
                nombre: true,
                accesoSimuladoresIlimitados: true,
                accesoAnaliticaAvanzada: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const suscripcionActiva = usuario.suscripciones[0] || null;

    return {
      ...usuario,
      roles: usuario.roles.map((r) => r.rol.nombre),
      suscripcionActiva,
      pruebaGratuita: {
        preguntasConsumidas: suscripcionActiva?.preguntasGratisConsumidas ?? 0,
        simuladoresConsumidos:
          suscripcionActiva?.simuladoresGratisConsumidos ?? 0,
      },
    };
  }

  /**
   * Autenticación con Google Identity Services (GIS)
   * Login y Registro unificado en un solo paso
   */
  async autenticarConGoogle(dto: GoogleAuthDto) {
    const googleClientId =
      this.configService.get<string>('auth.googleClientId') ||
      process.env.GOOGLE_CLIENT_ID;

    let payload: any;
    try {
      const googleClient = new OAuth2Client(googleClientId);
      const ticket = await googleClient.verifyIdToken({
        idToken: dto.token,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (error: any) {
      this.logger.warn(
        `Error al verificar token de Google: ${error?.message || error}`,
      );
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException(
        'El token de Google no contiene un correo electrónico válido',
      );
    }

    const { email, sub: googleId, given_name, family_name, name, picture } =
      payload;
    const correoNormalizado = email.toLowerCase().trim();

    // 2. Buscar si el usuario ya existe por Google ID o por Correo
    let usuario = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ googleId }, { correo: correoNormalizado }],
      },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    const primerNombre = given_name || name?.split(' ')[0] || 'Estudiante';
    const apellidos = family_name || name?.split(' ').slice(1).join(' ') || '';
    const nombreCompleto =
      [primerNombre, apellidos].filter(Boolean).join(' ') || 'Estudiante CACES';

    if (!usuario) {
      // 3. Crear usuario nuevo si no existe (sin cédula ni programa inicialmente)
      const rolEstudiante = await this.prisma.rol.findUnique({
        where: { nombre: RolNombre.ESTUDIANTE },
      });

      usuario = await this.prisma.$transaction(async (tx) => {
        const nuevo = await tx.usuario.create({
          data: {
            correo: correoNormalizado,
            nombre: primerNombre,
            apellido: apellidos,
            nombreCompleto,
            googleId,
            fotoUrl: picture || null,
            proveedorAuth: 'google',
            rol: 'estudiante',
            correoVerificado: true,
          },
        });

        if (rolEstudiante) {
          await tx.usuarioRol.create({
            data: {
              usuarioId: nuevo.id,
              rolId: rolEstudiante.id,
            },
          });
        }

        // Crear suscripción inicial en el plan base gratuito (vigencia 1 año)
        const expiraEn = new Date();
        expiraEn.setDate(expiraEn.getDate() + 365);

        await tx.suscripcionUsuario.create({
          data: {
            usuarioId: nuevo.id,
            planId: 'PLAN_GRATUITO_BASE',
            estado: 'ACTIVA',
            iniciaEn: new Date(),
            expiraEn,
            preguntasGratisConsumidas: 0,
            simuladoresGratisConsumidos: 0,
          },
        });

        return tx.usuario.findUnique({
          where: { id: nuevo.id },
          include: {
            roles: {
              include: {
                rol: true,
              },
            },
          },
        }) as Promise<any>;
      });
    } else {
      // Si existía con correo local pero ahora usa Google, vinculamos su googleId y foto
      const datosActualizar: any = {};
      if (!usuario.googleId) datosActualizar.googleId = googleId;
      if (!usuario.fotoUrl && picture) datosActualizar.fotoUrl = picture;
      if (usuario.proveedorAuth === 'local')
        datosActualizar.proveedorAuth = 'google';

      if (Object.keys(datosActualizar).length > 0) {
        usuario = await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: datosActualizar,
          include: {
            roles: {
              include: {
                rol: true,
              },
            },
          },
        });
      }
    }

    if (!usuario) {
      throw new UnauthorizedException(
        'No se pudo completar el registro o autenticación del usuario con Google',
      );
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('La cuenta se encuentra desactivada');
    }

    const roles = usuario.roles?.map((r: any) => r.rol.nombre) || [
      RolNombre.ESTUDIANTE,
    ];
    const esAdmin =
      roles.includes(RolNombre.SUPERADMIN) ||
      roles.includes(RolNombre.TESORERIA);
    const rolFront = esAdmin
      ? 'administrador_academico'
      : usuario.rol || 'estudiante';

    // 4. Generar Tokens y registrar sesión
    const tokens = await this.generarYGuardarTokens(
      usuario.id,
      usuario.correo,
      roles,
    );
    const tokenAcceso = tokens.accessToken;

    const nombreUsuario =
      usuario.nombre || usuario.nombreCompleto?.split(' ')[0] || 'Estudiante';
    const apellidoUsuario =
      usuario.apellido ||
      usuario.nombreCompleto?.split(' ').slice(1).join(' ') ||
      '';

    const usuarioFormateado = {
      id: usuario.id,
      cedula: usuario.cedula || null,
      nombre: nombreUsuario,
      apellido: apellidoUsuario,
      nombreCompleto,
      correo: usuario.correo,
      rol: rolFront,
      roles,
      programaActivoId: usuario.programaActivoId || null,
      fechaRegistro: (usuario.creadoEn || new Date()).toISOString(),
    };

    return {
      tokenAcceso,
      tokens,
      usuario: usuarioFormateado,
    };
  }

  /**
   * Completar Perfil CACES (Cédula y Carrera obligatorias tras onboarding con Google)
   */
  async completarPerfil(usuarioId: string, dto: CompletarPerfilDto) {
    const cedulaLimpia = dto.cedula.trim();

    // 1. Validar algoritmo de cédula ecuatoriana
    const valCedula = validarCedulaEcuatoriana(cedulaLimpia);
    if (!valCedula.esValida) {
      throw new BadRequestException(
        valCedula.motivo || 'La cédula de identidad ecuatoriana no es válida',
      );
    }

    // 2. Validar que la cédula no pertenezca a otro estudiante
    const cedulaExistente = await this.prisma.usuario.findUnique({
      where: { cedula: cedulaLimpia },
    });

    if (cedulaExistente && cedulaExistente.id !== usuarioId) {
      throw new BadRequestException(
        'El número de cédula ya se encuentra registrado por otro usuario',
      );
    }

    // 2. Actualizar datos en la base de datos
    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        cedula: cedulaLimpia,
        programaActivoId: dto.programaActivoId.trim(),
      },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    const roles = usuarioActualizado.roles?.map((r: any) => r.rol.nombre) || [
      RolNombre.ESTUDIANTE,
    ];
    const esAdmin =
      roles.includes(RolNombre.SUPERADMIN) ||
      roles.includes(RolNombre.TESORERIA);
    const rolFront = esAdmin
      ? 'administrador_academico'
      : usuarioActualizado.rol || 'estudiante';

    const nombre =
      usuarioActualizado.nombre ||
      usuarioActualizado.nombreCompleto?.split(' ')[0] ||
      'Estudiante';
    const apellido =
      usuarioActualizado.apellido ||
      usuarioActualizado.nombreCompleto?.split(' ').slice(1).join(' ') ||
      '';

    const usuarioFormateado = {
      id: usuarioActualizado.id,
      cedula: usuarioActualizado.cedula,
      nombre,
      apellido,
      nombreCompleto: usuarioActualizado.nombreCompleto,
      correo: usuarioActualizado.correo,
      rol: rolFront,
      roles,
      programaActivoId: usuarioActualizado.programaActivoId,
      fechaRegistro: (usuarioActualizado.creadoEn || new Date()).toISOString(),
    };

    // Generar un token actualizado para comodidad del cliente
    const tokens = await this.generarYGuardarTokens(
      usuarioActualizado.id,
      usuarioActualizado.correo,
      roles,
    );

    return {
      ...usuarioFormateado,
      usuario: usuarioFormateado,
      tokenAcceso: tokens.accessToken,
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

    await this.prisma.sesionAutenticacion.create({
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
