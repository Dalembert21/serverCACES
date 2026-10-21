import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { RenovarTokenDto } from './dto/renovar-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
      'Valida credenciales de acceso de cualquier rol (Admin, Estudiante, Revisor, Tutor) y devuelve tokens JWT.',
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
