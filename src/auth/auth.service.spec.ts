import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
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
        findFirst: jest.fn((args) => prisma.usuario.findUnique(args)),
        create: jest.fn(),
        update: jest.fn(),
      },
      rol: {
        findUnique: jest.fn(),
      },
      usuarioRol: {
        create: jest.fn(),
      },
      suscripcionUsuario: {
        create: jest.fn(),
      },
      sesionAutenticacion: {
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
          'auth.jwtRefreshSecret':
            'super_refresh_test_key_32_characters_minimum',
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
      prisma.usuario.findUnique.mockResolvedValue({
        id: '1',
        correo: 'test@caces.ec',
      });

      await expect(
        service.registrar({
          correo: 'test@caces.ec',
          contrasena: 'Password123!',
          nombreCompleto: 'Estudiante Prueba',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe registrar un nuevo estudiante y generar tokens con clave segura', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.rol.findUnique.mockResolvedValue({
        id: 'rol-1',
        nombre: RolNombre.ESTUDIANTE,
      });
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
      expect(prisma.suscripcionUsuario.create).toHaveBeenCalled();
      expect(prisma.sesionAutenticacion.create).toHaveBeenCalled();
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

  describe('completarPerfil', () => {
    it('debe lanzar BadRequestException si la cédula es una secuencia repetitiva incoherente como 2222222222', async () => {
      await expect(
        service.completarPerfil('mi-usuario-id', {
          cedula: '2222222222',
          programaActivoId: 'prog-medicina',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si la cédula pertenece a otro usuario', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'otro-usuario-id',
        cedula: '1710034065',
      });

      let error: any;
      try {
        await service.completarPerfil('mi-usuario-id', {
          cedula: '1710034065',
          programaActivoId: 'prog-medicina',
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toContain('cédula');
    });

    it('debe actualizar cédula y carrera correctamente con cédula válida', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.update.mockResolvedValue({
        id: 'mi-usuario-id',
        cedula: '1710034065',
        nombre: 'Carlos',
        apellido: 'Morales',
        nombreCompleto: 'Carlos Morales',
        correo: 'carlos@gmail.com',
        rol: 'estudiante',
        programaActivoId: 'prog-medicina',
        creadoEn: new Date('2026-10-24T05:00:00.000Z'),
        roles: [{ rol: { nombre: RolNombre.ESTUDIANTE } }],
      });

      const resultado = await service.completarPerfil('mi-usuario-id', {
        cedula: '1710034065',
        programaActivoId: 'prog-medicina',
      });

      expect(resultado.cedula).toBe('1710034065');
      expect(resultado.programaActivoId).toBe('prog-medicina');
      expect(resultado.usuario.cedula).toBe('1710034065');
      expect(resultado).toHaveProperty('tokenAcceso');
    });
  });

  describe('validaciones de coherencia y seguridad en registro', () => {
    it('debe rechazar registro con cédula repetitiva como 2222222222', async () => {
      await expect(
        service.registrar({
          correo: 'test@caces.ec',
          clave: 'Password123!',
          cedula: '2222222222',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar registro con nombre que solo contiene puntos ...', async () => {
      await expect(
        service.registrar({
          correo: 'test2@caces.ec',
          clave: 'Password123!',
          cedula: '1710034065',
          nombre: '...',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar registro con contraseña compuesta únicamente por puntos ....... o ........', async () => {
      await expect(
        service.registrar({
          correo: 'test3@caces.ec',
          clave: '.......',
          cedula: '1710034065',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.registrar({
          correo: 'test3b@caces.ec',
          clave: '........',
          cedula: '1710034065',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar registro con contraseña de asteriscos *******', async () => {
      await expect(
        service.registrar({
          correo: 'testasterisco@caces.ec',
          clave: '********',
          cedula: '1710034065',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar registro con contraseña de caracteres repetidos como aaaaaaaa o 11111111', async () => {
      await expect(
        service.registrar({
          correo: 'test4@caces.ec',
          clave: 'aaaaaaaa',
          cedula: '1710034065',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.registrar({
          correo: 'test4b@caces.ec',
          clave: '11111111',
          cedula: '1710034065',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar registro si la contraseña no incluye letras (ej. solo números 12345678)', async () => {
      await expect(
        service.registrar({
          correo: 'test5@caces.ec',
          clave: '12345678',
          cedula: '1710034065',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar registro si la contraseña no incluye números (ej. solo letras abcdefgh)', async () => {
      await expect(
        service.registrar({
          correo: 'test6@caces.ec',
          clave: 'abcdefgh',
          cedula: '1710034065',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar registro si la contraseña tiene menos de 8 caracteres', async () => {
      await expect(
        service.registrar({
          correo: 'test7@caces.ec',
          clave: 'Clav1',
          cedula: '1710034065',
          nombre: 'Carlos',
          apellido: 'Morales',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
