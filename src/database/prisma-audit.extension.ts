import { Prisma } from '@prisma/client';
import { AuditContextService } from '../common/audit/audit-context.service.js';

const MODELS_WITH_CREADO_POR = new Set([
  'Usuario',
  'PerfilTrabajador',
  'Departamento',
  'ProgramaAcademico',
  'SubmoduloAcademico',
  'TemarioVersion',
  'AreaAcademica',
  'SubareaCompetencia',
  'PreguntaVersion',
  'PreguntaOpcion',
  'ActivoMultimedia',
  'PreguntaReferencia',
  'ConfiguracionSimulador',
  'BancoCooperativa',
  'PlanSuscripcion',
]);

const MODELS_WITH_MODIFICADO_POR = new Set([
  'Usuario',
  'PerfilTrabajador',
  'Departamento',
  'ProgramaAcademico',
  'SubmoduloAcademico',
  'TemarioVersion',
  'AreaAcademica',
  'SubareaCompetencia',
  'CasoClinico',
  'Pregunta',
  'PreguntaVersion',
  'PreguntaOpcion',
  'ActivoMultimedia',
  'PreguntaReferencia',
  'ReportePregunta',
  'ConfiguracionSimulador',
  'IntentoEvaluacion',
  'BancoCooperativa',
  'PlanSuscripcion',
  'SuscripcionUsuario',
  'TransaccionPago',
  'PreferenciaAccesibilidad',
  'PreguntaFavorita',
  'NotaEstudiantePregunta',
]);

export function createAuditExtension(auditContextService?: AuditContextService) {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      query: {
        $allModels: {
          async create({ model, args, query }) {
            const context = auditContextService?.getContext();
            const userId = context?.usuarioId ?? null;

            if (args.data && typeof args.data === 'object') {
              const data = args.data as Record<string, unknown>;

              // Prevenir suplantación o inyección de CREADO_POR desde frontend
              if (MODELS_WITH_CREADO_POR.has(model)) {
                data.creadoPorId = userId;
              }
              // Al crearse la entidad, NO ha sido modificada todavía: modificadoPorId debe ser null
              if (MODELS_WITH_MODIFICADO_POR.has(model)) {
                data.modificadoPorId = null;
              }

              // Entidades con campos creadores específicos
              if (model === 'Pregunta' && userId && !data.creadorId) {
                data.creadorId = userId;
              }
              if (model === 'CasoClinico' && userId && !data.autorUsuarioId) {
                data.autorUsuarioId = userId;
              }
            }

            return query(args);
          },

          async createMany({ model, args, query }) {
            const context = auditContextService?.getContext();
            const userId = context?.usuarioId ?? null;

            if (args.data) {
              const records = Array.isArray(args.data) ? args.data : [args.data];
              for (const rec of records) {
                if (rec && typeof rec === 'object') {
                  const data = rec as Record<string, unknown>;
                  if (MODELS_WITH_CREADO_POR.has(model)) {
                    data.creadoPorId = userId;
                  }
                  if (MODELS_WITH_MODIFICADO_POR.has(model)) {
                    data.modificadoPorId = null;
                  }
                }
              }
            }

            return query(args);
          },

          async update({ model, args, query }) {
            const context = auditContextService?.getContext();
            const userId = context?.usuarioId ?? null;

            if (args.data && typeof args.data === 'object') {
              const data = args.data as Record<string, unknown>;

              // Regla obligatoria: No permitir modificar el identificador del creador original
              delete data.creadoPorId;
              delete data.creadoPor;
              delete data.creadorId;
              delete data.autorUsuarioId;
              delete data.creadoEn;

              // Asignar el usuario actual como último modificador
              if (MODELS_WITH_MODIFICADO_POR.has(model)) {
                data.modificadoPorId = userId;
              }
            }

            return query(args);
          },

          async updateMany({ model, args, query }) {
            const context = auditContextService?.getContext();
            const userId = context?.usuarioId ?? null;

            if (args.data && typeof args.data === 'object') {
              const data = args.data as Record<string, unknown>;
              delete data.creadoPorId;
              delete data.creadoPor;
              delete data.creadorId;
              delete data.autorUsuarioId;
              delete data.creadoEn;

              if (MODELS_WITH_MODIFICADO_POR.has(model)) {
                data.modificadoPorId = userId;
              }
            }

            return query(args);
          },

          async upsert({ model, args, query }) {
            const context = auditContextService?.getContext();
            const userId = context?.usuarioId ?? null;

            if (args.create && typeof args.create === 'object') {
              const createData = args.create as Record<string, unknown>;
              if (MODELS_WITH_CREADO_POR.has(model)) {
                createData.creadoPorId = userId;
              }
              if (MODELS_WITH_MODIFICADO_POR.has(model)) {
                createData.modificadoPorId = null;
              }
            }

            if (args.update && typeof args.update === 'object') {
              const updateData = args.update as Record<string, unknown>;
              delete updateData.creadoPorId;
              delete updateData.creadoPor;
              delete updateData.creadorId;
              delete updateData.autorUsuarioId;
              delete updateData.creadoEn;

              if (MODELS_WITH_MODIFICADO_POR.has(model)) {
                updateData.modificadoPorId = userId;
              }
            }

            return query(args);
          },
        },
      },
    });
  });
}

