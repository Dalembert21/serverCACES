import { ApiPropertyOptional } from '@nestjs/swagger';
import { EspaciadoTexto, PaletaColor, TamanoTexto } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class ActualizarPreferenciaAccesibilidadDto {
  @ApiPropertyOptional({
    description: 'Tamaño del texto para la interfaz gráfica',
    enum: TamanoTexto,
    example: TamanoTexto.NORMAL,
  })
  @IsOptional()
  @IsEnum(TamanoTexto, {
    message: `El tamaño de texto debe ser uno de los siguientes valores: ${Object.values(TamanoTexto).join(', ')}`,
  })
  tamanoTexto?: TamanoTexto;

  @ApiPropertyOptional({
    description: 'Habilita el modo de alto contraste con relación WCAG AAA',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'altoContraste debe ser un valor booleano (true o false)',
  })
  altoContraste?: boolean;

  @ApiPropertyOptional({
    description:
      'Aplica una tipografía optimizada para dislexia (ej. OpenDyslexic)',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'fuenteDislexia debe ser un valor booleano (true o false)',
  })
  fuenteDislexia?: boolean;

  @ApiPropertyOptional({
    description: 'Nivel de espaciado entre líneas y caracteres',
    enum: EspaciadoTexto,
    example: EspaciadoTexto.NORMAL,
  })
  @IsOptional()
  @IsEnum(EspaciadoTexto, {
    message: `El espaciado de texto debe ser uno de los siguientes valores: ${Object.values(EspaciadoTexto).join(', ')}`,
  })
  espaciadoTexto?: EspaciadoTexto;

  @ApiPropertyOptional({
    description:
      'Desactiva animaciones y transiciones complejas para evitar mareo o sobrecarga cognitiva',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'movimientoReducido debe ser un valor booleano (true o false)',
  })
  movimientoReducido?: boolean;

  @ApiPropertyOptional({
    description:
      'Activa subtítulos o transcripciones para contenidos multimedia o interactivos',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'subtitulosActivados debe ser un valor booleano (true o false)',
  })
  subtitulosActivados?: boolean;

  @ApiPropertyOptional({
    description:
      'Aumenta el tamaño y visibilidad del cursor o puntero en pantalla',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'cursorGrande debe ser un valor booleano (true o false)',
  })
  cursorGrande?: boolean;

  @ApiPropertyOptional({
    description:
      'Activa una barra o máscara visual de lectura guiada que acompaña el cursor',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'lecturaGuiada debe ser un valor booleano (true o false)',
  })
  lecturaGuiada?: boolean;

  @ApiPropertyOptional({
    description:
      'Filtro de paleta cromática optimizada para diferentes tipos de daltonismo o modo monocromático',
    enum: PaletaColor,
    example: PaletaColor.ESTANDAR,
  })
  @IsOptional()
  @IsEnum(PaletaColor, {
    message: `La paleta de color debe ser una de las siguientes: ${Object.values(PaletaColor).join(', ')}`,
  })
  paletaColor?: PaletaColor;

  @ApiPropertyOptional({
    description:
      'Habilita asistencia de lectura por síntesis de voz (Text-to-Speech) en enunciados y preguntas',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'sintesisVozLectura debe ser un valor booleano (true o false)',
  })
  sintesisVozLectura?: boolean;
}
