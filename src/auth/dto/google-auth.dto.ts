import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
    description: 'ID Token JWT entregado por Google Identity Services (GIS)',
  })
  @IsString({ message: 'El token de Google debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token de Google es requerido' })
  token: string;
}
