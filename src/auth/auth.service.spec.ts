import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { RolNombre } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      rol: {
        findUnique: jest.fn(),
      },
      usuarioRol: {
        create: jest.fn(),
      },
      pruebaGratuita: {
        create: jest.fn(),
      },
      sesionToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'auth.jwtSecret': 'super_secret_test_key_32_characters_minimum',
          'auth.jwtExpiresIn': '1d',
          'auth.jwtRefreshSecret': 'super_refresh_test_key_32_characters_minimum',
          'auth.jwtRefreshExpiresIn': '7d',
        };
        return config[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('registrar', () => {
    it('debe lanzar ConflictException si el correo ya existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: '1', correo: 'test@caces.ec' });

      await expect(
        service.registrar({
          correo: 'test@caces.ec',
          contrasena: 'Password123!',
          nombreCompleto: 'Estudiante Prueba',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe registrar un nuevo estudiante y generar tokens', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.rol.findUnique.mockResolvedValue({ id: 'rol-1', nombre: RolNombre.ESTUDIANTE });
      prisma.usuario.create.mockResolvedValue({
        id: 'usr-123',
        correo: 'nuevo@caces.ec',
        nombreCompleto: 'Nuevo Estudiante',
      });

      const resultado = await service.registrar({
        correo: 'nuevo@caces.ec',
        contrasena: 'Password123!',
        nombreCompleto: 'Nuevo Estudiante',
      });

      expect(resultado).toHaveProperty('tokens');
      expect(resultado.usuario.correo).toBe('nuevo@caces.ec');
      expect(prisma.pruebaGratuita.create).toHaveBeenCalled();
      expect(prisma.sesionToken.create).toHaveBeenCalled();
    });
  });

  describe('iniciarSesion', () => {
    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.iniciarSesion({
          correo: 'noexiste@caces.ec',
          contrasena: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contraseña no coincide', async () => {
      const hash = await bcrypt.hash('Correcta123!', 10);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'usr-1',
        correo: 'estudiante@caces.ec',
        contrasenaHash: hash,
        activo: true,
        roles: [{ rol: { nombre: RolNombre.ESTUDIANTE } }],
      });

      await expect(
        service.iniciarSesion({
          correo: 'estudiante@caces.ec',
          contrasena: 'Incorrecta123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe autenticar con éxito si las credenciales son correctas', async () => {
      const password = 'PasswordSegura2026!';
      const hash = await bcrypt.hash(password, 10);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'usr-1',
        correo: 'estudiante@caces.ec',
        nombreCompleto: 'Estudiante Caces',
        contrasenaHash: hash,
        activo: true,
        roles: [{ rol: { nombre: RolNombre.ESTUDIANTE } }],
      });

      const resultado = await service.iniciarSesion({
        correo: 'estudiante@caces.ec',
        contrasena: password,
      });

      expect(resultado).toHaveProperty('tokens');
      expect(resultado.usuario.id).toBe('usr-1');
      expect(resultado.usuario.roles).toContain(RolNombre.ESTUDIANTE);
    });
  });
});
