import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditContextService } from './audit-context.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditContextService: AuditContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();

    if (req) {
      const user = req.user;
      const controllerClass = context.getClass().name;
      const handlerName = context.getHandler().name;
      const modulo = controllerClass.replace('Controller', '').toUpperCase();

      if (user && user.id) {
        this.auditContextService.setContext({
          usuarioId: user.id,
          correo: user.correo,
          roles: user.roles,
          tipoActor: 'USUARIO',
          modulo: modulo || 'GENERAL',
        });
      } else {
        this.auditContextService.setContext({
          modulo: modulo || 'GENERAL',
        });
      }
    }

    return next.handle();
  }
}

