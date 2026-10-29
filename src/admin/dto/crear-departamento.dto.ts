import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class CrearDepartamentoDto {
  @ApiProperty({
    example: 'Tesorería y Finanzas',
    description: 'Nombre oficial del departamento o división institucional',
  })
  @IsString({ message: 'El nombre del departamento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del departamento es obligatorio' })
  @MinLength(3, { message: 'El nombre del departamento debe tener al menos 3 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, {
    message: 'El nombre del departamento debe contener texto coherente',
  })
  nombre: string;

  @ApiPropertyOptional({
    example: 'Gestión de cobros, recaudación y facturación institucional',
    description: 'Descripción operativa y responsabilidades del departamento',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  descripcion?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado de disponibilidad del departamento para asignación',
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;
}

