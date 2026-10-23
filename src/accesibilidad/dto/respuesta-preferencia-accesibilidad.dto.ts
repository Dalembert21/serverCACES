import { ApiProperty } from '@nestjs/swagger';
import { EspaciadoTexto, PaletaColor, TamanoTexto } from '@prisma/client';

export class RespuestaPreferenciaAccesibilidadDto {
  @ApiProperty({
    description: 'Identificador único del registro de preferencias',
    example: 'd3b07384-d113-4a18-97c9-4a43fc3de0a8',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador único del usuario autenticado',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  usuarioId: string;

  @ApiProperty({
    description: 'Tamaño del texto configurado para la interfaz gráfica',
    enum: TamanoTexto,
    example: TamanoTexto.NORMAL,
  })
  tamanoTexto: TamanoTexto;

  @ApiProperty({
    description: 'Indica si el modo de alto contraste está activado',
    example: false,
  })
  altoContraste: boolean;

  @ApiProperty({
    description: 'Indica si la tipografía adaptada para dislexia está activada',
    example: false,
  })
  fuenteDislexia: boolean;

  @ApiProperty({
    description: 'Nivel de espaciado entre líneas y caracteres configurado',
    enum: EspaciadoTexto,
    example: EspaciadoTexto.NORMAL,
  })
  espaciadoTexto: EspaciadoTexto;

  @ApiProperty({
    description: 'Indica si el modo de movimiento reducido está activado',
    example: false,
  })
  movimientoReducido: boolean;

  @ApiProperty({
    description: 'Indica si los subtítulos automáticos están activados',
    example: false,
  })
  subtitulosActivados: boolean;

  @ApiProperty({
    description: 'Indica si el cursor o puntero ampliado está activado',
    example: false,
  })
  cursorGrande: boolean;

  @ApiProperty({
    description: 'Indica si la guía de lectura en pantalla está activada',
    example: false,
  })
  lecturaGuiada: boolean;

  @ApiProperty({
    description: 'Paleta cromática configurada para daltonismo o contraste',
    enum: PaletaColor,
    example: PaletaColor.ESTANDAR,
  })
  paletaColor: PaletaColor;

  @ApiProperty({
    description: 'Indica si el soporte de síntesis de voz está habilitado',
    example: false,
  })
  sintesisVozLectura: boolean;

  @ApiProperty({
    description: 'Fecha y hora de creación de la preferencia',
    example: '2026-10-20T10:00:00.000Z',
  })
  creadoEn: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización',
    example: '2026-10-20T10:00:00.000Z',
  })
  actualizadoEn: Date;
}
