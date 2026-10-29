import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuscripcionesService } from './suscripciones.service.js';
import { DeclararPagoDto } from './dto/declarar-pago.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator.js';
import type { UsuarioAutenticado } from '../common/interfaces/usuario-autenticado.interface.js';

@ApiTags('Monetización y Suscripciones')
@Controller('suscripciones')
export class SuscripcionesController {
  constructor(private readonly suscripcionesService: SuscripcionesService) {}

  @Get('planes')
  @ApiOperation({
    summary: 'Listar planes de suscripción disponibles',
    description: 'Devuelve precios, beneficios y duraciones de los planes CACES.',
  })
  async listarPlanes() {
    return this.suscripcionesService.listarPlanes();
  }

  @Get('mi-suscripcion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Consultar estado de la suscripción del usuario autenticado',
  })
  async obtenerMiSuscripcion(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.suscripcionesService.obtenerMiSuscripcion(usuario.id);
  }

  @Post('declarar-pago')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar comprobante de depósito/transferencia bancaria',
  })
  async declararPago(
    @Body() dto: DeclararPagoDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.suscripcionesService.declararPago(dto, usuario.id);
  }
}
