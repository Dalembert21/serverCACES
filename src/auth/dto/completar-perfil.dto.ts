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
    example: 1,
    description: 'Identificador del programa académico oficial CACES (número o nombre de carrera)',
  })
  @IsNotEmpty({ message: 'El programa académico es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))
      ? Number(value)
      : typeof value === 'string'
      ? value.trim()
      : value,
  )
  programaActivoId: number | string;
}
