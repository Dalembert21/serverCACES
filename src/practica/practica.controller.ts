import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PracticaService } from './practica.service.js';
import { ResponderPreguntaDto } from './dto/responder-pregunta.dto.js';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator.js';
import type { UsuarioAutenticado } from '../common/interfaces/usuario-autenticado.interface.js';

@ApiTags('Práctica Guiada y Banco de Preguntas')
@Controller('practica')
export class PracticaController {
  constructor(private readonly practicaService: PracticaService) {}

  @Get('preguntas')
  @ApiOperation({
    summary: 'Obtener preguntas de práctica para el estudiante',
    description:
      'Devuelve el banco de preguntas formateado para la interfaz de práctica guiada, filtrable por programa, área y submódulo.',
  })
  @ApiQuery({
    name: 'programaId',
    required: false,
    example: 'prog-medicina',
    description: 'Código de la carrera CACES o módulo',
  })
  @ApiQuery({
    name: 'submoduloId',
    required: false,
    example: 'uuid-submodulo',
    description: 'Identificador del submódulo académico',
  })
  @ApiQuery({
    name: 'areaId',
    required: false,
    example: 'area-id-uuid',
    description: 'Identificador del área de conocimiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Banco de preguntas obtenido con éxito.',
  })
  async obtenerPreguntas(
    @Query('programaId') programaId?: string,
    @Query('submoduloId') submoduloId?: string,
    @Query('areaId') areaId?: string,
  ) {
    return this.practicaService.obtenerPreguntas(programaId, areaId, submoduloId);
  }

  @Post('respuestas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar respuesta de práctica',
    description:
      'Valida si la opción elegida es correcta, devuelve el veredicto y acumula el índice de dominio cognitivo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta validada y procesada correctamente.',
  })
  async registrarRespuesta(
    @Body() dto: ResponderPreguntaDto,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ) {
    return this.practicaService.registrarRespuesta(dto, usuario?.id);
  }
}
