import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { EsCedulaEcuatoriana, EsTextoCoherente } from '../../common/index.js';

export class CrearEstudianteAdminDto {
  @ApiProperty({
    example: '1710034065',
    description: 'Cédula de identidad ecuatoriana válida',
  })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @IsString({ message: 'La cédula debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsCedulaEcuatoriana({ message: 'La cédula de identidad ecuatoriana no es válida' })
  cedula: string;

  @ApiProperty({ example: 'Carlos Andrés', description: 'Nombres del estudiante' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(2, { message: 'El nombre debe contener al menos 2 caracteres coherentes' })
  nombre: string;

  @ApiProperty({ example: 'Mendoza Zambrano', description: 'Apellidos del estudiante' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(2, { message: 'El apellido debe contener al menos 2 caracteres coherentes' })
  apellido: string;

  @ApiProperty({ example: 'carlos.mendoza@universidad.ec', description: 'Correo electrónico institucional o personal' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El formato del correo electrónico es inválido' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  correo: string;

  @ApiProperty({ example: '0991234567', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^09\d{8}$/, { message: 'El teléfono celular debe tener 10 dígitos e iniciar con 09' })
  telefonoContacto?: string;

  @ApiProperty({ example: 'MEDICINA', description: 'Código o ID de la carrera académica CACES' })
  @IsNotEmpty({ message: 'La carrera o programa es obligatorio' })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  programaId: string;

  @ApiProperty({
    example: 'PLAN_PRO_MENSUAL',
    description: 'Plan comercial inicial a asignar (ej. PLAN_PRO_MENSUAL, PLAN_GRATUITO_BASE)',
    required: false,
    default: 'PLAN_GRATUITO_BASE',
  })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ example: 30, description: 'Días de vigencia si se activa Plan Pro', required: false, default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  diasVigencia?: number;

  @ApiProperty({
    example: 'Caces2026!',
    description: 'Contraseña provisional inicial (opcional, si se omite se genera automáticamente)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña provisional debe tener al menos 6 caracteres' })
  password?: string;
}

