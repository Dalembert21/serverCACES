export interface RespuestaExitosa<T> {
  exito: true;
  mensaje: string;
  datos: T;
  meta?: Record<string, unknown>;
}

export interface RespuestaError {
  exito: false;
  codigoError: string;
  mensaje: string;
  detalles?: unknown;
  timestamp: string;
  ruta: string;
}
