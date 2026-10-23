import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProgramasService } from './programas.service.js';

@ApiTags('Catálogo Académico y Programas')
@Controller('programas')
export class ProgramasController {
  constructor(private readonly programasService: ProgramasService) {}

  @Get()
  @ApiOperation({
    summary:
      'Listar programas académicos oficiales activos y sus parámetros de examen',
    description:
      'Devuelve las carreras CACES disponibles con datos directos de la base de datos (duración límite, preguntas oficiales, puntaje de aprobación y áreas temáticas).',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de programas obtenido correctamente.',
  })
  async listarProgramas() {
    return this.programasService.listarProgramas();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar detalle de un programa académico por identificador',
  })
  @ApiResponse({
    status: 200,
    description: 'Programa académico obtenido correctamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Programa académico no encontrado.',
  })
  async obtenerPrograma(@Param('id') id: string) {
    return this.programasService.obtenerProgramaPorId(id);
  }
}
