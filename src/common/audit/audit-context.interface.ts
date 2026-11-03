export type TipoActor = 'USUARIO' | 'SISTEMA' | 'PROCESO_AUTOMATICO';

export interface AuditContext {
  usuarioId: string | null;
  correo?: string | null;
  roles?: string[];
  tipoActor: TipoActor;
  ipOrigen: string;
  userAgent: string;
  modulo?: string;
  fechaOperacion: Date;
}

