import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator.js';
import type { UsuarioAutenticado } from '../common/interfaces/usuario-autenticado.interface.js';
import { AuthService } from './auth.service.js';
import { CompletarPerfilDto } from './dto/completar-perfil.dto.js';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RecuperarClaveDto } from './dto/recuperar-clave.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { RenovarTokenDto } from './dto/renovar-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticación con Google (Login / Registro unificado)',
    description:
      'Valida el ID token emitido por Google Identity Services y autentica o registra al estudiante.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación con Google exitosa.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de Google inválido o expirado.',
  })
  async loginGoogle(@Body() dto: GoogleAuthDto) {
    const datos = await this.authService.autenticarConGoogle(dto);
    return {
      exito: true,
      mensaje: 'Autenticación con Google exitosa',
      datos,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('completar-perfil')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Completar perfil CACES (Cédula y Carrera)',
    description:
      'Permite al estudiante ingresar su número de cédula ecuatoriana y carrera oficial tras registrarse con Google.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil CACES completado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'La cédula ya está registrada o el formato es inválido.',
  })
  async completarPerfil(@Req() req: any, @Body() dto: CompletarPerfilDto) {
    const usuarioId = req.user?.sub || req.user?.id;
    const datos = await this.authService.completarPerfil(usuarioId, dto);
    return {
      exito: true,
      mensaje: 'Perfil CACES completado correctamente',
      datos,
    };
  }

  @Post('registro')
  @ApiOperation({
    summary: 'Registrar un nuevo estudiante',
    description:
      'Crea una cuenta para un estudiante, asigna el rol ESTUDIANTE, inicializa su prueba gratuita y devuelve tokens JWT.',
  })
  @ApiResponse({
    status: 201,
    description: 'Estudiante registrado correctamente.',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo electrónico ya está registrado.',
  })
  async registro(@Body() dto: RegistroDto) {
    return this.authService.registrar(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida credenciales de acceso de cualquier rol (Superadmin, Tesorería, Estudiante) y devuelve tokens JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta inactiva.',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.iniciarSesion(dto);
  }

  @Post('renovar-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar token de acceso',
    description:
      'Emite un nuevo token de acceso (access token) utilizando un refresh token válido.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, expirado o revocado.',
  })
  async renovarToken(@Body() dto: RenovarTokenDto) {
    return this.authService.renovarToken(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Revoca las sesiones activas del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada con éxito.',
  })
  async logout(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.authService.cerrarSesion(usuario.id);
  }

  @Post('iniciar-sesion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión (Alias frontend)',
    description: 'Permite autenticación enviando identificador (cédula o correo) y clave.',
  })
  async iniciarSesionAlias(@Body() dto: LoginDto) {
    return this.authService.iniciarSesion(dto);
  }

  @Post('cerrar-sesion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión (Alias frontend)',
  })
  async cerrarSesionAlias() {
    return {
      mensaje: 'Sesión finalizada correctamente',
    };
  }

  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token de acceso (Alias frontend)',
  })
  async refrescarAlias(@Body() dto: RenovarTokenDto) {
    return this.authService.renovarToken(dto);
  }

  @Post('recuperar-clave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recuperar contraseña por correo electrónico',
  })
  async recuperarClave(@Body() dto: RecuperarClaveDto) {
    return {
      exito: true,
      mensaje:
        'Si el correo electrónico está registrado, recibirás un enlace de recuperación.',
      correo: dto.correo,
    };
  }


  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Consultar perfil del usuario autenticado',
    description:
      'Devuelve datos personales, roles vigentes, cuota de prueba gratuita y estado de suscripción activa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido correctamente.',
  })
  async obtenerPerfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.authService.obtenerPerfil(usuario.id);
  }
}
