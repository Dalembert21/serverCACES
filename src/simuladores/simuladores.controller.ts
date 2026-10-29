import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SimuladoresService } from './simuladores.service.js';
import { IniciarSimuladorDto } from './dto/iniciar-simulador.dto.js';
import { FinalizarSimuladorDto } from './dto/finalizar-simulador.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator.js';
import type { UsuarioAutenticado } from '../common/interfaces/usuario-autenticado.interface.js';

@ApiTags('Simuladores Oficiales CACES')
@Controller('simuladores')
export class SimuladoresController {
  constructor(private readonly simuladoresService: SimuladoresService) {}

  @Get('configuracion/:programaId')
  @ApiOperation({
    summary: 'Consultar configuración del simulador por carrera',
    description: 'Devuelve duración, cantidad de preguntas y nota mínima de aprobación oficial.',
  })
  async obtenerConfiguracion(@Param('programaId') programaId: string) {
    return this.simuladoresService.obtenerConfiguracion(programaId);
  }

  @Post('iniciar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar un intento de simulador',
    description: 'Crea un registro de intento cronometrado y habilita la prueba.',
  })
  async iniciar(
    @Body() dto: IniciarSimuladorDto,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ) {
    return this.simuladoresService.iniciarIntento(dto, usuario?.id);
  }

  @Post('finalizar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalizar simulacro y consolidar resultados',
    description: 'Calcula calificación sobre 100, veredicto aprobatorio y desglose por área CACES.',
  })
  async finalizar(@Body() dto: FinalizarSimuladorDto) {
    return this.simuladoresService.finalizarIntento(dto);
  }

  @Get('historial')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Consultar historial de simulacros del estudiante',
    description: 'Devuelve los intentos realizados con sus respectivas calificaciones y fechas.',
  })
  async obtenerHistorial(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.simuladoresService.obtenerHistorial(usuario.id);
  }
}
