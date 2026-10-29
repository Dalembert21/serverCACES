import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { RolNombre } from '@prisma/client';

export class ActualizarTrabajadorDto {
  @ApiPropertyOptional({
    example: 'trabajador.actualizado@caces.edu.ec',
    description: 'Nuevo correo electrónico del trabajador',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  correo?: string;

  @ApiPropertyOptional({
    example: 'María Elena',
    description: 'Nombres del trabajador',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  nombre?: string;

  @ApiPropertyOptional({
    example: 'López Morales',
    description: 'Apellidos del trabajador',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  apellido?: string;

  @ApiPropertyOptional({
    example: '1723456789',
    description: 'Número de cédula o identificación',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  cedula?: string;

  @ApiPropertyOptional({
    example: '0991234567',
    description: 'Teléfono celular personal',
  })
  @IsOptional()
  @IsString()
  telefonoContacto?: string;

  @ApiPropertyOptional({
    enum: RolNombre,
    example: RolNombre.TESORERIA,
    description: 'Nuevo rol en el sistema',
  })
  @IsOptional()
  @IsEnum(RolNombre, {
    message: 'El rol debe ser válido (SUPERADMIN o TESORERIA)',
  })
  rol?: RolNombre;

  @ApiPropertyOptional({
    example: 'Jefa de Tesorería y Facturación',
    description: 'Cargo o puesto oficial que desempeña',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  cargo?: string;

  @ApiPropertyOptional({
    example: 'uuid-departamento-id',
    description: 'ID del departamento asignado',
  })
  @IsOptional()
  @IsString()
  departamentoId?: string;

  @ApiPropertyOptional({
    example: 'Dirección Financiera',
    description: 'Departamento o área asignada',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  departamento?: string;

  @ApiPropertyOptional({
    example: 'Ext. 108',
    description: 'Teléfono o extensión de oficina',
  })
  @IsOptional()
  @IsString()
  telefonoOficina?: string;

  @ApiPropertyOptional({
    example: 'Promovida a jefa de área',
    description: 'Observaciones internas',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado de la cuenta y perfil laboral (activo/inactivo)',
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
