import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RespuestaExitosa } from '../interfaces/respuesta-api.interface.js';

@Injectable()
export class TransformarRespuestaInterceptor<T>
  implements NestInterceptor<T, RespuestaExitosa<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<RespuestaExitosa<T>> {
    return next.handle().pipe(
      map((respuesta) => {
        // Si el controlador ya devolvió una estructura con mensaje o meta
        if (
          respuesta &&
          typeof respuesta === 'object' &&
          'datos' in respuesta &&
          'mensaje' in respuesta
        ) {
          return {
            exito: true,
            mensaje: respuesta.mensaje,
            datos: respuesta.datos,
            meta: respuesta.meta,
          };
        }

        return {
          exito: true,
          mensaje: 'Operación realizada correctamente',
          datos: respuesta,
        };
      }),
    );
  }
}
