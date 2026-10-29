import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class CrearProgramaDto {
  @ApiProperty({ example: 'prog-odontologia', description: 'ID identificador del programa' })
  @IsString({ message: 'El ID del programa debe ser texto' })
  @IsNotEmpty({ message: 'El ID del programa es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  id: string;

  @ApiProperty({ example: 'CACES-ODO-2026', description: 'Código oficial registrado ante CACES' })
  @IsString({ message: 'El código oficial CACES debe ser texto' })
  @IsNotEmpty({ message: 'El código oficial CACES es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  codigoOficialCaces: string;

  @ApiProperty({ example: 'Odontología General CACES', description: 'Nombre oficial de la carrera' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del programa es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, { message: 'El nombre debe tener al menos 3 caracteres coherentes' })
  nombre: string;

  @ApiProperty({ example: 'Preparación integral para el Examen de Habilitación para el Ejercicio Profesional (EHEP) en Odontología', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @ApiProperty({ example: 180, description: 'Duración oficial del simulador en minutos', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'duracionMinutos debe ser un número' })
  @Min(30, { message: 'La duración mínima del examen debe ser 30 minutos' })
  duracionMinutos?: number;

  @ApiProperty({ example: 120, description: 'Total de preguntas del examen oficial', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'totalPreguntas debe ser un número' })
  @Min(10, { message: 'El total de preguntas debe ser al menos 10' })
  totalPreguntas?: number;

  @ApiProperty({ example: 70, description: 'Nota mínima de aprobación sobre 100', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'notaMinimaAprobacion debe ser un número' })
  @Min(1, { message: 'La nota mínima debe ser mayor a 0' })
  notaMinimaAprobacion?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;
}
