import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class FinalizarSimuladorDto {
  @ApiProperty({
    example: 'uuid-intento-simulador',
    description: 'Identificador del intento de simulador en progreso',
  })
  @IsString({ message: 'El identificador del intento debe ser texto' })
  @IsNotEmpty({ message: 'El identificador del intento es obligatorio' })
  intentoId: string;

  @ApiProperty({
    example: 7200,
    description: 'Tiempo total consumido en segundos durante el simulacro',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo empleado debe ser un número' })
  @Min(0, { message: 'El tiempo no puede ser negativo' })
  @Max(86400, { message: 'El tiempo excede el límite permitido para un simulacro' })
  tiempoEmpleadoSegundos?: number;
}

