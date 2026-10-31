import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class CrearSubmoduloDto {
  @ApiProperty({
    example: 'MEDICINA',
    description: 'ID del módulo/programa académico al que pertenece el submódulo',
  })
  @IsString({ message: 'El identificador del módulo debe ser texto' })
  @IsNotEmpty({ message: 'El identificador del módulo es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  programaAcademicoId: string;

  @ApiProperty({
    example: 'Cardiología',
    description: 'Nombre del submódulo académico',
  })
  @IsString({ message: 'El nombre del submódulo debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del submódulo es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @EsTextoCoherente(3, {
    message: 'El nombre del submódulo debe ser coherente y tener al menos 3 caracteres',
  })
  nombre: string;

  @ApiProperty({
    example: 'Diagnóstico y manejo terapéutico de patologías cardiovasculares',
    description: 'Descripción pedagógica del submódulo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  descripcion?: string;

  @ApiProperty({
    example: 1,
    description: 'Orden numérico de visualización',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'El orden de visualización debe ser un número entero' })
  @Min(0, { message: 'El orden no puede ser negativo' })
  orden?: number;

  @ApiProperty({
    example: true,
    description: 'Estado inicial del submódulo',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser booleano' })
  activo?: boolean;
}

