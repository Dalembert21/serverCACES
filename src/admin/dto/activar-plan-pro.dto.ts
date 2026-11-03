import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { EsCodigoReferencia, EsTextoCoherente } from '../../common/index.js';

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

  @ApiPropertyOptional({
    example: 'Banco Pichincha',
    description: 'Entidad bancaria o cooperativa donde se realizó el pago',
  })
  @IsOptional()
  @IsString({ message: 'El banco debe ser una cadena de texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, { message: 'El nombre del banco debe ser texto coherente' })
  banco?: string;

  @ApiPropertyOptional({
    example: 'TRANS-984210',
    description: 'Número de comprobante o referencia de la transacción',
  })
  @IsOptional()
  @IsString({ message: 'El número de referencia debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsCodigoReferencia({ message: 'La referencia debe ser un código alfanumérico coherente' })
  numeroReferencia?: string;

  @ApiPropertyOptional({
    example: 14.99,
    description: 'Monto pagado en dólares',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  monto?: number;
}
