import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EspaciadoTexto, PaletaColor, TamanoTexto } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import {
  AccesibilidadService,
  PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO,
} from './accesibilidad.service.js';

describe('AccesibilidadService', () => {
  let service: AccesibilidadService;
  let prisma: any;

  const mockUsuarioId = 'usuario-uuid-123';
  const mockUsuario = {
    id: mockUsuarioId,
    correo: 'estudiante@caces.ec',
    activo: true,
  };

  const mockPreferencia = {
    id: 'pref-uuid-456',
    usuarioId: mockUsuarioId,
    tamanoTexto: TamanoTexto.NORMAL,
    altoContraste: false,
    fuenteDislexia: false,
    espaciadoTexto: EspaciadoTexto.NORMAL,
    movimientoReducido: false,
    subtitulosActivados: false,
    cursorGrande: false,
    lecturaGuiada: false,
    paletaColor: PaletaColor.ESTANDAR,
    sintesisVozLectura: false,
    creadoEn: new Date('2026-10-20T10:00:00Z'),
    actualizadoEn: new Date('2026-10-20T10:00:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
      },
      preferenciaAccesibilidad: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccesibilidadService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AccesibilidadService>(AccesibilidadService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('obtenerPreferencias', () => {
    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.obtenerPreferencias('usuario-inexistente'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 'usuario-inexistente' },
        select: { id: true, activo: true },
      });
    });

    it('debe devolver las preferencias existentes si ya están registradas', async () => {
      prisma.usuario.findUnique.mockResolvedValue(mockUsuario);
      prisma.preferenciaAccesibilidad.findUnique.mockResolvedValue(
        mockPreferencia,
      );

      const resultado = await service.obtenerPreferencias(mockUsuarioId);

      expect(resultado).toEqual(mockPreferencia);
      expect(
        prisma.preferenciaAccesibilidad.findUnique,
      ).toHaveBeenCalledWith({
        where: { usuarioId: mockUsuarioId },
      });
      expect(
        prisma.preferenciaAccesibilidad.create,
      ).not.toHaveBeenCalled();
    });

    it('debe inicializar y devolver preferencias por defecto si el usuario no tiene registradas', async () => {
      prisma.usuario.findUnique.mockResolvedValue(mockUsuario);
      prisma.preferenciaAccesibilidad.findUnique.mockResolvedValue(null);
      prisma.preferenciaAccesibilidad.create.mockResolvedValue(mockPreferencia);

      const resultado = await service.obtenerPreferencias(mockUsuarioId);

      expect(resultado).toEqual(mockPreferencia);
      expect(prisma.preferenciaAccesibilidad.create).toHaveBeenCalledWith({
        data: {
          usuarioId: mockUsuarioId,
          ...PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO,
        },
      });
    });
  });

  describe('actualizarPreferencias', () => {
    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.actualizarPreferencias('usuario-inexistente', {
          altoContraste: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe actualizar preferencias mediante upsert con los valores enviados', async () => {
      prisma.usuario.findUnique.mockResolvedValue(mockUsuario);
      const dto = {
        tamanoTexto: TamanoTexto.GRANDE,
        altoContraste: true,
        movimientoReducido: true,
        paletaColor: PaletaColor.DEUTERANOPIA,
      };

      const mockActualizado = {
        ...mockPreferencia,
        ...dto,
      };
      prisma.preferenciaAccesibilidad.upsert.mockResolvedValue(
        mockActualizado,
      );

      const resultado = await service.actualizarPreferencias(
        mockUsuarioId,
        dto,
      );

      expect(resultado.tamanoTexto).toBe(TamanoTexto.GRANDE);
      expect(resultado.altoContraste).toBe(true);
      expect(resultado.movimientoReducido).toBe(true);
      expect(resultado.paletaColor).toBe(PaletaColor.DEUTERANOPIA);
      expect(prisma.preferenciaAccesibilidad.upsert).toHaveBeenCalledWith({
        where: { usuarioId: mockUsuarioId },
        update: { ...dto },
        create: {
          usuarioId: mockUsuarioId,
          ...PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO,
          ...dto,
        },
      });
    });
  });

  describe('restablecerPreferencias', () => {
    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.restablecerPreferencias('usuario-inexistente'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe restablecer todas las preferencias a los valores por defecto', async () => {
      prisma.usuario.findUnique.mockResolvedValue(mockUsuario);
      prisma.preferenciaAccesibilidad.upsert.mockResolvedValue(
        mockPreferencia,
      );

      const resultado = await service.restablecerPreferencias(mockUsuarioId);

      expect(resultado).toEqual(mockPreferencia);
      expect(prisma.preferenciaAccesibilidad.upsert).toHaveBeenCalledWith({
        where: { usuarioId: mockUsuarioId },
        update: { ...PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO },
        create: {
          usuarioId: mockUsuarioId,
          ...PREFERENCIAS_ACCESIBILIDAD_POR_DEFECTO,
        },
      });
    });
  });
});
