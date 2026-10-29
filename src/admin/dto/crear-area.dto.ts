import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class CrearAreaDto {
  @ApiProperty({ example: 'prog-medicina', description: 'ID de la carrera o ID de versión de temario' })
  @IsString({ message: 'El programaId debe ser texto' })
  @IsNotEmpty({ message: 'El programaId es obligatorio' })
  programaId: string;

  @ApiProperty({ example: 'Medicina Interna', description: 'Nombre del área temática' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del área es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, { message: 'El nombre debe tener al menos 3 caracteres coherentes' })
  nombre: string;

  @ApiProperty({ example: 'Cardiología, Neumología y Gastroenterología', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @ApiProperty({ example: 25.0, description: 'Peso porcentual en el examen CACES (0 a 100)' })
  @IsNumber({}, { message: 'El peso porcentual debe ser un número' })
  @Min(1, { message: 'El peso porcentual mínimo es 1%' })
  @Max(100, { message: 'El peso porcentual máximo es 100%' })
  pesoPorcentual: number;
}
