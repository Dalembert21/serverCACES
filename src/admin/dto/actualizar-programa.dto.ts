import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class ActualizarProgramaDto {
  @ApiProperty({ example: 'CACES-ODO-2026-V2', required: false })
  @IsOptional()
  @IsString({ message: 'El código oficial CACES debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  codigoOficialCaces?: string;

  @ApiProperty({ example: 'Odontología Especializada', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, { message: 'El nombre debe tener al menos 3 caracteres coherentes' })
  nombre?: string;

  @ApiProperty({ example: 'Descripción actualizada', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @ApiProperty({ example: 180, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'duracionMinutos debe ser un número' })
  @Min(30, { message: 'La duración mínima debe ser 30 minutos' })
  duracionMinutos?: number;

  @ApiProperty({ example: 120, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'totalPreguntas debe ser un número' })
  @Min(10, { message: 'El total de preguntas debe ser al menos 10' })
  totalPreguntas?: number;

  @ApiProperty({ example: 70, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'notaMinimaAprobacion debe ser un número' })
  @Min(1, { message: 'La nota mínima debe ser mayor a 0' })
  notaMinimaAprobacion?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;
}
