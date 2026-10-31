import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service.js';
import { PrismaService } from '../database/prisma.service.js';

describe('AdminService - Gestión de Submódulos Académicos y Preguntas', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrismaService = {
    submoduloAcademico: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    programaAcademico: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    pregunta: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    preguntaVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
    preguntaOpcion: {
      create: jest.fn(),
    },
    preguntaReferencia: {
      create: jest.fn(),
    },
    subareaCompetencia: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('crearSubmodulo', () => {
    it('debe crear un submódulo correctamente cuando el módulo existe y el nombre no está duplicado', async () => {
      mockPrismaService.programaAcademico.findFirst.mockResolvedValue({
        id: 'MEDICINA',
        nombre: 'Medicina Humana',
      });
      mockPrismaService.submoduloAcademico.findFirst.mockResolvedValue(null);
      mockPrismaService.submoduloAcademico.create.mockResolvedValue({
        id: 'sub-1',
        programaAcademicoId: 'MEDICINA',
        nombre: 'Cardiología',
        descripcion: 'Enfermedades cardíacas',
        orden: 1,
        activo: true,
        creadoEn: new Date(),
        programa: { nombre: 'Medicina Humana' },
      });

      const resultado = await service.crearSubmodulo({
        programaAcademicoId: 'MEDICINA',
        nombre: '   Cardiología   ',
        descripcion: 'Enfermedades cardíacas',
        orden: 1,
      });

      expect(resultado.mensaje).toContain('creado exitosamente');
      expect(resultado.submodulo.nombre).toBe('Cardiología');
      expect(mockPrismaService.submoduloAcademico.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          programaAcademicoId: 'MEDICINA',
          nombre: 'Cardiología',
        }),
        include: { programa: true },
      });
    });

    it('debe rechazar la creación si el módulo académico no existe', async () => {
      mockPrismaService.programaAcademico.findFirst.mockResolvedValue(null);

      await expect(
        service.crearSubmodulo({
          programaAcademicoId: 'INEXISTENTE',
          nombre: 'Cardiología',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar la creación si ya existe un submódulo con el mismo nombre en ese módulo', async () => {
      mockPrismaService.programaAcademico.findFirst.mockResolvedValue({
        id: 'MEDICINA',
        nombre: 'Medicina Humana',
      });
      mockPrismaService.submoduloAcademico.findFirst.mockResolvedValue({
        id: 'sub-existente',
        nombre: 'Cardiología',
      });

      await expect(
        service.crearSubmodulo({
          programaAcademicoId: 'MEDICINA',
          nombre: 'cardiología',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('eliminarSubmodulo', () => {
    it('debe rechazar la eliminación física si el submódulo tiene preguntas asociadas', async () => {
      mockPrismaService.submoduloAcademico.findUnique.mockResolvedValue({
        id: 'sub-1',
        nombre: 'Cardiología',
        _count: { preguntas: 15 },
      });

      await expect(service.eliminarSubmodulo('sub-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.submoduloAcademico.delete).not.toHaveBeenCalled();
    });

    it('debe permitir la eliminación física si tiene 0 preguntas', async () => {
      mockPrismaService.submoduloAcademico.findUnique.mockResolvedValue({
        id: 'sub-1',
        nombre: 'Cardiología',
        _count: { preguntas: 0 },
      });
      mockPrismaService.submoduloAcademico.delete.mockResolvedValue({
        id: 'sub-1',
      });

      const res = await service.eliminarSubmodulo('sub-1');
      expect(res.mensaje).toContain('eliminado exitosamente');
      expect(mockPrismaService.submoduloAcademico.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
    });
  });

  describe('crearPregunta con Submódulo', () => {
    it('debe rechazar la pregunta si el submódulo académico está inactivo', async () => {
      mockPrismaService.submoduloAcademico.findUnique.mockResolvedValue({
        id: 'sub-inactivo',
        nombre: 'Cardiología Antigua',
        activo: false,
        programa: { nombre: 'Medicina Humana' },
      });

      await expect(
        service.crearPregunta(
          {
            submoduloId: 'sub-inactivo',
            enunciado: 'Paciente con dolor torácico opresivo de 3 horas de evolución',
            explicacionPedagogica: 'Se sospecha síndrome coronario agudo con elevación de ST',
            opciones: [
              { letra: 'A', texto: 'Aspirina y derivar', esCorrecta: true },
              { letra: 'B', texto: 'Alta a domicilio', esCorrecta: false },
            ],
          },
          'admin-user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear la pregunta correctamente vinculada al submódulo activo', async () => {
      mockPrismaService.submoduloAcademico.findUnique.mockResolvedValue({
        id: 'sub-activo',
        nombre: 'Cardiología',
        programaAcademicoId: 'MEDICINA',
        activo: true,
        programa: { nombre: 'Medicina Humana' },
      });

      mockPrismaService.pregunta.create.mockResolvedValue({
        id: 'preg-1',
        submoduloId: 'sub-activo',
        codigoPublico: 'PREG-MED-CARD-1234ABCD',
      });

      mockPrismaService.preguntaVersion.create.mockResolvedValue({
        id: 'ver-1',
        preguntaId: 'preg-1',
      });

      const res = await service.crearPregunta(
        {
          submoduloId: 'sub-activo',
          enunciado: 'Paciente con dolor precordial de reposo',
          explicacionPedagogica: 'Explicación del cuadro coronario',
          opciones: [
            { letra: 'A', texto: 'Opción A correcta', esCorrecta: true },
            { letra: 'B', texto: 'Opción B incorrecta', esCorrecta: false },
          ],
        },
        'admin-user-id',
      );

      expect(res.preguntaId).toBe('preg-1');
      expect(mockPrismaService.pregunta.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          submoduloId: 'sub-activo',
        }),
      });
    });
  });
});

