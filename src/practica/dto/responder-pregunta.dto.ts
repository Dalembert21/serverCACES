import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ResponderPreguntaDto {
  @ApiProperty({
    example: 'uuid-pregunta-o-version',
    description: 'Identificador único de la pregunta',
  })
  @IsString({ message: 'El identificador de la pregunta debe ser texto' })
  @IsNotEmpty({ message: 'El identificador de la pregunta es obligatorio' })
  preguntaId: string;

  @ApiProperty({
    example: 'uuid-opcion-seleccionada',
    description: 'Identificador de la opción seleccionada por el estudiante',
  })
  @IsString({ message: 'El identificador de la opción debe ser texto' })
  @IsNotEmpty({ message: 'El identificador de la opción es obligatorio' })
  opcionId: string;

  @ApiProperty({
    example: 45,
    description: 'Tiempo consumido en responder (segundos)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo debe ser un valor numérico' })
  @Min(0, { message: 'El tiempo no puede ser negativo' })
  @Max(86400, { message: 'El tiempo excede el límite permitido de una sesión' })
  tiempoSegundos?: number;
}

