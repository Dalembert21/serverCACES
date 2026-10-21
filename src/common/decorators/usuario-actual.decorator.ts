import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface.js';

export const UsuarioActual = createParamDecorator(
  (data: keyof UsuarioAutenticado | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const usuario: UsuarioAutenticado = request.user;

    if (!usuario) {
      return null;
    }

    return data ? usuario[data] : usuario;
  },
);
