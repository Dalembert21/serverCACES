import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class RechazarPagoDto {
  @ApiProperty({
    example: 'El número de comprobante no coincide con la cartola bancaria.',
    description: 'Motivo o justificación del rechazo del comprobante de pago',
  })
  @IsString({ message: 'El motivo de observación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El motivo de rechazo es obligatorio para registrar la observación' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(5, {
    message: 'El motivo debe contener al menos 5 caracteres de texto coherente',
  })
  motivo: string;
}
