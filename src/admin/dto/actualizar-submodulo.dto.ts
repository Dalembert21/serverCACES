import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class ActualizarSubmoduloDto {
  @ApiProperty({
    example: 'Cardiología Clínica',
    description: 'Nuevo nombre del submódulo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El nombre del submódulo debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @EsTextoCoherente(3, {
    message: 'El nombre del submódulo debe ser coherente y tener al menos 3 caracteres',
  })
  nombre?: string;

  @ApiProperty({
    example: 'Patología cardiovascular y arritmias',
    description: 'Descripción actualizada',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  descripcion?: string;

  @ApiProperty({
    example: 2,
    description: 'Orden numérico de visualización',
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El orden de visualización debe ser un número entero' })
  @Min(0, { message: 'El orden no puede ser negativo' })
  orden?: number;

  @ApiProperty({
    example: true,
    description: 'Estado activo o inactivo',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser booleano' })
  activo?: boolean;
}

