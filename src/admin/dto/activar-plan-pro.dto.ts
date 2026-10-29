import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ActivarPlanProDto {
  @ApiPropertyOptional({
    example: 30,
    description: 'Días de vigencia del Plan Pro otorgado',
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Los días de vigencia deben ser un número entero' })
  @Min(1, { message: 'El plan debe durar al menos 1 día' })
  @Max(3650, { message: 'El plan no puede exceder los 3650 días' })
  diasVigencia?: number = 30;
}
