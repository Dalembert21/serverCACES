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

export class ActualizarPlanDto {
  @ApiProperty({ example: 'Plan Semestral Pro Actualizado', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, { message: 'El nombre debe tener al menos 3 caracteres coherentes' })
  nombre?: string;

  @ApiProperty({ example: 'Nueva descripción del plan', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  descripcion?: string;

  @ApiProperty({ example: 59.99, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precioDolares?: number;

  @ApiProperty({ example: 180, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'La duración en días debe ser un número' })
  @Min(1, { message: 'La duración mínima debe ser al menos 1 día' })
  duracionDiasVigencia?: number;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El límite de preguntas debe ser un número' })
  @Min(0, { message: 'El límite no puede ser negativo' })
  limitePreguntasGratis?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'accesoSimuladoresIlimitados debe ser booleano' })
  accesoSimuladoresIlimitados?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'accesoAnaliticaAvanzada debe ser booleano' })
  accesoAnaliticaAvanzada?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;
}
