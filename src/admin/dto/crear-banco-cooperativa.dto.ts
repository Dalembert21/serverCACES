import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TipoInstitucionFinanciera } from '@prisma/client';

export class CrearBancoCooperativaDto {
  @ApiProperty({
    example: 'Banco Pichincha',
    description: 'Nombre oficial del banco o cooperativa',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @ApiPropertyOptional({
    enum: TipoInstitucionFinanciera,
    default: TipoInstitucionFinanciera.BANCO,
    description: 'Tipo de institución financiera (BANCO, COOPERATIVA, OTRO)',
  })
  @IsOptional()
  @IsEnum(TipoInstitucionFinanciera, {
    message: 'El tipo debe ser BANCO, COOPERATIVA u OTRO',
  })
  tipo?: TipoInstitucionFinanciera = TipoInstitucionFinanciera.BANCO;

  @ApiPropertyOptional({
    default: true,
    description: 'Estado activo para disponibilidad en combos del frontend',
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  activo?: boolean = true;
}

