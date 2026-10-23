/**
 * Interfaz agnóstica para servicios de almacenamiento de archivos y activos multimedia.
 * Garantiza total portabilidad: permite alternar o migrar entre proveedores
 * (Supabase Storage, S3, Cloudflare R2, MinIO, o almacenamiento local en VPS)
 * sin modificar la capa de negocio ni las entidades de la base de datos.
 */
export interface ArchivoSubido {
  buffer: Buffer;
  nombreOriginal: string;
  mimetype: string;
  tamanoBytes: number;
}

export interface ResultadoAlmacenamiento {
  identificador: string;
  urlPublica: string;
  rutaRelativa: string;
}

export interface IServicioAlmacenamiento {
  subirArchivo(
    archivo: ArchivoSubido,
    carpetaDestino: string,
  ): Promise<ResultadoAlmacenamiento>;

  obtenerUrl(identificadorORuta: string): Promise<string>;

  eliminarArchivo(identificadorORuta: string): Promise<boolean>;
}
