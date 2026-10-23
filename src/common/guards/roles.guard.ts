import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_CLAVE } from '../decorators/roles.decorator.js';
import { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_CLAVE,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario: UsuarioAutenticado = request.user;

    if (!usuario || !usuario.roles) {
      throw new ForbiddenException(
        'Acceso denegado: no se encontraron roles asignados al usuario',
      );
    }

    const tieneRol = rolesRequeridos.some((rol) => usuario.roles.includes(rol));

    if (!tieneRol) {
      throw new ForbiddenException(
        `Acceso denegado: se requiere uno de los siguientes roles [${rolesRequeridos.join(', ')}]`,
      );
    }

    return true;
  }
}
