import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ActualizarEstadoPreguntaDto {
  @ApiProperty({
    example: 'PUBLICADA',
    enum: [
      'BORRADOR',
      'EN_REVISION',
      'APROBADA',
      'PUBLICADA',
      'OBSERVADA',
      'RETIRADA',
    ],
    description: 'Nuevo estado de revisión docente de la pregunta',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  @IsEnum(
    [
      'BORRADOR',
      'EN_REVISION',
      'APROBADA',
      'PUBLICADA',
      'OBSERVADA',
      'RETIRADA',
    ],
    {
      message:
        'El estado debe ser uno de los siguientes: BORRADOR, EN_REVISION, APROBADA, PUBLICADA, OBSERVADA, RETIRADA',
    },
  )
  estado: string;
}
