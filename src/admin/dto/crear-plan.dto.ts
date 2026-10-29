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

export class CrearPlanDto {
  @ApiProperty({ example: 'PLAN_SEMESTRAL_PRO', description: 'Código único identificador del plan' })
  @IsString({ message: 'El ID del plan debe ser texto' })
  @IsNotEmpty({ message: 'El ID del plan es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  id: string;

  @ApiProperty({ example: 'Plan Semestral Pro', description: 'Nombre comercial del plan' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del plan es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, { message: 'El nombre debe tener al menos 3 caracteres coherentes' })
  nombre: string;

  @ApiProperty({ example: 'Acceso total por 180 días a simuladores y analítica CACES', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  descripcion?: string;

  @ApiProperty({ example: 49.99, description: 'Precio en dólares estadounidenses' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precioDolares: number;

  @ApiProperty({ example: 180, description: 'Días de vigencia del plan' })
  @IsNumber({}, { message: 'La duración en días debe ser un número' })
  @Min(1, { message: 'La duración mínima debe ser al menos 1 día' })
  duracionDiasVigencia: number;

  @ApiProperty({ example: 20, description: 'Límite de preguntas gratis si aplica', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'El límite de preguntas debe ser un número' })
  @Min(0, { message: 'El límite no puede ser negativo' })
  limitePreguntasGratis?: number;

  @ApiProperty({ example: true, description: 'Habilita simuladores ilimitados', required: false })
  @IsOptional()
  @IsBoolean({ message: 'accesoSimuladoresIlimitados debe ser booleano' })
  accesoSimuladoresIlimitados?: boolean;

  @ApiProperty({ example: true, description: 'Habilita analítica de debilidades y fortalezas', required: false })
  @IsOptional()
  @IsBoolean({ message: 'accesoAnaliticaAvanzada debe ser booleano' })
  accesoAnaliticaAvanzada?: boolean;

  @ApiProperty({ example: true, description: 'Si el plan está disponible al público', required: false })
  @IsOptional()
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;
}
