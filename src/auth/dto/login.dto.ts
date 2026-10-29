import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@caces-prep.ec',
    description: 'Correo electrónico del usuario',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El correo debe ser una cadena de texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @Matches(/^(?![\.\-_~`!@#$%^&*()+=\[\]{}|\\:;"'<>,?\/]+$).+$/, {
    message: 'El correo no puede consistir únicamente en símbolos o puntos',
  })
  correo?: string;

  @ApiProperty({
    example: '1710034065 o admin@caces-prep.ec',
    description: 'Identificador (Cédula o Correo) enviado desde el frontend',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El identificador debe ser una cadena de texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(/^(?![\.\-_~`!@#$%^&*()+=\[\]{}|\\:;"'<>,?\/]+$).+$/, {
    message: 'El identificador no puede consistir únicamente en símbolos o puntos',
  })
  identificador?: string;

  @ApiProperty({
    example: 'CacesSeguro2026!',
    description: 'Contraseña de la cuenta',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena?: string;

  @ApiProperty({
    example: 'CacesSeguro2026!',
    description: 'Clave de acceso enviada desde el frontend',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La clave debe ser una cadena de texto' })
  @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
  clave?: string;
}


