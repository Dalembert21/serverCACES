import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service.js';
import { UsuarioAutenticado } from '../../common/interfaces/usuario-autenticado.interface.js';

interface JwtPayload {
  sub: string;
  correo: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('auth.jwtSecret');
    if (!secret) {
      throw new Error('auth.jwtSecret no está configurado');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UsuarioAutenticado> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, correo: true, activo: true },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException(
        'El usuario no existe o se encuentra desactivado',
      );
    }

    return {
      id: payload.sub,
      correo: payload.correo,
      roles: payload.roles,
    };
  }
}
