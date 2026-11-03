import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { RolNombre } from '@prisma/client';
import {
  EsCedulaEcuatoriana,
  EsClaveSegura,
  EsNombrePersona,
  EsTextoCoherente,
} from '../../common/index.js';

export class CrearTrabajadorDto {
  @ApiProperty({
    example: 'trabajador@caces.edu.ec',
    description: 'Correo electrónico corporativo o personal del trabajador',
  })
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  correo: string;

  @ApiProperty({
    example: 'CacesSeguro2026!',
    description: 'Contraseña temporal de acceso',
  })
  @IsString({ message: 'La contraseña debe ser una cadena' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @EsClaveSegura({ message: 'La contraseña debe ser una combinación segura y coherente (letras y números sin secuencias idénticas)' })
  contrasena: string;

  @ApiProperty({
    example: 'María',
    description: 'Nombres del trabajador',
  })
  @IsString({ message: 'El nombre debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsNombrePersona({ message: 'El nombre debe ser un nombre personal válido' })
  nombre: string;

  @ApiProperty({
    example: 'López Morales',
    description: 'Apellidos del trabajador',
  })
  @IsString({ message: 'El apellido debe ser una cadena' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsNombrePersona({ message: 'El apellido debe ser un apellido personal válido' })
  apellido: string;

  @ApiPropertyOptional({
    example: '1723456789',
    description: 'Número de cédula o identificación',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsCedulaEcuatoriana({ message: 'La cédula ecuatoriana ingresada no es válida' })
  cedula?: string;

  @ApiPropertyOptional({
    example: '0991234567',
    description: 'Teléfono celular personal',
  })
  @IsOptional()
  @IsString()
  telefonoContacto?: string;

  @ApiProperty({
    enum: RolNombre,
    example: RolNombre.TESORERIA,
    description: 'Rol asignado al trabajador en el sistema',
  })
  @IsEnum(RolNombre, {
    message: 'El rol debe ser válido (SUPERADMIN o TESORERIA)',
  })
  rol: RolNombre;

  @ApiProperty({
    example: 'Analista de Pagos y Facturación',
    description: 'Cargo o puesto oficial que desempeña el trabajador',
  })
  @IsString({ message: 'El cargo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El cargo es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, { message: 'El cargo debe contener al menos 3 caracteres coherentes' })
  cargo: string;

  @ApiPropertyOptional({
    example: 'uuid-departamento-id',
    description: 'ID del departamento al que pertenece el trabajador',
  })
  @IsOptional()
  @IsString()
  departamentoId?: string;

  @ApiPropertyOptional({
    example: 'Tesorería y Finanzas',
    description: 'Departamento o área a la que pertenece',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  departamento?: string;

  @ApiPropertyOptional({
    example: 'Ext. 104',
    description: 'Teléfono o extensión de oficina',
  })
  @IsOptional()
  @IsString()
  telefonoOficina?: string;

  @ApiPropertyOptional({
    example: 'Trabajador contratado para el período académico 2026',
    description: 'Observaciones internas o notas de auditoría',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
