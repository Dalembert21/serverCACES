import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class ActualizarEstudianteAdminDto {
  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @IsString({ message: 'La cédula debe ser texto' })
  @Matches(/^\d{10}$/, { message: 'La cédula ecuatoriana debe contener exactamente 10 dígitos numéricos' })
  cedula?: string;

  @ApiProperty({ example: 'Carlos', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(2, { message: 'El nombre debe contener al menos 2 letras' })
  nombre?: string;

  @ApiProperty({ example: 'Mendoza', required: false })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(2, { message: 'El apellido debe contener al menos 2 letras' })
  apellido?: string;

  @ApiProperty({ example: 'carlos.mendoza@universidad.edu.ec', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'El formato del correo electrónico es inválido' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  correo?: string;

  @ApiProperty({ example: '+593987654321', required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  telefonoContacto?: string;

  @ApiProperty({ example: 'prog-medicina', required: false })
  @IsOptional()
  @IsString({ message: 'El ID del programa académico debe ser texto' })
  programaActivoId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;
}
