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
          (respuestaObj.message as string) ||
          (respuestaObj.error as string) ||
          mensaje;
        detalles = respuestaObj.message || respuestaObj;
        codigoError = (respuestaObj.error as string) || `HTTP_${status}`;
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
