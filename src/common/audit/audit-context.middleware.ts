import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditContextService } from './audit-context.service.js';
import { TipoActor } from './audit-context.interface.js';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  constructor(private readonly auditContextService: AuditContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    // Normalizar IP IPv6 mapeada a IPv4 (::ffff:127.0.0.1 -> 127.0.0.1)
    const ipOrigen = rawIp.replace(/^.*:/, '') || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Desconocido / API Client';

    // Determinar módulo tentativo a partir de la ruta
    const url = req.originalUrl || req.url || '';
    const parts = url.split('/').filter(Boolean);
    // ej: /api/v1/admin/... -> 'admin', /api/v1/auth/... -> 'auth'
    const modulo = parts[2]?.toUpperCase() || parts[1]?.toUpperCase() || 'GENERAL';

    // Intentar decodificar JWT sin validar firma (la validación real la hace JwtAuthGuard)
    let usuarioId: string | null = null;
    let correo: string | null = null;
    let roles: string[] = [];
    let tipoActor: TipoActor = 'SISTEMA';

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload && payload.sub) {
            usuarioId = payload.sub;
            correo = payload.correo || null;
            roles = payload.roles || [];
            tipoActor = 'USUARIO';
          }
        }
      } catch {
        // Token malformado o proceso no autenticado
      }
    }

    this.auditContextService.runWithContext(
      {
        usuarioId,
        correo,
        roles,
        tipoActor,
        ipOrigen,
        userAgent,
        modulo,
        fechaOperacion: new Date(),
      },
      () => next(),
    );
  }
}

