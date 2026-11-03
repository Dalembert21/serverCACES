import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FiltrosHistorialDto {
  @ApiPropertyOptional({ description: 'Nombre de la tabla auditada (ej: SUBMODULOS_ACADEMICOS, USUARIOS)' })
  @IsOptional()
  @IsString()
  tablaAfectada?: string;

  @ApiPropertyOptional({ description: 'ID del registro afectado' })
  @IsOptional()
  @IsString()
  registroId?: string;

  @ApiPropertyOptional({ description: 'ID del usuario operador' })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @ApiPropertyOptional({ enum: ['INSERT', 'UPDATE', 'DELETE'], description: 'Acción ejecutada' })
  @IsOptional()
  @IsIn(['INSERT', 'UPDATE', 'DELETE'])
  tipoAccion?: 'INSERT' | 'UPDATE' | 'DELETE';

  @ApiPropertyOptional({ enum: ['USUARIO', 'SISTEMA', 'PROCESO_AUTOMATICO'], description: 'Tipo de actor' })
  @IsOptional()
  @IsIn(['USUARIO', 'SISTEMA', 'PROCESO_AUTOMATICO'])
  tipoActor?: 'USUARIO' | 'SISTEMA' | 'PROCESO_AUTOMATICO';

  @ApiPropertyOptional({ description: 'Módulo funcional' })
  @IsOptional()
  @IsString()
  modulo?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 20;
}

