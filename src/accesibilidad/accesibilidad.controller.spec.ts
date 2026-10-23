import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EspaciadoTexto, PaletaColor, TamanoTexto } from '@prisma/client';
import { UsuarioAutenticado } from '../common/interfaces/usuario-autenticado.interface.js';
import { AccesibilidadController } from './accesibilidad.controller.js';
import { AccesibilidadService } from './accesibilidad.service.js';
import { ActualizarPreferenciaAccesibilidadDto } from './dto/index.js';

describe('AccesibilidadController', () => {
  let controller: AccesibilidadController;
  let service: any;

  const mockUsuario: UsuarioAutenticado = {
    id: 'user-auth-uuid-999',
    correo: 'estudiante.inclusion@caces.ec',
    roles: ['ESTUDIANTE'],
  };

  const mockPreferencia = {
    id: 'pref-uuid-111',
    usuarioId: mockUsuario.id,
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
    service = {
      obtenerPreferencias: jest.fn().mockResolvedValue(mockPreferencia),
      actualizarPreferencias: jest.fn().mockResolvedValue({
        ...mockPreferencia,
        tamanoTexto: TamanoTexto.EXTRA_GRANDE,
        altoContraste: true,
      }),
      restablecerPreferencias: jest.fn().mockResolvedValue(mockPreferencia),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccesibilidadController],
      providers: [
        {
          provide: AccesibilidadService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AccesibilidadController>(AccesibilidadController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /accesibilidad (obtenerPreferencias)', () => {
    it('debe obtener las preferencias utilizando el id del usuario autenticado en JWT', async () => {
      const respuesta = await controller.obtenerPreferencias(mockUsuario);

      expect(service.obtenerPreferencias).toHaveBeenCalledWith(mockUsuario.id);
      expect(respuesta).toEqual({
        mensaje: 'Preferencias de accesibilidad obtenidas correctamente',
        datos: mockPreferencia,
      });
    });
  });

  describe('PATCH /accesibilidad (actualizarPreferencias)', () => {
    it('debe actualizar parcialmente las preferencias del usuario autenticado', async () => {
      const dto: ActualizarPreferenciaAccesibilidadDto = {
        tamanoTexto: TamanoTexto.EXTRA_GRANDE,
        altoContraste: true,
      };

      const respuesta = await controller.actualizarPreferencias(
        mockUsuario,
        dto,
      );

      expect(service.actualizarPreferencias).toHaveBeenCalledWith(
        mockUsuario.id,
        dto,
      );
      expect(respuesta.datos.tamanoTexto).toBe(TamanoTexto.EXTRA_GRANDE);
      expect(respuesta.datos.altoContraste).toBe(true);
      expect(respuesta.mensaje).toBe(
        'Preferencias de accesibilidad actualizadas correctamente',
      );
    });
  });

  describe('PUT /accesibilidad (guardarPreferencias)', () => {
    it('debe guardar las preferencias idempotentemente con el usuario autenticado', async () => {
      const dto: ActualizarPreferenciaAccesibilidadDto = {
        tamanoTexto: TamanoTexto.EXTRA_GRANDE,
        altoContraste: true,
      };

      const respuesta = await controller.guardarPreferencias(mockUsuario, dto);

      expect(service.actualizarPreferencias).toHaveBeenCalledWith(
        mockUsuario.id,
        dto,
      );
      expect(respuesta.datos.tamanoTexto).toBe(TamanoTexto.EXTRA_GRANDE);
      expect(respuesta.mensaje).toBe(
        'Preferencias de accesibilidad actualizadas correctamente',
      );
    });
  });

  describe('POST /accesibilidad/restablecer (restablecerPreferencias)', () => {
    it('debe restablecer a los valores predeterminados para el usuario autenticado', async () => {
      const respuesta = await controller.restablecerPreferencias(mockUsuario);

      expect(service.restablecerPreferencias).toHaveBeenCalledWith(
        mockUsuario.id,
      );
      expect(respuesta).toEqual({
        mensaje:
          'Preferencias de accesibilidad restablecidas a los valores por defecto',
        datos: mockPreferencia,
      });
    });
  });

  describe('Validación de DTO (ValidationPipe con whitelist y forbidNonWhitelisted)', () => {
    let targetPipe: ValidationPipe;
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: ActualizarPreferenciaAccesibilidadDto,
      data: '',
    };

    beforeEach(() => {
      targetPipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
    });

    it('debe aceptar propiedades válidas de accesibilidad', async () => {
      const cuerpoValido = {
        tamanoTexto: 'GRANDE',
        altoContraste: true,
        fuenteDislexia: true,
        espaciadoTexto: 'AMPLIO',
        movimientoReducido: true,
        subtitulosActivados: true,
        cursorGrande: true,
        lecturaGuiada: true,
        paletaColor: 'DEUTERANOPIA',
        sintesisVozLectura: true,
      };

      const resultado = await targetPipe.transform(cuerpoValido, metadata);
      expect(resultado.tamanoTexto).toBe(TamanoTexto.GRANDE);
      expect(resultado.altoContraste).toBe(true);
      expect(resultado.fuenteDislexia).toBe(true);
      expect(resultado.espaciadoTexto).toBe(EspaciadoTexto.AMPLIO);
      expect(resultado.paletaColor).toBe(PaletaColor.DEUTERANOPIA);
    });

    it('debe rechazar propiedades no permitidas para evitar inyecciones o alteración de IDs', async () => {
      const cuerpoConCamposProhibidos = {
        altoContraste: true,
        usuarioId: 'otro-usuario-malicioso', // Intento de spoofing de ID
        rol: 'ADMIN',
        esCorrecta: true,
      };

      await expect(
        targetPipe.transform(cuerpoConCamposProhibidos, metadata),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar valores inválidos para enums (ej. tamañoTexto no soportado)', async () => {
      const cuerpoConEnumInvalido = {
        tamanoTexto: 'GIGANTE_INVENTADO',
      };

      await expect(
        targetPipe.transform(cuerpoConEnumInvalido, metadata),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar tipos no booleanos en campos booleanos (ej. número en altoContraste)', async () => {
      const cuerpoConTipoInvalido = {
        altoContraste: 'no_es_un_booleano',
      };

      await expect(
        targetPipe.transform(cuerpoConTipoInvalido, metadata),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
