import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RespuestaError } from '../interfaces/respuesta-api.interface.js';

@Catch()
export class ExcepcionHttpFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExcepcionHttpFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje = 'Error interno del servidor';
    let codigoError = 'ERROR_INTERNO';
    let detalles: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        mensaje = res;
      } else if (typeof res === 'object' && res !== null) {
        const respuestaObj = res as Record<string, unknown>;
        mensaje =
          (respuestaObj.mensaje as string) ||
          (respuestaObj.message as string) ||
          (respuestaObj.error as string) ||
          mensaje;
        detalles = respuestaObj.message || respuestaObj;
        codigoError =
          (respuestaObj.codigoError as string) ||
          (respuestaObj.error as string) ||
          `HTTP_${status}`;
      }

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        if (!codigoError || codigoError.startsWith('HTTP_')) {
          codigoError = 'LIMITE_PETICIONES_EXCEDIDO';
        }
        if (
          mensaje.toLowerCase().includes('throttler') ||
          mensaje.toLowerCase().includes('too many requests')
        ) {
          mensaje =
            'Ha superado el límite de intentos permitidos. Por motivos de seguridad, espere unos momentos antes de volver a intentar.';
        }
      }
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as any).code === 'P2002'
    ) {
      status = HttpStatus.CONFLICT;
      const target = (exception as any).meta?.target;
      const targetStr = (
        Array.isArray(target) ? target.join(', ') : String(target || '')
      ).toLowerCase();

      if (targetStr.includes('correo')) {
        mensaje =
          'El correo electrónico ya se encuentra registrado en la plataforma. Por favor, utiliza otro correo o inicia sesión.';
        codigoError = 'CORREO_DUPLICADO';
      } else if (
        targetStr.includes('identificacion') ||
        targetStr.includes('cedula')
      ) {
        mensaje =
          'El número de identificación (cédula) ya se encuentra registrado en el sistema.';
        codigoError = 'CEDULA_DUPLICADA';
      } else {
        mensaje =
          'Ya existe un registro con los mismos datos únicos en el sistema.';
        codigoError = 'REGISTRO_DUPLICADO';
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Error no controlado [${request.method} ${request.url}]: ${exception.message}`,
        exception.stack,
      );
    }

    const cuerpoRespuesta: RespuestaError = {
      exito: false,
      codigoError,
      mensaje: Array.isArray(detalles) ? detalles.join(', ') : mensaje,
      detalles: Array.isArray(detalles) ? detalles : undefined,
      timestamp: new Date().toISOString(),
      ruta: request.url,
    };

    response.status(status).json(cuerpoRespuesta);
  }
}
