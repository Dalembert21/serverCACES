import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  DificultadPregunta,
  EstadoPago,
  EstadoPregunta,
  RolNombre,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { validarClaveSegura } from '../common/index.js';
import {
  ActivarPlanProDto,
  ActualizarAreaDto,
  ActualizarDepartamentoDto,
  ActualizarEstadoPreguntaDto,
  ActualizarEstudianteAdminDto,
  ActualizarPlanDto,
  ActualizarPreguntaAdminDto,
  ActualizarProgramaDto,
  ActualizarTrabajadorDto,
  CrearAreaDto,
  CrearDepartamentoDto,
  CrearEstudianteAdminDto,
  CrearPlanDto,
  CrearPreguntaAdminDto,
  CrearProgramaDto,
  CrearTrabajadorDto,
  RechazarPagoDto,
} from './dto/index.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // 1. GESTIÓN DE ESTUDIANTES (AUDITORÍA, DETALLE, EDICIÓN Y SUSPENSIÓN)
  // ============================================================================

  /**
   * Lista estudiantes registrados con estado de su suscripción y último comprobante
   */
  async listarEstudiantes() {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        roles: {
          some: {
            rol: {
              nombre: RolNombre.ESTUDIANTE,
            },
          },
        },
      },
      include: {
        suscripciones: {
          include: {
            plan: true,
            transacciones: {
              orderBy: { creadoEn: 'desc' },
              take: 1,
            },
          },
          orderBy: { expiraEn: 'desc' },
          take: 1,
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    return usuarios.map((u) => {
      const sub = u.suscripciones[0];
      const esPro =
        sub && sub.estado === 'ACTIVA' && sub.planId !== 'PLAN_GRATUITO_BASE';
      const estadoPlan: 'gratuito' | 'mensual_pro' | 'vencido' = esPro
        ? 'mensual_pro'
        : sub?.estado === 'VENCIDA'
        ? 'vencido'
        : 'gratuito';

      const trans = sub?.transacciones[0];
      const comprobanteUltimoPago = trans
        ? {
            id: trans.id,
            banco: trans.entidadBancariaOrigen,
            numeroReferencia: trans.numeroComprobanteReferencia,
            monto: trans.montoDolares,
            estado: trans.estado,
            fecha: trans.fechaPagoDeclarada.toISOString().split('T')[0],
          }
        : undefined;

      const nombresDivididos = u.nombreCompleto.split(' ');
      const primerNombre = u.nombre || nombresDivididos[0] || 'Estudiante';
      const apellidos = u.apellido || nombresDivididos.slice(1).join(' ') || '';

      return {
        id: u.id,
        cedula: u.cedula || 'Sin registrar',
        nombre: primerNombre,
        apellido: apellidos,
        nombreCompleto: u.nombreCompleto,
        correo: u.correo,
        telefonoContacto: u.telefonoContacto || null,
        programaId: u.programaActivoId || 'prog-medicina',
        programaTitulo: 'Medicina Humana CACES',
        activo: u.activo,
        estadoPlan,
        fechaRegistro: u.creadoEn.toISOString().split('T')[0],
        fechaVencimientoPro: sub?.expiraEn?.toISOString().split('T')[0],
        comprobanteUltimoPago,
      };
    });
  }

  /**
   * Obtiene el perfil profundo de un estudiante con historial académico y de transacciones
   */
  async obtenerEstudiantePorId(id: string) {
    const estudiante = await this.prisma.usuario.findFirst({
      where: {
        id,
        roles: {
          some: { rol: { nombre: RolNombre.ESTUDIANTE } },
        },
      },
      include: {
        suscripciones: {
          include: {
            plan: true,
            transacciones: { orderBy: { creadoEn: 'desc' } },
          },
          orderBy: { expiraEn: 'desc' },
        },
        intentos: {
          include: {
            resultado: true,
            configuracionSimulador: true,
          },
          orderBy: { creadoEn: 'desc' },
          take: 10,
        },
      },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado en el sistema');
    }

    const sub = estudiante.suscripciones[0];
    const esPro =
      sub && sub.estado === 'ACTIVA' && sub.planId !== 'PLAN_GRATUITO_BASE';
    const estadoPlan = esPro
      ? 'mensual_pro'
      : sub?.estado === 'VENCIDA'
      ? 'vencido'
      : 'gratuito';

    const intentosConResultado = estudiante.intentos.filter((i) => i.resultado);
    const promedioCalificacion =
      intentosConResultado.length > 0
        ? Number(
            (
              intentosConResultado.reduce(
                (acc, curr) => acc + (curr.resultado?.calificacionSobreCien || 0),
                0,
              ) / intentosConResultado.length
            ).toFixed(2),
          )
        : 0;

    return {
      id: estudiante.id,
      cedula: estudiante.cedula || 'Sin registrar',
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      nombreCompleto: estudiante.nombreCompleto,
      correo: estudiante.correo,
      telefonoContacto: estudiante.telefonoContacto,
      programaActivoId: estudiante.programaActivoId,
      activo: estudiante.activo,
      correoVerificado: estudiante.correoVerificado,
      proveedorAuth: estudiante.proveedorAuth,
      fechaRegistro: estudiante.creadoEn.toISOString(),
      estadoPlan,
      suscripcionActiva: sub
        ? {
            id: sub.id,
            planNombre: sub.plan.nombre,
            estado: sub.estado,
            iniciaEn: sub.iniciaEn.toISOString(),
            expiraEn: sub.expiraEn.toISOString(),
            preguntasConsumidas: sub.preguntasGratisConsumidas,
            simuladoresConsumidos: sub.simuladoresGratisConsumidos,
          }
        : null,
      historialTransacciones:
        sub?.transacciones.map((t) => ({
          id: t.id,
          banco: t.entidadBancariaOrigen,
          comprobante: t.numeroComprobanteReferencia,
          monto: t.montoDolares,
          estado: t.estado,
          fotoUrl: t.urlFotoComprobante,
          fecha: t.creadoEn.toISOString(),
        })) || [],
      estadisticasSimulacros: {
        totalIntentos: estudiante.intentos.length,
        promedioCalificacion,
        ultimosIntentos: estudiante.intentos.map((i) => ({
          id: i.id,
          titulo: i.configuracionSimulador?.titulo || 'Práctica Libre',
          calificacion: i.resultado?.calificacionSobreCien ?? null,
          aprobado: i.resultado?.aprobado ?? false,
          fecha: i.fechaInicio.toISOString(),
        })),
      },
    };
  }

  /**
   * Registro directo de estudiante desde el panel de Superadmin con plan inicial
   */
  async crearEstudiante(dto: CrearEstudianteAdminDto) {
    const correoLimpio = dto.correo.toLowerCase().trim();
    const cedulaLimpia = dto.cedula.trim();

    const existeUsuario = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: { equals: correoLimpio, mode: 'insensitive' } },
          { cedula: cedulaLimpia },
        ],
      },
    });

    if (existeUsuario) {
      if (existeUsuario.correo.toLowerCase() === correoLimpio) {
        throw new ConflictException(
          'El correo electrónico ya se encuentra registrado por otro usuario',
        );
      }
      throw new ConflictException(
        'El número de cédula ingresado ya pertenece a otro usuario registrado',
      );
    }

    const rolEstudiante = await this.prisma.rol.findUnique({
      where: { nombre: RolNombre.ESTUDIANTE },
    });

    if (!rolEstudiante) {
      throw new BadRequestException(
        'El rol de estudiante no se encuentra configurado en la base de datos',
      );
    }

    const progLimpio = dto.programaId.trim();
    const programa = await this.prisma.programaAcademico.findFirst({
      where: {
        OR: [
          { id: progLimpio },
          { id: progLimpio.toUpperCase() },
          { id: `caces-${progLimpio.toLowerCase().replace('prog-', '')}` },
        ],
      },
    });
    const programaActivoId = programa?.id || progLimpio;

    const passwordPlano =
      dto.password?.trim() || `Caces${Math.floor(1000 + Math.random() * 9000)}!`;
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(passwordPlano, salt);

    const nombreCompleto = `${dto.nombre.trim()} ${dto.apellido.trim()}`;

    const planIdSeleccionado = dto.planId || 'PLAN_GRATUITO_BASE';
    const planDb = await this.prisma.planSuscripcion.findUnique({
      where: { id: planIdSeleccionado },
    });

    const esPlanPro = planDb
      ? planDb.precioDolares > 0
      : planIdSeleccionado.toUpperCase().includes('PRO');
    const diasVigencia =
      dto.diasVigencia || (planDb?.duracionDiasVigencia ?? (esPlanPro ? 30 : 365));

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + diasVigencia);

    const estudianteCreado = await this.prisma.$transaction(async (tx) => {
      const nuevo = await tx.usuario.create({
        data: {
          correo: correoLimpio,
          cedula: cedulaLimpia,
          nombre: dto.nombre.trim(),
          apellido: dto.apellido.trim(),
          nombreCompleto,
          telefonoContacto: dto.telefonoContacto?.trim() || null,
          contrasenaHash,
          rol: 'estudiante',
          programaActivoId,
          proveedorAuth: 'local',
          correoVerificado: true,
          activo: true,
        },
      });

      await tx.usuarioRol.create({
        data: {
          usuarioId: nuevo.id,
          rolId: rolEstudiante.id,
        },
      });

      await tx.suscripcionUsuario.create({
        data: {
          usuarioId: nuevo.id,
          planId: planDb ? planDb.id : 'PLAN_GRATUITO_BASE',
          estado: 'ACTIVA',
          iniciaEn: new Date(),
          expiraEn,
          preguntasGratisConsumidas: 0,
          simuladoresGratisConsumidos: 0,
        },
      });

      return nuevo;
    });

    return {
      mensaje: 'Estudiante registrado correctamente en el sistema',
      estudiante: {
        id: estudianteCreado.id,
        cedula: estudianteCreado.cedula,
        nombre: estudianteCreado.nombre,
        apellido: estudianteCreado.apellido,
        nombreCompleto: estudianteCreado.nombreCompleto,
        correo: estudianteCreado.correo,
        programaActivoId: estudianteCreado.programaActivoId,
        planAsignado: planDb?.nombre || (esPlanPro ? 'Suscripción Pro' : 'Plan Demostración Gratuito'),
        diasVigencia,
        fechaExpiracion: expiraEn.toISOString(),
      },
      credencialesAcceso: {
        identificador: estudianteCreado.correo,
        passwordProvisional: passwordPlano,
      },
    };
  }

  /**
   * Actualiza datos personales o académicos de un estudiante desde soporte/administración
   */
  async actualizarEstudiante(id: string, dto: ActualizarEstudianteAdminDto) {
    const estudiante = await this.prisma.usuario.findFirst({
      where: {
        id,
        roles: { some: { rol: { nombre: RolNombre.ESTUDIANTE } } },
      },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    if (
      dto.correo &&
      dto.correo.toLowerCase().trim() !== estudiante.correo.toLowerCase().trim()
    ) {
      const existeCorreo = await this.prisma.usuario.findFirst({
        where: {
          correo: { equals: dto.correo.toLowerCase().trim(), mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (existeCorreo) {
        throw new ConflictException(
          'El correo electrónico ya está en uso por otro usuario',
        );
      }
    }

    if (dto.cedula && dto.cedula.trim() !== estudiante.cedula) {
      const existeCedula = await this.prisma.usuario.findFirst({
        where: {
          cedula: dto.cedula.trim(),
          id: { not: id },
        },
      });
      if (existeCedula) {
        throw new ConflictException(
          'El número de cédula ingresado ya pertenece a otro usuario registrado',
        );
      }
    }

    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.apellido !== undefined) data.apellido = dto.apellido.trim();
    if (dto.nombre || dto.apellido) {
      const n = dto.nombre?.trim() || estudiante.nombre || '';
      const a = dto.apellido?.trim() || estudiante.apellido || '';
      data.nombreCompleto = `${n} ${a}`.trim();
    }
    if (dto.correo !== undefined) data.correo = dto.correo.toLowerCase().trim();
    if (dto.cedula !== undefined) data.cedula = dto.cedula.trim();
    if (dto.telefonoContacto !== undefined)
      data.telefonoContacto = dto.telefonoContacto.trim();
    if (dto.programaActivoId !== undefined)
      data.programaActivoId = dto.programaActivoId;
    if (dto.activo !== undefined) data.activo = dto.activo;

    await this.prisma.usuario.update({
      where: { id },
      data,
    });

    return this.obtenerEstudiantePorId(id);
  }

  /**
   * Alterna el estado activo / suspendido de un estudiante
   */
  async alternarEstadoEstudiante(id: string) {
    const estudiante = await this.prisma.usuario.findFirst({
      where: {
        id,
        roles: { some: { rol: { nombre: RolNombre.ESTUDIANTE } } },
      },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const nuevoEstado = !estudiante.activo;
    await this.prisma.usuario.update({
      where: { id },
      data: { activo: nuevoEstado },
    });

    return {
      mensaje: `Estudiante ${nuevoEstado ? 'activado' : 'suspendido'} exitosamente`,
      id,
      activo: nuevoEstado,
    };
  }

  /**
   * Activa manualmente el plan Pro para un estudiante (beca o activación directa)
   */
  async activarPlanProEstudiante(estudianteId: string, diasVigencia: number = 30) {
    const estudiante = await this.prisma.usuario.findUnique({
      where: { id: estudianteId },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + diasVigencia);

    const planPro =
      (await this.prisma.planSuscripcion.findFirst({
        where: { id: 'PLAN_SEMESTRAL_PRO' },
      })) ||
      (await this.prisma.planSuscripcion.findFirst({
        where: { precioDolares: { gt: 0 } },
      }));

    if (!planPro) {
      throw new BadRequestException(
        'No existe un plan Pro configurado en la base de datos',
      );
    }

    const suscripcion = await this.prisma.suscripcionUsuario.create({
      data: {
        usuarioId: estudiante.id,
        planId: planPro.id,
        estado: 'ACTIVA',
        iniciaEn: new Date(),
        expiraEn,
      },
    });

    return {
      mensaje: `Plan Pro activado exitosamente para ${estudiante.nombreCompleto} por ${diasVigencia} días.`,
      suscripcionId: suscripcion.id,
      expiraEn: suscripcion.expiraEn,
    };
  }

  // ============================================================================
  // 2. TESORERÍA, RECAUDACIÓN Y APROBACIÓN DE COMPROBANTES DE PAGO
  // ============================================================================

  /**
   * Lista todos los pagos y comprobantes bancarios declarados por estudiantes
   */
  async listarPagos(estado?: EstadoPago, termino?: string) {
    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (termino && termino.trim()) {
      const busqueda = termino.trim();
      where.OR = [
        { numeroComprobanteReferencia: { contains: busqueda, mode: 'insensitive' } },
        { entidadBancariaOrigen: { contains: busqueda, mode: 'insensitive' } },
        {
          usuarioPagador: {
            OR: [
              { nombreCompleto: { contains: busqueda, mode: 'insensitive' } },
              { correo: { contains: busqueda, mode: 'insensitive' } },
              { cedula: { contains: busqueda, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const transacciones = await this.prisma.transaccionPago.findMany({
      where,
      include: {
        usuarioPagador: true,
        administradorAprobador: true,
        suscripcion: {
          include: { plan: true },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    return transacciones.map((t) => ({
      id: t.id,
      estudianteId: t.usuarioPagadorId,
      estudianteNombre: t.usuarioPagador.nombreCompleto,
      estudianteCorreo: t.usuarioPagador.correo,
      estudianteCedula: t.usuarioPagador.cedula || 'Sin registrar',
      planId: t.suscripcion.planId,
      planNombre: t.suscripcion.plan.nombre,
      montoDolares: t.montoDolares,
      entidadBancariaOrigen: t.entidadBancariaOrigen,
      numeroComprobanteReferencia: t.numeroComprobanteReferencia,
      urlFotoComprobante: t.urlFotoComprobante,
      estado: t.estado,
      aprobadorNombre: t.administradorAprobador?.nombreCompleto || null,
      motivoObservacion: t.motivoObservacionAdmin || null,
      fechaPagoDeclarada: t.fechaPagoDeclarada.toISOString(),
      fechaRegistro: t.creadoEn.toISOString(),
    }));
  }

  /**
   * Consulta el detalle completo de un comprobante de pago
   */
  async obtenerPagoPorId(id: string) {
    const transaccion = await this.prisma.transaccionPago.findUnique({
      where: { id },
      include: {
        usuarioPagador: true,
        administradorAprobador: true,
        suscripcion: {
          include: { plan: true },
        },
      },
    });

    if (!transaccion) {
      throw new NotFoundException('Comprobante de pago no encontrado');
    }

    return {
      id: transaccion.id,
      estudiante: {
        id: transaccion.usuarioPagador.id,
        nombreCompleto: transaccion.usuarioPagador.nombreCompleto,
        correo: transaccion.usuarioPagador.correo,
        cedula: transaccion.usuarioPagador.cedula,
        telefono: transaccion.usuarioPagador.telefonoContacto,
      },
      plan: {
        id: transaccion.suscripcion.plan.id,
        nombre: transaccion.suscripcion.plan.nombre,
        precioOficial: transaccion.suscripcion.plan.precioDolares,
        duracionDias: transaccion.suscripcion.plan.duracionDiasVigencia,
      },
      montoDeclarado: transaccion.montoDolares,
      entidadBancariaOrigen: transaccion.entidadBancariaOrigen,
      numeroComprobanteReferencia: transaccion.numeroComprobanteReferencia,
      urlFotoComprobante: transaccion.urlFotoComprobante,
      estado: transaccion.estado,
      aprobadoPor: transaccion.administradorAprobador?.nombreCompleto || null,
      motivoObservacion: transaccion.motivoObservacionAdmin || null,
      fechaDeclarada: transaccion.fechaPagoDeclarada.toISOString(),
      fechaCreacion: transaccion.creadoEn.toISOString(),
    };
  }

  /**
   * Aprueba un pago bancario, cambia el estado a APROBADA y activa la membresía Pro del estudiante
   */
  async aprobarPago(transaccionId: string, adminId: string) {
    const transaccion = await this.prisma.transaccionPago.findUnique({
      where: { id: transaccionId },
      include: {
        suscripcion: {
          include: { plan: true },
        },
        usuarioPagador: true,
      },
    });

    if (!transaccion) {
      throw new NotFoundException('Transacción de pago no encontrada');
    }

    if (transaccion.estado === 'APROBADA') {
      throw new ConflictException(
        'Esta transacción ya se encuentra aprobada y la suscripción está vigente',
      );
    }

    const plan = transaccion.suscripcion.plan;
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + (plan.duracionDiasVigencia || 30));

    await this.prisma.$transaction(async (tx) => {
      await tx.transaccionPago.update({
        where: { id: transaccionId },
        data: {
          estado: 'APROBADA',
          administradorAprobadorId: adminId,
          motivoObservacionAdmin: null,
        },
      });

      await tx.suscripcionUsuario.update({
        where: { id: transaccion.suscripcionUsuarioId },
        data: {
          estado: 'ACTIVA',
          iniciaEn: new Date(),
          expiraEn,
        },
      });
    });

    this.logger.log(
      `Pago aprobado por ${adminId} para estudiante ${transaccion.usuarioPagador.correo} ($${transaccion.montoDolares} USD)`,
    );

    return {
      mensaje: `Pago de $${transaccion.montoDolares} USD aprobado exitosamente para ${transaccion.usuarioPagador.nombreCompleto}`,
      transaccionId,
      suscripcionId: transaccion.suscripcionUsuarioId,
      expiraEn: expiraEn.toISOString(),
      estado: 'APROBADA',
    };
  }

  /**
   * Rechaza un comprobante bancario por inconsistencia o monto erróneo
   */
  async rechazarPago(transaccionId: string, motivo: string, adminId: string) {
    const transaccion = await this.prisma.transaccionPago.findUnique({
      where: { id: transaccionId },
      include: { usuarioPagador: true },
    });

    if (!transaccion) {
      throw new NotFoundException('Transacción de pago no encontrada');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaccionPago.update({
        where: { id: transaccionId },
        data: {
          estado: 'RECHAZADA',
          administradorAprobadorId: adminId,
          motivoObservacionAdmin: motivo,
        },
      });

      await tx.suscripcionUsuario.update({
        where: { id: transaccion.suscripcionUsuarioId },
        data: {
          estado: 'CANCELADA',
        },
      });
    });

    this.logger.warn(
      `Pago rechazado por ${adminId} a estudiante ${transaccion.usuarioPagador.correo}. Motivo: ${motivo}`,
    );

    return {
      mensaje: `Comprobante rechazado correctamente para ${transaccion.usuarioPagador.nombreCompleto}`,
      transaccionId,
      motivo,
      estado: 'RECHAZADA',
    };
  }

  // ============================================================================
  // 3. CRUD COMPLETO DEL BANCO DE PREGUNTAS Y AUDITORÍA DOCENTE
  // ============================================================================

  /**
   * Crea una nueva pregunta con su versión 1, opciones de respuesta y bibliografía
   */
  async crearPregunta(dto: CrearPreguntaAdminDto, creadorId: string) {
    const subarea = await this.prisma.subareaCompetencia.findFirst({
      where: {
        OR: [{ id: dto.codigoSubarea }, { codigoOficial: dto.codigoSubarea }],
      },
    });

    if (!subarea) {
      throw new NotFoundException(
        `Subárea/Competencia con código "${dto.codigoSubarea}" no encontrada en el catálogo CACES`,
      );
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigoPublico = `PREG-${dto.codigoSubarea.toUpperCase()}-${Date.now().toString().slice(-4)}${randomSuffix}`;

    return this.prisma.$transaction(async (tx) => {
      const pregunta = await tx.pregunta.create({
        data: {
          subareaCompetenciaId: subarea.id,
          codigoPublico,
          creadorId,
        },
      });

      const version = await tx.preguntaVersion.create({
        data: {
          preguntaId: pregunta.id,
          numeroVersion: 1,
          enunciado: dto.enunciado,
          explicacionPedagogica: dto.explicacionPedagogica,
          dificultad: (dto.dificultad as DificultadPregunta) || 'MEDIA',
          estado: 'BORRADOR',
        },
      });

      for (const op of dto.opciones) {
        await tx.preguntaOpcion.create({
          data: {
            preguntaVersionId: version.id,
            letra: op.letra,
            texto: op.texto,
            esCorrecta: op.esCorrecta,
            justificacion: op.justificacion || null,
          },
        });
      }

      if (dto.referenciaOficial) {
        await tx.preguntaReferencia.create({
          data: {
            preguntaVersionId: version.id,
            fuenteOficial: 'CACES / Guías MSP Oficiales',
            tituloPublicacion: dto.referenciaOficial,
            anioPublicacion: new Date().getFullYear(),
          },
        });
      }

      if (dto.imagenUrl) {
        await tx.activoMultimedia.create({
          data: {
            preguntaVersionId: version.id,
            urlAlmacenamiento: dto.imagenUrl.trim(),
            descripcionAccesible:
              dto.descripcionImagen?.trim() || 'Imagen clínica o recurso de evaluación adjunto',
            tipoActivo: (dto.tipoMultimedia as any) || 'OTRO',
          },
        });
      }

      return {
        mensaje: 'Pregunta creada exitosamente en el banco de evaluación',
        preguntaId: pregunta.id,
        codigoPublico: pregunta.codigoPublico,
        versionId: version.id,
      };
    });
  }

  /**
   * Obtiene el detalle completo de una pregunta con todas sus opciones y metadatos
   */
  async obtenerPreguntaPorId(id: string) {
    const pregunta = await this.prisma.pregunta.findFirst({
      where: { OR: [{ id }, { codigoPublico: id }] },
      include: {
        subarea: {
          include: {
            areaAcademica: {
              include: {
                temarioVersion: {
                  include: { programa: true },
                },
              },
            },
          },
        },
        creador: true,
        versiones: {
          orderBy: { numeroVersion: 'desc' },
          include: {
            opciones: true,
            referencias: true,
            activosMultimedia: true,
            revisor: true,
          },
        },
      },
    });

    if (!pregunta) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    const v = pregunta.versiones[0];
    const multimedia = v?.activosMultimedia?.[0];
    return {
      id: pregunta.id,
      codigoPublico: pregunta.codigoPublico,
      programa:
        pregunta.subarea.areaAcademica.temarioVersion.programa.nombre,
      areaId: pregunta.subarea.areaAcademicaId,
      areaNombre: pregunta.subarea.areaAcademica.nombre,
      subareaId: pregunta.subarea.id,
      subareaCodigo: pregunta.subarea.codigoOficial,
      subareaNombre: pregunta.subarea.nombre,
      creadorNombre: pregunta.creador?.nombreCompleto || 'Docente',
      enunciado: v?.enunciado ?? '',
      explicacionPedagogica: v?.explicacionPedagogica ?? '',
      dificultad: v?.dificultad ?? 'MEDIA',
      estadoRevision: v?.estado ?? 'BORRADOR',
      revisorNombre: v?.revisor?.nombreCompleto || null,
      fechaRevision: v?.fechaRevision || null,
      imagenUrl: multimedia?.urlAlmacenamiento || null,
      descripcionImagen: multimedia?.descripcionAccesible || null,
      tipoMultimedia: multimedia?.tipoActivo || null,
      opciones:
        v?.opciones.map((o) => ({
          id: o.id,
          letra: o.letra,
          texto: o.texto,
          esCorrecta: o.esCorrecta,
          justificacion: o.justificacion,
        })) ?? [],
      referencia: v?.referencias[0]?.tituloPublicacion || null,
      creadoEn: pregunta.creadoEn.toISOString(),
    };
  }

  /**
   * Actualiza el contenido pedagógico, enunciado u opciones de una pregunta existente
   */
  async actualizarPregunta(
    id: string,
    dto: ActualizarPreguntaAdminDto,
    revisorId?: string,
  ) {
    const pregunta = await this.prisma.pregunta.findFirst({
      where: { OR: [{ id }, { codigoPublico: id }] },
      include: {
        versiones: {
          orderBy: { numeroVersion: 'desc' },
          take: 1,
          include: { opciones: true, referencias: true },
        },
      },
    });

    if (!pregunta) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    const versionActual = pregunta.versiones[0];
    if (!versionActual) {
      throw new NotFoundException('Versión de pregunta no encontrada');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.codigoSubarea) {
        const subarea = await tx.subareaCompetencia.findFirst({
          where: {
            OR: [
              { id: dto.codigoSubarea },
              { codigoOficial: dto.codigoSubarea },
            ],
          },
        });
        if (subarea) {
          await tx.pregunta.update({
            where: { id: pregunta.id },
            data: { subareaCompetenciaId: subarea.id },
          });
        }
      }

      const nuevaDataVersion: any = {};
      if (dto.enunciado !== undefined)
        nuevaDataVersion.enunciado = dto.enunciado;
      if (dto.explicacionPedagogica !== undefined)
        nuevaDataVersion.explicacionPedagogica = dto.explicacionPedagogica;
      if (dto.dificultad !== undefined)
        nuevaDataVersion.dificultad = dto.dificultad;
      if (dto.estado !== undefined) nuevaDataVersion.estado = dto.estado;
      if (revisorId) {
        nuevaDataVersion.revisorId = revisorId;
        nuevaDataVersion.fechaRevision = new Date();
      }

      if (Object.keys(nuevaDataVersion).length > 0) {
        await tx.preguntaVersion.update({
          where: { id: versionActual.id },
          data: nuevaDataVersion,
        });
      }

      if (dto.opciones && dto.opciones.length > 0) {
        await tx.preguntaOpcion.deleteMany({
          where: { preguntaVersionId: versionActual.id },
        });
        for (const op of dto.opciones) {
          await tx.preguntaOpcion.create({
            data: {
              preguntaVersionId: versionActual.id,
              letra: op.letra,
              texto: op.texto,
              esCorrecta: op.esCorrecta,
              justificacion: op.justificacion || null,
            },
          });
        }
      }

      if (dto.referenciaOficial) {
        const refExistente = versionActual.referencias[0];
        if (refExistente) {
          await tx.preguntaReferencia.update({
            where: { id: refExistente.id },
            data: { tituloPublicacion: dto.referenciaOficial },
          });
        } else {
          await tx.preguntaReferencia.create({
            data: {
              preguntaVersionId: versionActual.id,
              fuenteOficial: 'CACES Oficial',
              tituloPublicacion: dto.referenciaOficial,
              anioPublicacion: new Date().getFullYear(),
            },
          });
        }
      }

      if (dto.imagenUrl !== undefined) {
        if (!dto.imagenUrl) {
          await tx.activoMultimedia.deleteMany({
            where: { preguntaVersionId: versionActual.id },
          });
        } else {
          const multimediaExistente = await tx.activoMultimedia.findFirst({
            where: { preguntaVersionId: versionActual.id },
          });

          if (multimediaExistente) {
            await tx.activoMultimedia.update({
              where: { id: multimediaExistente.id },
              data: {
                urlAlmacenamiento: dto.imagenUrl.trim(),
                descripcionAccesible:
                  dto.descripcionImagen?.trim() || multimediaExistente.descripcionAccesible,
                tipoActivo: (dto.tipoMultimedia as any) || multimediaExistente.tipoActivo,
              },
            });
          } else {
            await tx.activoMultimedia.create({
              data: {
                preguntaVersionId: versionActual.id,
                urlAlmacenamiento: dto.imagenUrl.trim(),
                descripcionAccesible:
                  dto.descripcionImagen?.trim() || 'Imagen clínica o recurso de evaluación adjunto',
                tipoActivo: (dto.tipoMultimedia as any) || 'OTRO',
              },
            });
          }
        }
      }

      return {
        mensaje: 'Pregunta actualizada exitosamente',
        preguntaId: pregunta.id,
      };
    });
  }

  /**
   * Elimina una pregunta o la marca como RETIRADA si ya cuenta con historial en simulacros
   */
  async eliminarPregunta(id: string) {
    const pregunta = await this.prisma.pregunta.findFirst({
      where: { OR: [{ id }, { codigoPublico: id }] },
      include: {
        versiones: {
          include: {
            respuestas: { take: 1 },
          },
        },
      },
    });

    if (!pregunta) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    const tieneRespuestas = pregunta.versiones.some(
      (v) => v.respuestas.length > 0,
    );

    if (tieneRespuestas) {
      const ultimaVersion = pregunta.versiones[0];
      if (ultimaVersion) {
        await this.prisma.preguntaVersion.update({
          where: { id: ultimaVersion.id },
          data: { estado: 'RETIRADA' },
        });
      }
      return {
        mensaje:
          'La pregunta cuenta con intentos históricos de examen; ha sido marcada como RETIRADA para preservar la integridad de las calificaciones.',
        accion: 'RETIRADA',
        preguntaId: pregunta.id,
      };
    }

    await this.prisma.pregunta.delete({
      where: { id: pregunta.id },
    });

    return {
      mensaje: 'Pregunta eliminada exitosamente del banco de datos.',
      accion: 'ELIMINADA',
      preguntaId: pregunta.id,
    };
  }

  /**
   * Lista banco completo de preguntas con soporte para filtros de programa, área, subárea, estado y búsqueda
   */
  async listarPreguntasAdmin(filtros?: {
    programaId?: string;
    areaId?: string;
    subareaId?: string;
    estado?: EstadoPregunta;
    termino?: string;
  }) {
    const where: any = {};

    if (filtros?.subareaId) {
      where.OR = [
        { subareaCompetenciaId: filtros.subareaId },
        { subarea: { codigoOficial: filtros.subareaId } },
      ];
    } else if (filtros?.areaId) {
      where.subarea = { areaAcademicaId: filtros.areaId };
    } else if (filtros?.programaId) {
      const progLimpio = filtros.programaId.trim();
      where.subarea = {
        areaAcademica: {
          temarioVersion: {
            programaAcademico: {
              OR: [
                { id: progLimpio },
                { id: progLimpio.toUpperCase() },
                { id: `caces-${progLimpio.toLowerCase().replace('prog-', '')}` },
              ],
            },
          },
        },
      };
    }

    if (filtros?.estado) {
      where.versiones = {
        some: { estado: filtros.estado },
      };
    }

    if (filtros?.termino) {
      const term = filtros.termino.trim();
      where.AND = [
        {
          OR: [
            { codigoPublico: { contains: term, mode: 'insensitive' } },
            {
              versiones: {
                some: { enunciado: { contains: term, mode: 'insensitive' } },
              },
            },
          ],
        },
      ];
    }

    const preguntas = await this.prisma.pregunta.findMany({
      where,
      include: {
        subarea: {
          include: {
            areaAcademica: true,
          },
        },
        versiones: {
          orderBy: { numeroVersion: 'desc' },
          take: 1,
          include: {
            opciones: true,
            referencias: true,
            activosMultimedia: true,
            revisor: true,
          },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    return preguntas.map((p) => {
      const v = p.versiones[0];
      const multimedia = v?.activosMultimedia?.[0];
      return {
        id: p.id,
        codigoPublico: p.codigoPublico,
        areaId: p.subarea.areaAcademicaId,
        areaNombre: p.subarea.areaAcademica.nombre,
        subareaCodigo: p.subarea.codigoOficial,
        subareaNombre: p.subarea.nombre,
        enunciado: v?.enunciado ?? '',
        explicacionPedagogica: v?.explicacionPedagogica ?? '',
        dificultad: v?.dificultad ?? 'MEDIA',
        estadoRevision: v?.estado ?? 'BORRADOR',
        revisorNombre: v?.revisor?.nombreCompleto || null,
        fechaRevision: v?.fechaRevision || null,
        tieneImagen: !!multimedia,
        imagenUrl: multimedia?.urlAlmacenamiento || null,
        descripcionImagen: multimedia?.descripcionAccesible || null,
        tipoMultimedia: multimedia?.tipoActivo || null,
        opciones:
          v?.opciones.map((o) => ({
            id: o.id,
            letra: o.letra,
            texto: o.texto,
            esCorrecta: o.esCorrecta,
            justificacion: o.justificacion,
          })) ?? [],
      };
    });
  }

  /**
   * Consulta el árbol completo de estructura académica (Programas -> Áreas -> Subáreas)
   */
  async listarEstructuraAcademica(programaId?: string) {
    const wherePrograma: any = { activo: true };
    if (programaId) {
      const prog = programaId.trim();
      wherePrograma.OR = [
        { id: prog },
        { id: prog.toUpperCase() },
        { id: `caces-${prog.toLowerCase().replace('prog-', '')}` },
        { codigoOficialCaces: prog },
      ];
    }

    const programas = await this.prisma.programaAcademico.findMany({
      where: wherePrograma,
      include: {
        versionesTemarios: {
          where: { activo: true },
          include: {
            areas: {
              include: {
                subareasCompetencias: {
                  include: {
                    _count: {
                      select: { preguntas: true },
                    },
                  },
                },
              },
              orderBy: { nombre: 'asc' },
            },
          },
          orderBy: { fechaInicioVigencia: 'desc' },
          take: 1,
        },
      },
      orderBy: { creadoEn: 'asc' },
    });

    return programas.map((prog) => {
      const temario = prog.versionesTemarios[0];
      const areas = (temario?.areas || []).map((area) => ({
        id: area.id,
        nombre: area.nombre,
        pesoPorcentual: area.pesoPorcentual,
        subareas: area.subareasCompetencias.map((sub) => ({
          id: sub.id,
          codigoOficial: sub.codigoOficial,
          nombre: sub.nombre,
          descripcion: sub.descripcion,
          totalPreguntas: sub._count.preguntas,
        })),
      }));

      return {
        programaId: prog.id,
        nombrePrograma: prog.nombre,
        codigoOficialCaces: prog.codigoOficialCaces,
        totalAreas: areas.length,
        areas,
      };
    });
  }

  /**
   * Cambia el estado de revisión de una pregunta (APROBADA, PUBLICADA, OBSERVADA)
   */
  async actualizarEstadoPregunta(
    preguntaId: string,
    nuevoEstado: string,
    revisorId?: string,
  ) {
    const ultimaVersion = await this.prisma.preguntaVersion.findFirst({
      where: { preguntaId },
      orderBy: { numeroVersion: 'desc' },
    });

    if (!ultimaVersion) {
      throw new NotFoundException('Versión de pregunta no encontrada');
    }

    const versionActualizada = await this.prisma.preguntaVersion.update({
      where: { id: ultimaVersion.id },
      data: {
        estado: nuevoEstado as any,
        revisorId: revisorId || null,
        fechaRevision: new Date(),
      },
    });

    return {
      mensaje: `Pregunta actualizada a estado: ${nuevoEstado}`,
      versionId: versionActualizada.id,
      estado: versionActualizada.estado,
    };
  }

  // ============================================================================
  // 4. CRUD DE PLANES DE SUSCRIPCIÓN COMERCIAL
  // ============================================================================

  /**
   * Lista todos los planes comerciales para administración
   */
  async listarPlanesAdmin() {
    return this.prisma.planSuscripcion.findMany({
      include: {
        _count: {
          select: { suscripciones: true },
        },
      },
      orderBy: { precioDolares: 'asc' },
    });
  }

  /**
   * Consulta el detalle de un plan comercial
   */
  async obtenerPlanAdmin(id: string) {
    const plan = await this.prisma.planSuscripcion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { suscripciones: true },
        },
      },
    });
    if (!plan) throw new NotFoundException('Plan comercial no encontrado');
    return plan;
  }

  /**
   * Crea un nuevo plan comercial de suscripción
   */
  async crearPlan(dto: CrearPlanDto) {
    const existe = await this.prisma.planSuscripcion.findUnique({
      where: { id: dto.id },
    });
    if (existe) {
      throw new ConflictException(
        `Ya existe un plan con el identificador "${dto.id}"`,
      );
    }

    return this.prisma.planSuscripcion.create({
      data: {
        id: dto.id,
        nombre: dto.nombre,
        descripcion: dto.descripcion || null,
        precioDolares: dto.precioDolares,
        duracionDiasVigencia: dto.duracionDiasVigencia,
        limitePreguntasGratis: dto.limitePreguntasGratis ?? 20,
        accesoSimuladoresIlimitados: dto.accesoSimuladoresIlimitados ?? false,
        accesoAnaliticaAvanzada: dto.accesoAnaliticaAvanzada ?? false,
        activo: dto.activo ?? true,
      },
    });
  }

  /**
   * Actualiza precios, días o beneficios de un plan
   */
  async actualizarPlan(id: string, dto: ActualizarPlanDto) {
    const plan = await this.prisma.planSuscripcion.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    return this.prisma.planSuscripcion.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Elimina o desactiva un plan comercial
   */
  async eliminarPlan(id: string) {
    const plan = await this.prisma.planSuscripcion.findUnique({
      where: { id },
      include: { _count: { select: { suscripciones: true } } },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    if (plan._count.suscripciones > 0) {
      await this.prisma.planSuscripcion.update({
        where: { id },
        data: { activo: false },
      });
      return {
        mensaje:
          'El plan posee suscripciones activas asociadas. Se ha desactivado para nuevas compras.',
        accion: 'DESACTIVADO',
        id,
      };
    }

    await this.prisma.planSuscripcion.delete({ where: { id } });
    return {
      mensaje: 'Plan eliminado definitivamente de la base de datos',
      accion: 'ELIMINADO',
      id,
    };
  }

  // ============================================================================
  // 5. CRUD DE PROGRAMAS ACADÉMICOS Y ÁREAS TEMÁTICAS CACES
  // ============================================================================

  /**
   * Registra una nueva carrera CACES con su temario y configuración oficial de simulacro
   */
  async crearProgramaAcademico(dto: CrearProgramaDto) {
    const existeId = await this.prisma.programaAcademico.findUnique({
      where: { id: dto.id },
    });
    if (existeId)
      throw new ConflictException(`El ID ${dto.id} ya se encuentra registrado`);

    const existeCodigo = await this.prisma.programaAcademico.findUnique({
      where: { codigoOficialCaces: dto.codigoOficialCaces },
    });
    if (existeCodigo)
      throw new ConflictException(
        `El código oficial CACES ${dto.codigoOficialCaces} ya existe`,
      );

    return this.prisma.$transaction(async (tx) => {
      const programa = await tx.programaAcademico.create({
        data: {
          id: dto.id,
          codigoOficialCaces: dto.codigoOficialCaces,
          nombre: dto.nombre,
          descripcion: dto.descripcion || null,
          activo: dto.activo ?? true,
        },
      });

      const temario = await tx.temarioVersion.create({
        data: {
          programaAcademicoId: programa.id,
          codigoVersion: 'V2026-OFICIAL',
          activo: true,
        },
      });

      await tx.configuracionSimulador.create({
        data: {
          programaAcademicoId: programa.id,
          titulo: `Simulacro Oficial CACES - ${dto.nombre}`,
          duracionMinutos: dto.duracionMinutos || 180,
          totalPreguntas: dto.totalPreguntas || 120,
          notaMinimaAprobacion: dto.notaMinimaAprobacion || 70,
          modalidad: 'SIMULACRO_OFICIAL',
          activo: true,
        },
      });

      return {
        mensaje: 'Programa académico y simulador oficial creados exitosamente',
        programa,
        temarioId: temario.id,
      };
    });
  }

  /**
   * Actualiza el programa académico y sus parámetros de examen
   */
  async actualizarProgramaAcademico(id: string, dto: ActualizarProgramaDto) {
    const programa = await this.prisma.programaAcademico.findUnique({
      where: { id },
    });
    if (!programa)
      throw new NotFoundException('Programa académico no encontrado');

    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.codigoOficialCaces !== undefined)
      data.codigoOficialCaces = dto.codigoOficialCaces;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.activo !== undefined) data.activo = dto.activo;

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.programaAcademico.update({
          where: { id },
          data,
        });
      }

      if (
        dto.duracionMinutos ||
        dto.totalPreguntas ||
        dto.notaMinimaAprobacion
      ) {
        const config = await tx.configuracionSimulador.findFirst({
          where: { programaAcademicoId: id, modalidad: 'SIMULACRO_OFICIAL' },
        });
        if (config) {
          await tx.configuracionSimulador.update({
            where: { id: config.id },
            data: {
              ...(dto.duracionMinutos
                ? { duracionMinutos: dto.duracionMinutos }
                : {}),
              ...(dto.totalPreguntas
                ? { totalPreguntas: dto.totalPreguntas }
                : {}),
              ...(dto.notaMinimaAprobacion
                ? { notaMinimaAprobacion: dto.notaMinimaAprobacion }
                : {}),
            },
          });
        }
      }

      return {
        mensaje: 'Programa académico actualizado exitosamente',
        id,
      };
    });
  }

  /**
   * Desactiva un programa académico
   */
  async eliminarProgramaAcademico(id: string) {
    const programa = await this.prisma.programaAcademico.findUnique({
      where: { id },
    });
    if (!programa) throw new NotFoundException('Programa no encontrado');

    await this.prisma.programaAcademico.update({
      where: { id },
      data: { activo: false },
    });

    return {
      mensaje: 'Programa académico desactivado correctamente',
      id,
      activo: false,
    };
  }

  /**
   * Crea un área temática en el temario activo de una carrera
   */
  async crearAreaAcademica(dto: CrearAreaDto) {
    const temario = await this.prisma.temarioVersion.findFirst({
      where: {
        OR: [
          { programaAcademicoId: dto.programaId, activo: true },
          { id: dto.programaId },
        ],
      },
      orderBy: { creadoEn: 'desc' },
    });

    if (!temario) {
      throw new NotFoundException(
        'No se encontró un temario oficial activo para el programa especificado',
      );
    }

    const area = await this.prisma.areaAcademica.create({
      data: {
        temarioVersionId: temario.id,
        nombre: dto.nombre,
        descripcion: dto.descripcion || null,
        pesoPorcentual: dto.pesoPorcentual,
      },
    });

    return {
      mensaje: 'Área académica creada exitosamente',
      area,
    };
  }

  /**
   * Actualiza nombre, descripción o peso de un área temática
   */
  async actualizarAreaAcademica(id: string, dto: ActualizarAreaDto) {
    const area = await this.prisma.areaAcademica.findUnique({ where: { id } });
    if (!area) throw new NotFoundException('Área académica no encontrada');

    const areaActualizada = await this.prisma.areaAcademica.update({
      where: { id },
      data: dto,
    });

    return {
      mensaje: 'Área académica actualizada exitosamente',
      area: areaActualizada,
    };
  }

  /**
   * Elimina un área académica si no contiene preguntas asociadas
   */
  async eliminarAreaAcademica(id: string) {
    const area = await this.prisma.areaAcademica.findUnique({
      where: { id },
      include: {
        subareasCompetencias: {
          include: { preguntas: { take: 1 } },
        },
      },
    });

    if (!area) throw new NotFoundException('Área académica no encontrada');

    const tienePreguntas = area.subareasCompetencias.some(
      (s) => s.preguntas.length > 0,
    );
    if (tienePreguntas) {
      throw new ConflictException(
        'No se puede eliminar el área porque contiene preguntas asociadas en el banco',
      );
    }

    await this.prisma.areaAcademica.delete({ where: { id } });
    return {
      mensaje: 'Área académica eliminada exitosamente',
      id,
    };
  }

  // ============================================================================
  // 6. GESTIÓN DE TRABAJADORES (PERFILES EXCLUSIVOS DE STAFF / SUPERADMIN / TESORERÍA)
  // ============================================================================

  /**
   * Lista exclusiva de trabajadores y personal administrativo
   */
  async listarTrabajadores(termino?: string, departamento?: string) {
    const whereClause: any = {};

    if (departamento) {
      whereClause.departamento = {
        contains: departamento,
        mode: 'insensitive',
      };
    }

    if (termino && termino.trim()) {
      const busqueda = termino.trim();
      whereClause.OR = [
        { cargo: { contains: busqueda, mode: 'insensitive' } },
        { departamento: { contains: busqueda, mode: 'insensitive' } },
        {
          usuario: {
            OR: [
              { nombreCompleto: { contains: busqueda, mode: 'insensitive' } },
              { correo: { contains: busqueda, mode: 'insensitive' } },
              { cedula: { contains: busqueda, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const perfiles = await this.prisma.perfilTrabajador.findMany({
      where: whereClause,
      include: {
        usuario: {
          include: {
            roles: {
              include: {
                rol: true,
              },
            },
          },
        },
      },
      orderBy: [{ activo: 'desc' }, { creadoEn: 'desc' }],
    });

    return perfiles.map((p) => {
      const u = p.usuario;
      const rolesNombres = u.roles.map((r) => r.rol.nombre);
      const nombresDivididos = u.nombreCompleto?.split(' ') || [];
      const primerNombre = u.nombre || nombresDivididos[0] || '';
      const apellidos = u.apellido || nombresDivididos.slice(1).join(' ') || '';

      return {
        id: p.id,
        usuarioId: u.id,
        cedula: u.cedula || null,
        nombre: primerNombre,
        apellido: apellidos,
        nombreCompleto: u.nombreCompleto,
        correo: u.correo,
        telefonoContacto: u.telefonoContacto || null,
        cargo: p.cargo,
        departamento: p.departamento || 'Sin asignar',
        telefonoOficina: p.telefonoOficina || null,
        fechaIngreso: p.fechaIngreso.toISOString().split('T')[0],
        activo: p.activo && u.activo,
        roles: rolesNombres,
        rolPrincipal: rolesNombres[0] || u.rol || 'STAFF',
        observaciones: p.observaciones || null,
        creadoEn: p.creadoEn.toISOString(),
      };
    });
  }

  /**
   * Obtiene el detalle de un trabajador por su ID de perfil o ID de usuario
   */
  async obtenerTrabajadorPorId(id: string) {
    const perfil = await this.prisma.perfilTrabajador.findFirst({
      where: {
        OR: [{ id }, { usuarioId: id }],
      },
      include: {
        usuario: {
          include: {
            roles: {
              include: {
                rol: true,
              },
            },
          },
        },
      },
    });

    if (!perfil) {
      throw new NotFoundException('Perfil de trabajador no encontrado');
    }

    const u = perfil.usuario;
    const rolesNombres = u.roles.map((r) => r.rol.nombre);

    return {
      id: perfil.id,
      usuarioId: u.id,
      cedula: u.cedula || null,
      nombre: u.nombre,
      apellido: u.apellido,
      nombreCompleto: u.nombreCompleto,
      correo: u.correo,
      telefonoContacto: u.telefonoContacto,
      cargo: perfil.cargo,
      departamento: perfil.departamento,
      telefonoOficina: perfil.telefonoOficina,
      fechaIngreso: perfil.fechaIngreso.toISOString().split('T')[0],
      activo: perfil.activo && u.activo,
      roles: rolesNombres,
      rolPrincipal: rolesNombres[0] || u.rol,
      observaciones: perfil.observaciones,
      creadoEn: perfil.creadoEn.toISOString(),
      actualizadoEn: perfil.actualizadoEn.toISOString(),
    };
  }

  /**
   * Registra un nuevo trabajador en el sistema
   */
  async crearTrabajador(dto: CrearTrabajadorDto) {
    const correoNormalizado = dto.correo.toLowerCase().trim();

    const usuarioExistente = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: { equals: correoNormalizado, mode: 'insensitive' } },
          ...(dto.cedula ? [{ cedula: dto.cedula.trim() }] : []),
        ],
      },
    });

    if (usuarioExistente) {
      const coincideCorreo =
        usuarioExistente.correo.toLowerCase().trim() === correoNormalizado;
      if (coincideCorreo) {
        throw new ConflictException(
          'El correo electrónico ya se encuentra registrado en el sistema. No se puede crear un trabajador con un correo existente.',
        );
      }
      throw new ConflictException(
        'El número de cédula de identidad ya se encuentra registrado en el sistema.',
      );
    }

    const valClave = validarClaveSegura(dto.contrasena);
    if (!valClave.esValida) {
      throw new BadRequestException(
        valClave.motivo ||
          'La contraseña no cumple con los requisitos de seguridad requeridos',
      );
    }

    if (dto.rol === RolNombre.ESTUDIANTE) {
      throw new BadRequestException(
        'No se puede crear un trabajador con rol ESTUDIANTE',
      );
    }

    const rolDb = await this.prisma.rol.findUnique({
      where: { nombre: dto.rol },
    });

    if (!rolDb) {
      throw new BadRequestException(
        `El rol administrativo ${dto.rol} no está configurado en el sistema`,
      );
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(dto.contrasena, salt);

    const primerNombre = dto.nombre.trim();
    const apellido = dto.apellido.trim();
    const nombreCompleto = `${primerNombre} ${apellido}`.trim();

    const resultado = await this.prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          correo: correoNormalizado,
          cedula: dto.cedula?.trim() || null,
          nombre: primerNombre,
          apellido,
          nombreCompleto,
          contrasenaHash,
          telefonoContacto: dto.telefonoContacto?.trim() || null,
          rol: dto.rol.toLowerCase(),
          correoVerificado: true,
          activo: true,
          proveedorAuth: 'local',
        },
      });

      await tx.usuarioRol.create({
        data: {
          usuarioId: nuevoUsuario.id,
          rolId: rolDb.id,
        },
      });

      let resolvedDepartamentoId: string | null = dto.departamentoId || null;
      let resolvedDepartamentoNombre: string | null = dto.departamento?.trim() || null;

      if (resolvedDepartamentoId) {
        const depto = await tx.departamento.findUnique({
          where: { id: resolvedDepartamentoId },
        });
        if (depto) {
          resolvedDepartamentoNombre = depto.nombre;
        }
      } else if (resolvedDepartamentoNombre) {
        const depto = await tx.departamento.findFirst({
          where: {
            nombre: { equals: resolvedDepartamentoNombre, mode: 'insensitive' },
          },
        });
        if (depto) {
          resolvedDepartamentoId = depto.id;
          resolvedDepartamentoNombre = depto.nombre;
        }
      }

      const nuevoPerfil = await tx.perfilTrabajador.create({
        data: {
          usuarioId: nuevoUsuario.id,
          cargo: dto.cargo.trim(),
          departamentoId: resolvedDepartamentoId,
          departamento: resolvedDepartamentoNombre,
          telefonoOficina: dto.telefonoOficina?.trim() || null,
          observaciones: dto.observaciones?.trim() || null,
          activo: true,
        },
      });

      return { nuevoUsuario, nuevoPerfil };
    });

    this.logger.log(
      `Trabajador registrado exitosamente: ${resultado.nuevoUsuario.correo} (${dto.cargo})`,
    );

    return {
      mensaje: 'Trabajador registrado exitosamente en el sistema',
      trabajador: {
        id: resultado.nuevoPerfil.id,
        usuarioId: resultado.nuevoUsuario.id,
        correo: resultado.nuevoUsuario.correo,
        nombreCompleto: resultado.nuevoUsuario.nombreCompleto,
        cargo: resultado.nuevoPerfil.cargo,
        departamento: resultado.nuevoPerfil.departamento,
        rol: dto.rol,
        activo: true,
      },
    };
  }

  /**
   * Actualiza el perfil de un trabajador y sus datos de usuario
   */
  async actualizarTrabajador(id: string, dto: ActualizarTrabajadorDto) {
    const perfil = await this.prisma.perfilTrabajador.findFirst({
      where: {
        OR: [{ id }, { usuarioId: id }],
      },
      include: {
        usuario: {
          include: {
            roles: {
              include: { rol: true },
            },
          },
        },
      },
    });

    if (!perfil) {
      throw new NotFoundException('Perfil de trabajador no encontrado');
    }

    const usuarioId = perfil.usuarioId;

    if (
      dto.correo &&
      dto.correo.toLowerCase().trim() !==
        perfil.usuario.correo.toLowerCase().trim()
    ) {
      const correoNormalizado = dto.correo.toLowerCase().trim();
      const correoExistente = await this.prisma.usuario.findFirst({
        where: {
          correo: { equals: correoNormalizado, mode: 'insensitive' },
          id: { not: usuarioId },
        },
      });
      if (correoExistente) {
        throw new ConflictException(
          'El correo electrónico ingresado ya se encuentra registrado por otro usuario.',
        );
      }
    }

    if (dto.cedula && dto.cedula.trim() !== perfil.usuario.cedula) {
      const cedulaExistente = await this.prisma.usuario.findFirst({
        where: {
          cedula: dto.cedula.trim(),
          id: { not: usuarioId },
        },
      });
      if (cedulaExistente) {
        throw new ConflictException(
          'La cédula ingresada ya pertenece a otro usuario',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const dataUsuario: any = {};
      if (dto.correo !== undefined) {
        dataUsuario.correo = dto.correo.toLowerCase().trim();
      }
      if (dto.nombre !== undefined)
        dataUsuario.nombre = dto.nombre?.trim() || null;
      if (dto.apellido !== undefined)
        dataUsuario.apellido = dto.apellido?.trim() || null;
      if (dto.nombre || dto.apellido) {
        const nom = dto.nombre?.trim() || perfil.usuario.nombre || '';
        const ape = dto.apellido?.trim() || perfil.usuario.apellido || '';
        dataUsuario.nombreCompleto = `${nom} ${ape}`.trim();
      }
      if (dto.cedula !== undefined)
        dataUsuario.cedula = dto.cedula?.trim() || null;
      if (dto.telefonoContacto !== undefined) {
        dataUsuario.telefonoContacto = dto.telefonoContacto?.trim() || null;
      }
      if (dto.activo !== undefined) dataUsuario.activo = dto.activo;

      if (dto.rol && dto.rol !== RolNombre.ESTUDIANTE) {
        const nuevoRolDb = await tx.rol.findUnique({
          where: { nombre: dto.rol },
        });

        if (nuevoRolDb) {
          dataUsuario.rol = dto.rol.toLowerCase();
          await tx.usuarioRol.deleteMany({
            where: { usuarioId },
          });
          await tx.usuarioRol.create({
            data: {
              usuarioId,
              rolId: nuevoRolDb.id,
            },
          });
        }
      }

      if (Object.keys(dataUsuario).length > 0) {
        await tx.usuario.update({
          where: { id: usuarioId },
          data: dataUsuario,
        });
      }

      const dataPerfil: any = {};
      if (dto.cargo !== undefined) dataPerfil.cargo = dto.cargo.trim();

      if (dto.departamentoId !== undefined || dto.departamento !== undefined) {
        let deptoId = dto.departamentoId || null;
        let deptoNombre = dto.departamento?.trim() || null;

        if (deptoId) {
          const d = await tx.departamento.findUnique({ where: { id: deptoId } });
          if (d) deptoNombre = d.nombre;
        } else if (deptoNombre) {
          const d = await tx.departamento.findFirst({
            where: { nombre: { equals: deptoNombre, mode: 'insensitive' } },
          });
          if (d) {
            deptoId = d.id;
            deptoNombre = d.nombre;
          }
        }
        dataPerfil.departamentoId = deptoId;
        dataPerfil.departamento = deptoNombre;
      }

      if (dto.telefonoOficina !== undefined) {
        dataPerfil.telefonoOficina = dto.telefonoOficina?.trim() || null;
      }
      if (dto.observaciones !== undefined) {
        dataPerfil.observaciones = dto.observaciones?.trim() || null;
      }
      if (dto.activo !== undefined) dataPerfil.activo = dto.activo;

      if (Object.keys(dataPerfil).length > 0) {
        await tx.perfilTrabajador.update({
          where: { id: perfil.id },
          data: dataPerfil,
        });
      }
    });

    return this.obtenerTrabajadorPorId(perfil.id);
  }

  /**
   * Alterna el estado activo/inactivo de un trabajador
   */
  async alternarEstadoTrabajador(id: string) {
    const perfil = await this.prisma.perfilTrabajador.findFirst({
      where: {
        OR: [{ id }, { usuarioId: id }],
      },
    });

    if (!perfil) {
      throw new NotFoundException('Perfil de trabajador no encontrado');
    }

    const nuevoEstado = !perfil.activo;

    await this.prisma.$transaction(async (tx) => {
      await tx.perfilTrabajador.update({
        where: { id: perfil.id },
        data: { activo: nuevoEstado },
      });
      await tx.usuario.update({
        where: { id: perfil.usuarioId },
        data: { activo: nuevoEstado },
      });
    });

    return {
      mensaje: `Trabajador ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
      id: perfil.id,
      activo: nuevoEstado,
    };
  }

  // ============================================================================
  // 9. GESTIÓN DE DEPARTAMENTOS INSTITUCIONALES (CRUD SUPERADMIN)
  // ============================================================================

  /**
   * Listar todos los departamentos con métricas de trabajadores
   */
  async listarDepartamentos(soloActivos = false) {
    return this.prisma.departamento.findMany({
      where: soloActivos ? { activo: true } : undefined,
      include: {
        _count: {
          select: { trabajadores: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Obtener detalle de un departamento institucional por ID
   */
  async obtenerDepartamentoPorId(id: string) {
    const depto = await this.prisma.departamento.findUnique({
      where: { id },
      include: {
        trabajadores: {
          include: {
            usuario: {
              select: {
                id: true,
                nombreCompleto: true,
                correo: true,
                telefonoContacto: true,
                activo: true,
              },
            },
          },
        },
        _count: {
          select: { trabajadores: true },
        },
      },
    });

    if (!depto) {
      throw new NotFoundException(`Departamento con ID "${id}" no encontrado`);
    }

    return depto;
  }

  /**
   * Crear un nuevo departamento institucional
   */
  async crearDepartamento(dto: CrearDepartamentoDto) {
    const nombreNormalizado = dto.nombre.trim();

    const deptoExistente = await this.prisma.departamento.findFirst({
      where: {
        nombre: { equals: nombreNormalizado, mode: 'insensitive' },
      },
    });

    if (deptoExistente) {
      throw new ConflictException(
        `Ya existe un departamento con el nombre "${nombreNormalizado}"`,
      );
    }

    const nuevoDepto = await this.prisma.departamento.create({
      data: {
        nombre: nombreNormalizado,
        descripcion: dto.descripcion?.trim() || null,
        activo: dto.activo ?? true,
      },
      include: {
        _count: {
          select: { trabajadores: true },
        },
      },
    });

    this.logger.log(`Departamento institucional creado: ${nuevoDepto.nombre} (${nuevoDepto.id})`);
    return nuevoDepto;
  }

  /**
   * Actualizar un departamento institucional
   */
  async actualizarDepartamento(id: string, dto: ActualizarDepartamentoDto) {
    const depto = await this.prisma.departamento.findUnique({
      where: { id },
    });

    if (!depto) {
      throw new NotFoundException(`Departamento con ID "${id}" no encontrado`);
    }

    if (dto.nombre && dto.nombre.trim().toLowerCase() !== depto.nombre.toLowerCase()) {
      const nombreNormalizado = dto.nombre.trim();
      const duplicado = await this.prisma.departamento.findFirst({
        where: {
          nombre: { equals: nombreNormalizado, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (duplicado) {
        throw new ConflictException(
          `Ya existe otro departamento con el nombre "${nombreNormalizado}"`,
        );
      }
    }

    const deptoActualizado = await this.prisma.departamento.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion?.trim() || null } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
      include: {
        _count: {
          select: { trabajadores: true },
        },
      },
    });

    // Sincronizar nombre en perfiles existentes si se modificó
    if (dto.nombre && dto.nombre.trim() !== depto.nombre) {
      await this.prisma.perfilTrabajador.updateMany({
        where: { departamentoId: id },
        data: { departamento: dto.nombre.trim() },
      });
    }

    this.logger.log(`Departamento institucional actualizado: ${deptoActualizado.nombre} (${id})`);
    return deptoActualizado;
  }

  /**
   * Eliminar o desactivar un departamento institucional
   */
  async eliminarDepartamento(id: string) {
    const depto = await this.prisma.departamento.findUnique({
      where: { id },
      include: {
        _count: { select: { trabajadores: true } },
      },
    });

    if (!depto) {
      throw new NotFoundException(`Departamento con ID "${id}" no encontrado`);
    }

    if (depto._count.trabajadores > 0) {
      const desactivado = await this.prisma.departamento.update({
        where: { id },
        data: { activo: false },
        include: {
          _count: { select: { trabajadores: true } },
        },
      });
      return {
        mensaje: `El departamento cuenta con ${depto._count.trabajadores} trabajador(es) asociado(s). Se ha desactivado para proteger el historial laboral.`,
        desactivado: true,
        departamento: desactivado,
      };
    }

    await this.prisma.departamento.delete({
      where: { id },
    });

    return {
      mensaje: `Departamento "${depto.nombre}" eliminado exitosamente`,
      id,
    };
  }
}
