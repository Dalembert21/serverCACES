import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { AuditContext, TipoActor } from './audit-context.interface.js';

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditContext>();

  /**
   * Obtiene el contexto de auditoría actual o un contexto por defecto del sistema
   */
  getContext(): AuditContext {
    const store = this.storage.getStore();
    if (store) {
      return store;
    }

    return {
      usuarioId: null,
      correo: null,
      roles: [],
      tipoActor: 'SISTEMA',
      ipOrigen: '127.0.0.1',
      userAgent: 'Sistema Backend CACES (Proceso Interno)',
      modulo: 'SISTEMA',
      fechaOperacion: new Date(),
    };
  }

  /**
   * Actualiza propiedades del contexto actual si existe
   */
  setContext(partial: Partial<AuditContext>): void {
    const store = this.storage.getStore();
    if (store) {
      Object.assign(store, partial);
    }
  }

  /**
   * Ejecuta una función síncrona o asíncrona dentro de un contexto de auditoría específico
   */
  runWithContext<T>(
    context: Partial<AuditContext>,
    callback: () => T | Promise<T>,
  ): Promise<T> {
    const fullContext: AuditContext = {
      usuarioId: context.usuarioId ?? null,
      correo: context.correo ?? null,
      roles: context.roles ?? [],
      tipoActor: (context.tipoActor as TipoActor) || (context.usuarioId ? 'USUARIO' : 'SISTEMA'),
      ipOrigen: context.ipOrigen || '127.0.0.1',
      userAgent: context.userAgent || 'Sistema Backend CACES',
      modulo: context.modulo || 'SISTEMA',
      fechaOperacion: context.fechaOperacion || new Date(),
    };

    return this.storage.run(fullContext, () => Promise.resolve(callback()));
  }
}

