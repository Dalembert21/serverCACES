import { PartialType } from '@nestjs/swagger';
import { CrearDepartamentoDto } from './crear-departamento.dto.js';

export class ActualizarDepartamentoDto extends PartialType(CrearDepartamentoDto) {}

