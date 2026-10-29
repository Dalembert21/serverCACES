import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { EsCedulaEcuatoriana } from '../../common/index.js';

export class CompletarPerfilDto {
  @ApiProperty({
    example: '1710034065',
    description: 'Cédula de identidad ecuatoriana válida (exactamente 10 dígitos numéricos)',
  })
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsCedulaEcuatoriana({
    message: 'La cédula ingresada no es válida según el Registro Civil de Ecuador',
  })
  cedula: string;


  @ApiProperty({
    example: 'prog-medicina',
    description: 'Identificador del programa académico oficial CACES',
  })
  @IsString({ message: 'El programa activo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El programa académico es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  programaActivoId: string;
}
