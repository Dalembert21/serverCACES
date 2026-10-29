import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { EsCorreoCoherente } from '../../common/index.js';

export class RecuperarClaveDto {
  @ApiProperty({
    example: 'estudiante@caces-prep.ec',
    description: 'Correo electrónico registrado para recibir enlace de recuperación',
  })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @EsCorreoCoherente({
    message: 'El correo electrónico no es coherente o contiene caracteres no permitidos',
  })
  correo: string;
}
