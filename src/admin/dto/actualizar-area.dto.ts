import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class ActualizarAreaDto {
  @ApiProperty({ example: 'Medicina Interna y Cuidados Críticos', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, { message: 'El nombre debe tener al menos 3 caracteres coherentes' })
  nombre?: string;

  @ApiProperty({ example: 'Descripción actualizada del área', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @ApiProperty({ example: 30.0, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El peso porcentual debe ser un número' })
  @Min(1, { message: 'El peso porcentual mínimo es 1%' })
  @Max(100, { message: 'El peso porcentual máximo es 100%' })
  pesoPorcentual?: number;
}
