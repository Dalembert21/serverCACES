import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  EsCodigoReferencia,
  EsTextoCoherente,
} from '../../common/index.js';

export class DeclararPagoDto {
  @ApiProperty({
    example: 'PLAN_SEMESTRAL_PRO',
    description: 'Identificador del plan adquirido',
  })
  @IsString({ message: 'El identificador del plan debe ser texto' })
  @IsNotEmpty({ message: 'El plan es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  planId: string;

  @ApiProperty({
    example: 'Banco Pichincha',
    description: 'Entidad bancaria desde la cual se realizó la transferencia/depósito',
  })
  @IsString({ message: 'La entidad bancaria debe ser texto' })
  @IsNotEmpty({ message: 'La entidad bancaria es obligatoria' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, {
    message: 'La entidad bancaria debe contener un nombre de entidad válido (sin solo puntos o símbolos)',
  })
  entidadBancariaOrigen: string;

  @ApiProperty({
    example: 'TRANSF-984210',
    description: 'Número de comprobante o referencia de la transacción',
  })
  @IsString({ message: 'La referencia debe ser texto' })
  @IsNotEmpty({ message: 'El número de comprobante es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsCodigoReferencia({
    message: 'El número de comprobante debe ser un código alfanumérico válido (mínimo 4 caracteres, sin puntos ni espacios)',
  })
  numeroComprobanteReferencia: string;

  @ApiProperty({
    example: 49.99,
    description: 'Monto pagado en dólares',
  })
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Min(1, { message: 'El monto mínimo a declarar es $1 USD' })
  @Max(10000, { message: 'El monto no puede exceder $10,000 USD' })
  montoDolares: number;

  @ApiProperty({
    example: 'https://storage.../comprobante.jpg',
    description: 'URL o foto del comprobante de depósito',
    required: false,
  })
  @IsOptional()
  @IsString()
  urlFotoComprobante?: string;
}

