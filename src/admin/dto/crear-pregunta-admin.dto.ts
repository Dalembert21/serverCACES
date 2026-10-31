import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';

export class OpcionPreguntaAdminDto {
  @ApiProperty({ example: 'A' })
  @IsString({ message: 'La letra de la opción debe ser texto' })
  @IsNotEmpty({ message: 'La letra es obligatoria' })
  @Matches(/^[A-Z]$/, { message: 'La letra debe ser una mayúscula única (A, B, C, D...)' })
  letra: string;

  @ApiProperty({ example: 'Iniciar inmediatamente oxigenoterapia y diurético' })
  @IsString({ message: 'El texto de la opción debe ser una cadena' })
  @IsNotEmpty({ message: 'El texto de la opción es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(2, {
    message: 'El texto de la opción debe contener palabras reales (sin solo puntos o símbolos)',
  })
  texto: string;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'esCorrecta debe ser booleano' })
  esCorrecta: boolean;

  @ApiProperty({ example: 'Disminuye la precarga cardíaca de forma prioritaria' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(3, {
    message: 'La justificación debe contener texto comprensible',
  })
  justificacion?: string;
}

export class CrearPreguntaAdminDto {
  @ApiProperty({
    example: 'uuid-submodulo-cardiologia',
    description: 'Identificador del submódulo académico al que pertenece la pregunta',
    required: true,
  })
  @IsString({ message: 'El identificador del submódulo debe ser texto' })
  @IsNotEmpty({ message: 'El submódulo académico es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  submoduloId: string;

  @ApiProperty({
    example: 'MED-INT-01',
    description: 'Código de subárea/competencia oficial (opcional para trazabilidad CACES)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El código de subárea debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(/^[a-zA-Z0-9\-_]{2,30}$/, {
    message: 'El código de subárea debe ser alfanumérico sin espacios ni símbolos especiales',
  })
  codigoSubarea?: string;

  @ApiProperty({ example: 'Paciente masculino de 65 años...' })
  @IsString({ message: 'El enunciado debe ser texto' })
  @IsNotEmpty({ message: 'El enunciado es obligatorio' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(10, {
    message: 'El enunciado de la pregunta debe contener al menos 10 caracteres de texto real coherente',
  })
  enunciado: string;

  @ApiProperty({ example: 'Explicación del cuadro clínico y manejo oficial' })
  @IsString({ message: 'La explicación pedagógica debe ser texto' })
  @IsNotEmpty({ message: 'La explicación pedagógica es obligatoria' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(10, {
    message: 'La explicación pedagógica debe contener texto explicativo coherente (mínimo 10 caracteres)',
  })
  explicacionPedagogica: string;

  @ApiProperty({ example: 'MEDIA', enum: ['BAJA', 'MEDIA', 'ALTA'] })
  @IsOptional()
  @IsEnum(['BAJA', 'MEDIA', 'ALTA'], {
    message: 'La dificultad debe ser BAJA, MEDIA o ALTA',
  })
  dificultad?: 'BAJA' | 'MEDIA' | 'ALTA';

  @ApiProperty({ type: [OpcionPreguntaAdminDto] })
  @IsArray({ message: 'Las opciones deben ser un arreglo' })
  @ArrayMinSize(2, { message: 'Se deben proporcionar al menos 2 opciones de respuesta' })
  @ValidateNested({ each: true })
  @Type(() => OpcionPreguntaAdminDto)
  opciones: OpcionPreguntaAdminDto[];

  @ApiProperty({ example: 'Guías de Práctica Clínica MSP Ecuador 2024' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(4, {
    message: 'La referencia oficial debe ser una cita bibliográfica coherente',
  })
  referenciaOficial?: string;

  @ApiProperty({
    example: 'https://ejemplo.com/imagenes/ecg-01.png',
    description: 'URL de imagen clínica (ECG, Radiografía, etc.) si la pregunta la requiere',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser texto' })
  imagenUrl?: string;

  @ApiProperty({
    example: 'Electrocardiograma de 12 derivaciones con elevación del segmento ST',
    description: 'Descripción accesible de la imagen',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La descripción de la imagen debe ser texto' })
  descripcionImagen?: string;

  @ApiProperty({
    example: 'IMAGEN_ECG',
    enum: ['IMAGEN_RX', 'IMAGEN_ECG', 'TOMOGRAFIA', 'FOTOGRAFIA_CLINICA', 'OTRO'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['IMAGEN_RX', 'IMAGEN_ECG', 'TOMOGRAFIA', 'FOTOGRAFIA_CLINICA', 'OTRO'])
  tipoMultimedia?: 'IMAGEN_RX' | 'IMAGEN_ECG' | 'TOMOGRAFIA' | 'FOTOGRAFIA_CLINICA' | 'OTRO';
}

