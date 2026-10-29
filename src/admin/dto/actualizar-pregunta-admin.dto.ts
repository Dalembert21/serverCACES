import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EsTextoCoherente } from '../../common/index.js';
import { OpcionPreguntaAdminDto } from './crear-pregunta-admin.dto.js';
import { EstadoPregunta } from '@prisma/client';

export class ActualizarPreguntaAdminDto {
  @ApiProperty({ example: 'MED-INT-01', required: false })
  @IsOptional()
  @IsString({ message: 'El código de subárea debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  codigoSubarea?: string;

  @ApiProperty({ example: 'Paciente femenino de 45 años...', required: false })
  @IsOptional()
  @IsString({ message: 'El enunciado debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(10, {
    message: 'El enunciado debe contener al menos 10 caracteres coherentes',
  })
  enunciado?: string;

  @ApiProperty({ example: 'Justificación médica actualizada...', required: false })
  @IsOptional()
  @IsString({ message: 'La explicación pedagógica debe ser texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @EsTextoCoherente(10, {
    message: 'La explicación pedagógica debe contener texto explicativo coherente',
  })
  explicacionPedagogica?: string;

  @ApiProperty({ example: 'MEDIA', enum: ['BAJA', 'MEDIA', 'ALTA'], required: false })
  @IsOptional()
  @IsEnum(['BAJA', 'MEDIA', 'ALTA'], {
    message: 'La dificultad debe ser BAJA, MEDIA o ALTA',
  })
  dificultad?: 'BAJA' | 'MEDIA' | 'ALTA';

  @ApiProperty({
    example: EstadoPregunta.APROBADA,
    enum: EstadoPregunta,
    required: false,
  })
  @IsOptional()
  @IsEnum(EstadoPregunta, {
    message: 'Estado de revisión inválido',
  })
  estado?: EstadoPregunta;

  @ApiProperty({ type: [OpcionPreguntaAdminDto], required: false })
  @IsOptional()
  @IsArray({ message: 'Las opciones deben ser un arreglo' })
  @ArrayMinSize(2, { message: 'Se deben proporcionar al menos 2 opciones de respuesta' })
  @ValidateNested({ each: true })
  @Type(() => OpcionPreguntaAdminDto)
  opciones?: OpcionPreguntaAdminDto[];

  @ApiProperty({ example: 'Guías de Práctica Clínica MSP Ecuador 2024', required: false })
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
