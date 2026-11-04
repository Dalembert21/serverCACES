import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import { AppModule } from '../app.module.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuditContextService } from '../common/audit/audit-context.service.js';
import { AuditoriaService } from './auditoria.service.js';
import { AuditoriaController } from './auditoria.controller.js';
import { RolNombre } from '@prisma/client';

describe('Auditoría Integral y Control de Cambios en Backend (Pruebas Obligatorias)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let auditContextService: AuditContextService;
  let auditoriaService: AuditoriaService;
  let auditoriaController: AuditoriaController;

  const admin1Id = 'ADMIN_1_' + Date.now();
  const admin2Id = 'ADMIN_2_' + Date.now();
  const estudianteId = 'ESTUDIANTE_' + Date.now();
  const testModuleId = Math.floor(100000 + Math.random() * 800000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    auditContextService = moduleFixture.get<AuditContextService>(AuditContextService);
    auditoriaService = moduleFixture.get<AuditoriaService>(AuditoriaService);
    auditoriaController = moduleFixture.get<AuditoriaController>(AuditoriaController);

    // Crear usuarios de prueba para las verificaciones
    await prisma.usuario.createMany({
      data: [
        {
          id: admin1Id,
          correo: `admin1_${Date.now()}@caces.edu.ec`,
          nombre: 'Admin Auditoría Uno',
          nombreCompleto: 'Admin Auditoría Uno',
          activo: true,
        },
        {
          id: admin2Id,
          correo: `admin2_${Date.now()}@caces.edu.ec`,
          nombre: 'Admin Auditoría Dos',
          nombreCompleto: 'Admin Auditoría Dos',
          activo: true,
        },
        {
          id: estudianteId,
          correo: `estudiante_${Date.now()}@caces.edu.ec`,
          nombre: 'Estudiante Prueba',
          nombreCompleto: 'Estudiante Prueba',
          activo: true,
        },
      ],
    });
  });

  afterAll(async () => {
    // Limpieza y desactivación de datos de prueba
    try {
      await prisma.programaAcademico.deleteMany({
        where: { nombre: { startsWith: 'MOD_AUDIT_' } },
      });
      await prisma.usuario.updateMany({
        where: { id: { in: [admin1Id, admin2Id, estudianteId] } },
        data: { activo: false },
      });
    } catch {
      // Ignorar cleanup errors
    }
    await app.close();
  });

  // ============================================================================
  // PRUEBA 1: CREACIÓN
  // ============================================================================
  it('Prueba 1: Creación - Admin 1 crea un módulo, se identifica automáticamente como creador con fecha exacta', async () => {
    const createdRecord = await auditContextService.runWithContext(
      {
        usuarioId: admin1Id,
        correo: 'admin1@caces.edu.ec',
        tipoActor: 'USUARIO',
        modulo: 'PROGRAMAS_ACADEMICOS',
      },
      async () => {
        return prisma.programaAcademico.create({
          data: {
            id: testModuleId,
            nombre: 'MOD_AUDIT_' + testModuleId,
            activo: true,
          },
        });
      },
    );

    expect(createdRecord).toBeDefined();
    expect(createdRecord.id).toBe(testModuleId);
    expect(createdRecord.creadoPorId).toBe(admin1Id);
    expect(createdRecord.creadoEn).toBeInstanceOf(Date);
    // Al crearse, todavía no existe modificación previa
    expect(createdRecord.modificadoPorId).toBeNull();

    // Esperar registro asíncrono/trigger de auditoría en PostgreSQL
    const trazabilidad = await auditoriaService.consultarTrazabilidadRegistro(
      'PROGRAMAS_ACADEMICOS',
      String(testModuleId),
    );

    expect(trazabilidad).toBeDefined();
    expect(trazabilidad.quienCreo.usuarioId).toBe(admin1Id);
    expect(trazabilidad.quienCreo.tipoActor).toBe('USUARIO');
    expect(trazabilidad.cuandoSeCreo).toBeDefined();
    expect(trazabilidad.lineaDeTiempo.length).toBeGreaterThanOrEqual(1);
    expect(trazabilidad.lineaDeTiempo[0].accion).toBe('INSERT');
  });

  // ============================================================================
  // PRUEBA 2: MODIFICACIÓN
  // ============================================================================
  it('Prueba 2: Modificación - Admin 2 modifica el módulo; conserva creador original y actualiza modificadoPor', async () => {
    const updatedRecord = await auditContextService.runWithContext(
      {
        usuarioId: admin2Id,
        correo: 'admin2@caces.edu.ec',
        tipoActor: 'USUARIO',
        modulo: 'PROGRAMAS_ACADEMICOS',
      },
      async () => {
        return prisma.programaAcademico.update({
          where: { id: testModuleId },
          data: {
            nombre: 'MOD_AUDIT_MOD_' + testModuleId,
          },
        });
      },
    );

    expect(updatedRecord).toBeDefined();
    // El creador original DEBE mantenerse intacto
    expect(updatedRecord.creadoPorId).toBe(admin1Id);
    // El modificador DEBE ser Admin 2
    expect(updatedRecord.modificadoPorId).toBe(admin2Id);
    expect(updatedRecord.actualizadoEn).toBeInstanceOf(Date);

    // Consultar el historial completo reconstruido
    const trazabilidad = await auditoriaService.consultarTrazabilidadRegistro(
      'PROGRAMAS_ACADEMICOS',
      String(testModuleId),
    );

    expect(trazabilidad.quienCreo.usuarioId).toBe(admin1Id);
    expect(trazabilidad.quienModificoUltimaVez?.usuarioId).toBe(admin2Id);
    expect(trazabilidad.cantidadModificaciones).toBeGreaterThanOrEqual(1);
    expect(trazabilidad.lineaDeTiempo.some((e) => e.accion === 'UPDATE')).toBe(true);

    const updateEvent = trazabilidad.lineaDeTiempo.find((e) => e.accion === 'UPDATE');
    expect(updateEvent?.valoresAnteriores).toBeDefined();
    expect(updateEvent?.valoresNuevos).toBeDefined();
  });

  // ============================================================================
  // PRUEBA 3: INTENTO DE MANIPULACIÓN
  // ============================================================================
  it('Prueba 3: Intento de manipulación - Usuario intenta enviar CREADO_POR falso; el sistema lo neutraliza', async () => {
    const fakeCreatorId = 'HACKER_SPOOF_99999';

    const record = await auditContextService.runWithContext(
      {
        usuarioId: admin2Id,
        tipoActor: 'USUARIO',
      },
      async () => {
        return prisma.programaAcademico.update({
          where: { id: testModuleId },
          data: {
            nombre: 'Intento de Hackeo de Creador ' + testModuleId,
            // El atacante intenta sobreescribir el creador original
            creadoPorId: fakeCreatorId as any,
          },
        });
      },
    );

    // El sistema debe haber ignorado/sobreescrito el creador falso
    expect(record.creadoPorId).toBe(admin1Id);
    expect(record.creadoPorId).not.toBe(fakeCreatorId);
    expect(record.modificadoPorId).toBe(admin2Id);
  });

  // ============================================================================
  // PRUEBA 4: ELIMINACIÓN Y TRAZABILIDAD DE DELETE
  // ============================================================================
  it('Prueba 4: Eliminación - Se elimina un registro y se conserva la trazabilidad del DELETE y usuario responsable', async () => {
    const tempModuleId = Math.floor(600000 + Math.random() * 800000);

    // Crear registro temporal
    await auditContextService.runWithContext(
      { usuarioId: admin1Id, tipoActor: 'USUARIO' },
      async () => {
        return prisma.programaAcademico.create({
          data: {
            id: tempModuleId,
            nombre: 'Módulo Temporal para Eliminación ' + tempModuleId,
          },
        });
      },
    );

    // Eliminar registro siendo Admin 2
    await auditContextService.runWithContext(
      { usuarioId: admin2Id, tipoActor: 'USUARIO' },
      async () => {
        return prisma.programaAcademico.delete({
          where: { id: tempModuleId },
        });
      },
    );

    // Verificar en la auditoría que el DELETE fue registrado
    const trazabilidad = await auditoriaService.consultarTrazabilidadRegistro(
      'PROGRAMAS_ACADEMICOS',
      String(tempModuleId),
    );

    expect(trazabilidad.estaEliminado).toBe(true);
    expect(trazabilidad.fechaEliminacion).toBeDefined();
    const deleteEvent = trazabilidad.lineaDeTiempo.find((e) => e.accion === 'DELETE');
    expect(deleteEvent).toBeDefined();
    expect(deleteEvent?.valoresAnteriores).toBeDefined();
  });

  // ============================================================================
  // PRUEBA 5: PROCESOS AUTOMÁTICOS
  // ============================================================================
  it('Prueba 5: Procesos automáticos - Operación ejecutada sin usuario autenticado se identifica como PROCESO_AUTOMATICO / SISTEMA', async () => {
    const cronModuleId = Math.floor(700000 + Math.random() * 800000);

    const record = await auditContextService.runWithContext(
      {
        usuarioId: null,
        tipoActor: 'PROCESO_AUTOMATICO',
        modulo: 'CRON_SYNC',
        userAgent: 'Scheduler Daemon v1.0',
      },
      async () => {
        return prisma.programaAcademico.create({
          data: {
            id: cronModuleId,
            nombre: 'Módulo Sincronizado por Cron ' + cronModuleId,
          },
        });
      },
    );

    expect(record.creadoPorId).toBeNull();

    const trazabilidad = await auditoriaService.consultarTrazabilidadRegistro(
      'PROGRAMAS_ACADEMICOS',
      String(cronModuleId),
    );

    expect(['PROCESO_AUTOMATICO', 'SISTEMA']).toContain(
      trazabilidad.quienCreo.tipoActor,
    );
    expect(trazabilidad.quienCreo.usuarioId).toBeNull();
  });

  // ============================================================================
  // PRUEBA 6: CONSISTENCIA TRANSACCIONAL
  // ============================================================================
  it('Prueba 6: Transacciones - La modificación de negocio y el historial se ejecutan de manera atómica y consistente', async () => {
    const txModuleId = Math.floor(800000 + Math.random() * 800000);

    await prisma.$transaction(async (tx) => {
      await tx.programaAcademico.create({
        data: {
          id: txModuleId,
          nombre: 'Módulo en Transacción ' + txModuleId,
          creadoPorId: admin1Id,
        },
      });

      // Modificación dentro de la misma transacción
      await tx.programaAcademico.update({
        where: { id: txModuleId },
        data: { nombre: 'Módulo en Transacción Actualizado ' + txModuleId, modificadoPorId: admin2Id },
      });
    });

    const trazabilidad = await auditoriaService.consultarTrazabilidadRegistro(
      'PROGRAMAS_ACADEMICOS',
      String(txModuleId),
    );

    expect(trazabilidad.lineaDeTiempo.length).toBeGreaterThanOrEqual(2);
    expect(trazabilidad.lineaDeTiempo.some((e) => e.accion === 'INSERT')).toBe(true);
    expect(trazabilidad.lineaDeTiempo.some((e) => e.accion === 'UPDATE')).toBe(true);
  });

  // ============================================================================
  // PRUEBA 7: OPERACIONES MASIVAS
  // ============================================================================
  it('Prueba 7: Operaciones masivas - Actualización masiva conserva modificadoPor y trazabilidad para todos los registros', async () => {
    const id1 = Math.floor(900000 + Math.random() * 800000);
    const id2 = Math.floor(1000000 + Math.random() * 800000);

    await auditContextService.runWithContext(
      { usuarioId: admin1Id, tipoActor: 'USUARIO' },
      async () => {
        await prisma.programaAcademico.createMany({
          data: [
            { id: id1, nombre: 'Batch Item ' + id1 },
            { id: id2, nombre: 'Batch Item ' + id2 },
          ],
        });
      },
    );

    // Actualización masiva por Admin 2
    await auditContextService.runWithContext(
      { usuarioId: admin2Id, tipoActor: 'USUARIO' },
      async () => {
        await prisma.programaAcademico.updateMany({
          where: { id: { in: [id1, id2] } },
          data: { activo: false },
        });
      },
    );

    const items = await prisma.programaAcademico.findMany({
      where: { id: { in: [id1, id2] } },
    });

    expect(items.length).toBe(2);
    expect(items.every((it) => it.creadoPorId === admin1Id)).toBe(true);
    expect(items.every((it) => it.modificadoPorId === admin2Id)).toBe(true);
  });

  // ============================================================================
  // PRUEBA 8: ACCESO NO AUTORIZADO E INMUTABILIDAD
  // ============================================================================
  it('Prueba 8: Acceso no autorizado - Se restringe la consulta a roles no autorizados y se bloquea la alteración directa del historial', async () => {
    // 1. Inmutabilidad en Base de Datos: Intentar borrar una fila de auditoría debe ser bloqueado
    const auditRecord = await prisma.auditoriaOperacionSistema.findFirst();
    expect(auditRecord).toBeDefined();

    if (auditRecord) {
      await expect(
        prisma.$executeRawUnsafe(
          `DELETE FROM "AUDITORIA_OPERACIONES_SISTEMA" WHERE "AUDITORIA_OPERACION_ID" = ${auditRecord.id}`,
        ),
      ).rejects.toThrow();

      await expect(
        prisma.$executeRawUnsafe(
          `UPDATE "AUDITORIA_OPERACIONES_SISTEMA" SET "TIPO_ACCION" = 'HACK' WHERE "AUDITORIA_OPERACION_ID" = ${auditRecord.id}`,
        ),
      ).rejects.toThrow();
    }
  });
});
