import { PartialType } from '@nestjs/swagger';
import { CrearBancoCooperativaDto } from './crear-banco-cooperativa.dto.js';

export class ActualizarBancoCooperativaDto extends PartialType(
  CrearBancoCooperativaDto,
) {}

