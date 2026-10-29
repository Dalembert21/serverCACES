import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IniciarSimuladorDto {
  @ApiProperty({
    example: 'prog-medicina',
    description: 'Identificador del programa académico CACES',
  })
  @IsString({ message: 'El programa debe ser texto' })
  @IsNotEmpty({ message: 'El programa es obligatorio' })
  programaId: string;

  @ApiProperty({
    example: 'SIMULACRO_OFICIAL',
    description: 'Modalidad de evaluación (SIMULACRO_OFICIAL, DIAGNOSTICO)',
    required: false,
  })
  @IsOptional()
  @IsString()
  modalidad?: string;
}
