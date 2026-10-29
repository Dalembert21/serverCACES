import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import {
  EsCedulaEcuatoriana,
  EsClaveSegura,
  EsCorreoCoherente,
  EsNombrePersona,
} from '../../common/index.js';

export class RegistroDto {
  @ApiProperty({
    example: 'estudiante@caces-prep.ec',
    description: 'Correo electrónico del estudiante para inicio de sesión',
  })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @EsCorreoCoherente({
    message: 'El correo electrónico no es coherente o contiene caracteres no permitidos',
  })
  correo: string;

  @ApiProperty({
    example: 'CacesSeguro2026!',
    description: 'Contraseña de acceso (mínimo 8 caracteres con letras y números)',
    required: false,
    minLength: 8,
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @EsClaveSegura({
    message: 'La contraseña no puede consistir únicamente en puntos o caracteres repetidos. Debe incluir letras y números.',
  })
  contrasena?: string;

  @ApiProperty({
    example: 'CacesSeguro2026!',
    description: 'Clave de acceso enviada desde el frontend',
    required: false,
    minLength: 8,
  })
  @IsOptional()
  @IsString({ message: 'La clave debe ser una cadena de texto' })
  @MinLength(8, { message: 'La clave debe tener al menos 8 caracteres' })
  @EsClaveSegura({
    message: 'La clave no puede consistir únicamente en puntos o caracteres repetidos. Debe incluir letras y números.',
  })
  clave?: string;

  @ApiProperty({
    example: 'Carlos Alberto Moreira',
    description: 'Nombre y apellido del estudiante',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsNombrePersona({
    message: 'El nombre completo solo debe contener letras válidas sin números ni puntos',
  })
  nombreCompleto?: string;

  @ApiProperty({
    example: 'Carlos',
    description: 'Primer nombre del estudiante',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsNombrePersona({
    message: 'El nombre solo debe contener letras válidas (mínimo 2 letras) sin números ni puntos',
  })
  nombre?: string;

  @ApiProperty({
    example: 'Moreira',
    description: 'Apellido del estudiante',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsNombrePersona({
    message: 'El apellido solo debe contener letras válidas (mínimo 2 letras) sin números ni puntos',
  })
  apellido?: string;

  @ApiProperty({
    example: '1710034065',
    description: 'Cédula de identidad ecuatoriana válida (10 dígitos)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsCedulaEcuatoriana({
    message: 'La cédula de identidad ecuatoriana no es válida',
  })
  cedula?: string;

  @ApiProperty({
    example: 'prog-medicina',
    description: 'Especialidad académica CACES seleccionada inicialmente',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El programa debe ser una cadena de texto' })
  programaInicialId?: string;
}
