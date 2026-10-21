import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator.js';
import type { UsuarioAutenticado } from '../common/interfaces/usuario-autenticado.interface.js';
import { AccesibilidadService } from './accesibilidad.service.js';
import {
  ActualizarPreferenciaAccesibilidadDto,
  RespuestaPreferenciaAccesibilidadDto,
} from './dto/index.js';

@ApiTags('Accesibilidad e Inclusión')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('accesibilidad')
export class AccesibilidadController {
  constructor(private readonly accesibilidadService: AccesibilidadService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar preferencias de accesibilidad del usuario autenticado',
    description:
      'Devuelve las preferencias funcionales de interfaz (tamaño de texto, contraste, movimiento, etc.) asociadas a la cuenta del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferencias de accesibilidad obtenidas correctamente.',
    type: RespuestaPreferenciaAccesibilidadDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Acceso no autorizado: debes proporcionar un token Bearer válido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
  })
  async obtenerPreferencias(@UsuarioActual() usuario: UsuarioAutenticado) {
    const datos = await this.accesibilidadService.obtenerPreferencias(
      usuario.id,
    );
    return {
      mensaje: 'Preferencias de accesibilidad obtenidas correctamente',
      datos,
    };
  }

  @Patch()
  @ApiOperation({
    summary: 'Actualizar parcialmente preferencias de accesibilidad',
    description:
      'Actualiza selectivamente los atributos de accesibilidad proporcionados para el usuario autenticado. No modifica los valores omitidos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferencias de accesibilidad actualizadas correctamente.',
    type: RespuestaPreferenciaAccesibilidadDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos o propiedades no permitidas en el cuerpo de la solicitud.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Acceso no autorizado: debes proporcionar un token Bearer válido.',
  })
  async actualizarPreferencias(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: ActualizarPreferenciaAccesibilidadDto,
  ) {
    const datos = await this.accesibilidadService.actualizarPreferencias(
      usuario.id,
      dto,
    );
    return {
      mensaje: 'Preferencias de accesibilidad actualizadas correctamente',
      datos,
    };
  }

  @Put()
  @ApiOperation({
    summary: 'Guardar preferencias de accesibilidad completas o parciales',
    description:
      'Permite guardar y actualizar las preferencias de accesibilidad del usuario autenticado mediante método HTTP PUT idempotente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferencias de accesibilidad guardadas correctamente.',
    type: RespuestaPreferenciaAccesibilidadDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos o propiedades no permitidas en el cuerpo de la solicitud.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Acceso no autorizado: debes proporcionar un token Bearer válido.',
  })
  async guardarPreferencias(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: ActualizarPreferenciaAccesibilidadDto,
  ) {
    const datos = await this.accesibilidadService.actualizarPreferencias(
      usuario.id,
      dto,
    );
    return {
      mensaje: 'Preferencias de accesibilidad actualizadas correctamente',
      datos,
    };
  }

  @Post('restablecer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restaurar preferencias de accesibilidad por defecto',
    description:
      'Restablece todas las opciones de accesibilidad del usuario autenticado a los valores predeterminados de la plataforma.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Preferencias de accesibilidad restablecidas a los valores por defecto.',
    type: RespuestaPreferenciaAccesibilidadDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Acceso no autorizado: debes proporcionar un token Bearer válido.',
  })
  async restablecerPreferencias(@UsuarioActual() usuario: UsuarioAutenticado) {
    const datos = await this.accesibilidadService.restablecerPreferencias(
      usuario.id,
    );
    return {
      mensaje:
        'Preferencias de accesibilidad restablecidas a los valores por defecto',
      datos,
    };
  }
}
