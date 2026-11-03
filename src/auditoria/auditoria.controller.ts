import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolNombre } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AuditoriaService } from './auditoria.service.js';
import { FiltrosHistorialDto } from './dto/filtros-historial.dto.js';

@ApiTags('Auditoría y Trazabilidad Empresarial')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get('historial')
  @Roles(RolNombre.SUPERADMIN)
  @ApiOperation({
    summary: 'Consultar historial centralizado de operaciones y cambios',
    description:
      'Retorna el historial completo de inserciones, modificaciones y eliminaciones registradas en el sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de auditoría paginado obtenido exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: Se requieren privilegios de SUPERADMIN',
  })
  async consultarHistorial(@Query() filtros: FiltrosHistorialDto) {
    return this.auditoriaService.consultarHistorial(filtros);
  }

  @Get('registro/:tabla/:id')
  @Roles(RolNombre.SUPERADMIN)
  @ApiOperation({
    summary: 'Consultar trazabilidad y línea de tiempo de un registro específico',
    description:
      'Permite responder quién creó el registro, cuándo, quién lo modificó por última vez, cuántas veces fue modificado y su historial de estados.',
  })
  @ApiParam({
    name: 'tabla',
    description: 'Nombre de la tabla auditada (ej: PROGRAMAS_ACADEMICOS, SUBMODULOS_ACADEMICOS)',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del registro afectado',
  })
  @ApiResponse({
    status: 200,
    description: 'Trazabilidad del registro obtenida exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron registros de auditoría para la entidad',
  })
  async consultarTrazabilidadRegistro(
    @Param('tabla') tabla: string,
    @Param('id') id: string,
  ) {
    return this.auditoriaService.consultarTrazabilidadRegistro(tabla, id);
  }

  @Get('accesos-seguridad')
  @Roles(RolNombre.SUPERADMIN)
  @ApiOperation({
    summary: 'Consultar historial de eventos de seguridad y accesos',
    description:
      'Retorna el registro inmutable de autenticaciones, intentos fallidos y bloqueos de seguridad.',
  })
  async consultarAccesosSeguridad(
    @Query('pagina') pagina = 1,
    @Query('limite') limite = 20,
    @Query('usuarioId') usuarioId?: string,
  ) {
    return this.auditoriaService.consultarAccesosSeguridad(
      Number(pagina),
      Number(limite),
      usuarioId,
    );
  }
}

