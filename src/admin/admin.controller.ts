import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EstadoPago, EstadoPregunta, RolNombre } from '@prisma/client';
import { AdminService } from './admin.service.js';
import {
  ActivarPlanProDto,
  ActualizarAreaDto,
  ActualizarBancoCooperativaDto,
  ActualizarDepartamentoDto,
  ActualizarEstadoPreguntaDto,
  ActualizarEstudianteAdminDto,
  ActualizarPlanDto,
  ActualizarPreguntaAdminDto,
  ActualizarProgramaDto,
  ActualizarSubmoduloDto,
  ActualizarTrabajadorDto,
  CrearAreaDto,
  CrearBancoCooperativaDto,
  CrearDepartamentoDto,
  CrearEstudianteAdminDto,
  CrearPlanDto,
  CrearPreguntaAdminDto,
  CrearProgramaDto,
  CrearSubmoduloDto,
  CrearTrabajadorDto,
  RechazarPagoDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard, Roles, UsuarioActual } from '../common/index.js';
import type { UsuarioAutenticado } from '../common/interfaces/usuario-autenticado.interface.js';

@ApiTags('Administración, Personal y Operaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================================================
  // 1. GESTIÓN DE ESTUDIANTES
  // ============================================================================

  @Get('estudiantes')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar estudiantes para gestión de accesos y pagos',
    description:
      'Devuelve listado de estudiantes, su carrera, plan activo y último comprobante bancario declarado.',
  })
  async listarEstudiantes() {
    return this.adminService.listarEstudiantes();
  }

  @Get('estudiantes/:id')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Obtener detalle completo de un estudiante',
    description:
      'Consulta datos personales, historial de simulacros, suscripción y transacciones de un estudiante.',
  })
  @ApiParam({ name: 'id', description: 'ID del estudiante' })
  async obtenerEstudiante(@Param('id') id: string) {
    return this.adminService.obtenerEstudiantePorId(id);
  }

  @Post('estudiantes')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo estudiante directamente (Solo Superadmin)',
    description:
      'Crea una cuenta con rol ESTUDIANTE, asigna la carrera CACES, genera credenciales provisionales e inicializa el plan comercial seleccionado (Gratuito o Pro).',
  })
  async crearEstudiante(@Body() dto: CrearEstudianteAdminDto) {
    return this.adminService.crearEstudiante(dto);
  }

  @Patch('estudiantes/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar datos personales o carrera de un estudiante (Superadmin)',
  })
  async actualizarEstudiante(
    @Param('id') id: string,
    @Body() dto: ActualizarEstudianteAdminDto,
  ) {
    return this.adminService.actualizarEstudiante(id, dto);
  }

  @Patch('estudiantes/:id/estado')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspender o reactivar cuenta de un estudiante (Superadmin)',
  })
  async alternarEstadoEstudiante(@Param('id') id: string) {
    return this.adminService.alternarEstadoEstudiante(id);
  }

  @Patch('estudiantes/:id/activar')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar membresía Pro a un estudiante',
    description:
      'Permite a tesorería o superadmin activar directamente el plan Pro por N días y registrar opcionalmente el comprobante.',
  })
  async activarPlanPro(
    @Param('id') estudianteId: string,
    @Body() dto: ActivarPlanProDto,
    @UsuarioActual() operador: UsuarioAutenticado,
  ) {
    return this.adminService.activarPlanProEstudiante(
      estudianteId,
      dto,
      operador.id,
    );
  }

  // ============================================================================
  // 2. TESORERÍA, RECAUDACIÓN Y COMPROBANTES DE PAGO
  // ============================================================================

  @Get('pagos')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar comprobantes y pagos declarados por estudiantes',
    description:
      'Permite a Tesorería y Superadmin filtrar comprobantes bancarios por estado (PENDIENTE_VERIFICACION, APROBADA, RECHAZADA) o buscar por comprobante/estudiante.',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: EstadoPago,
    description: 'Filtrar por estado del comprobante bancario',
  })
  @ApiQuery({
    name: 'termino',
    required: false,
    description: 'Búsqueda por número de comprobante, banco, correo o cédula',
  })
  async listarPagos(
    @Query('estado') estado?: EstadoPago,
    @Query('termino') termino?: string,
  ) {
    return this.adminService.listarPagos(estado, termino);
  }

  @Get('pagos/:id')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Consultar detalle de un comprobante de pago',
  })
  async obtenerPago(@Param('id') id: string) {
    return this.adminService.obtenerPagoPorId(id);
  }

  @Patch('pagos/:id/aprobar')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar comprobante bancario y activar membresía Pro al estudiante',
    description:
      'Marca la transacción como APROBADA, registra el ID del tesorero/admin que aprueba y activa la suscripción según la duración del plan.',
  })
  async aprobarPago(
    @Param('id') transaccionId: string,
    @UsuarioActual() operador: UsuarioAutenticado,
  ) {
    return this.adminService.aprobarPago(transaccionId, operador.id);
  }

  @Patch('pagos/:id/rechazar')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rechazar comprobante bancario con motivo de observación',
    description:
      'Marca la transacción como RECHAZADA, cancela la suscripción pendiente y guarda el motivo indicado por Tesorería.',
  })
  async rechazarPago(
    @Param('id') transaccionId: string,
    @Body() dto: RechazarPagoDto,
    @UsuarioActual() operador: UsuarioAutenticado,
  ) {
    return this.adminService.rechazarPago(
      transaccionId,
      dto.motivo,
      operador.id,
    );
  }

  // ============================================================================
  // 3. CRUD DEL BANCO DE PREGUNTAS
  // ============================================================================

  @Get('preguntas')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar banco de preguntas para auditoría docente con filtros avanzados',
  })
  @ApiQuery({ name: 'programaId', required: false, description: 'Filtrar por carrera/programa' })
  @ApiQuery({ name: 'submoduloId', required: false, description: 'Filtrar por ID del submódulo académico' })
  @ApiQuery({ name: 'areaId', required: false, description: 'Filtrar por ID del área temática' })
  @ApiQuery({ name: 'subareaId', required: false, description: 'Filtrar por código o ID de la subárea' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoPregunta, description: 'Filtrar por estado de revisión' })
  @ApiQuery({ name: 'termino', required: false, description: 'Búsqueda por texto en enunciado o código público' })
  async listarPreguntas(
    @Query('programaId') programaId?: string,
    @Query('submoduloId') submoduloId?: string,
    @Query('areaId') areaId?: string,
    @Query('subareaId') subareaId?: string,
    @Query('estado') estado?: EstadoPregunta,
    @Query('termino') termino?: string,
  ) {
    return this.adminService.listarPreguntasAdmin({
      programaId,
      submoduloId,
      areaId,
      subareaId,
      estado,
      termino,
    });
  }

  @Get('preguntas/:id')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Obtener detalle completo de una pregunta por ID o código público',
  })
  async obtenerPregunta(@Param('id') id: string) {
    return this.adminService.obtenerPreguntaPorId(id);
  }

  @Post('preguntas')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva pregunta en el banco de evaluación (Solo Superadmin)',
    description:
      'Registra la pregunta, su versión 1 en estado BORRADOR, las opciones de respuesta y la referencia bibliográfica oficial.',
  })
  async crearPregunta(
    @Body() dto: CrearPreguntaAdminDto,
    @UsuarioActual() creador: UsuarioAutenticado,
  ) {
    return this.adminService.crearPregunta(dto, creador.id);
  }

  @Patch('preguntas/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar contenido pedagógico, enunciado u opciones de una pregunta (Solo Superadmin)',
  })
  async actualizarPregunta(
    @Param('id') id: string,
    @Body() dto: ActualizarPreguntaAdminDto,
    @UsuarioActual() revisor: UsuarioAutenticado,
  ) {
    return this.adminService.actualizarPregunta(id, dto, revisor?.id);
  }

  @Patch('preguntas/:id/estado')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado de revisión de una pregunta (PUBLICADA, APROBADA, etc.)',
  })
  async actualizarEstadoPregunta(
    @Param('id') preguntaId: string,
    @Body() dto: ActualizarEstadoPreguntaDto,
    @UsuarioActual() revisor: UsuarioAutenticado,
  ) {
    return this.adminService.actualizarEstadoPregunta(
      preguntaId,
      dto.estado,
      revisor?.id,
    );
  }

  @Delete('preguntas/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar pregunta o retirarla del banco (Solo Superadmin)',
    description:
      'Si la pregunta posee respuestas en simulacros históricos se marca como RETIRADA; de lo contrario se elimina físicamente.',
  })
  async eliminarPregunta(@Param('id') id: string) {
    return this.adminService.eliminarPregunta(id);
  }

  // ============================================================================
  // 4. CRUD DE PLANES DE SUSCRIPCIÓN COMERCIAL
  // ============================================================================

  @Get('planes')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar todos los planes comerciales para administración',
  })
  async listarPlanes() {
    return this.adminService.listarPlanesAdmin();
  }

  @Get('planes/:id')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Obtener detalle de un plan comercial',
  })
  async obtenerPlan(@Param('id') id: string) {
    return this.adminService.obtenerPlanAdmin(id);
  }

  @Post('planes')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo plan de suscripción comercial (Solo Superadmin)',
  })
  async crearPlan(@Body() dto: CrearPlanDto) {
    return this.adminService.crearPlan(dto);
  }

  @Patch('planes/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar precio, días o características de un plan (Solo Superadmin)',
  })
  async actualizarPlan(
    @Param('id') id: string,
    @Body() dto: ActualizarPlanDto,
  ) {
    return this.adminService.actualizarPlan(id, dto);
  }

  @Delete('planes/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar o desactivar un plan comercial (Solo Superadmin)',
  })
  async eliminarPlan(@Param('id') id: string) {
    return this.adminService.eliminarPlan(id);
  }

  // ============================================================================
  // 5. CRUD DE PROGRAMAS ACADÉMICOS Y ÁREAS TEMÁTICAS CACES
  // ============================================================================

  @Post('programas')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva carrera académica CACES y su simulador oficial (Solo Superadmin)',
  })
  async crearPrograma(@Body() dto: CrearProgramaDto) {
    return this.adminService.crearProgramaAcademico(dto);
  }

  @Patch('programas/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar carrera académica o configuración del examen (Solo Superadmin)',
  })
  async actualizarPrograma(
    @Param('id') id: string,
    @Body() dto: ActualizarProgramaDto,
  ) {
    return this.adminService.actualizarProgramaAcademico(id, dto);
  }

  @Delete('programas/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar carrera académica CACES (Solo Superadmin)',
  })
  async eliminarPrograma(@Param('id') id: string) {
    return this.adminService.eliminarProgramaAcademico(id);
  }

  @Get('areas')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar árbol completo de áreas y subáreas académicas oficiales CACES',
    description:
      'Devuelve la jerarquía académica completa (Programa -> Áreas -> Subáreas/Competencias con conteo de preguntas).',
  })
  @ApiQuery({ name: 'programaId', required: false, description: 'Filtrar por ID de carrera/programa' })
  async listarAreas(@Query('programaId') programaId?: string) {
    return this.adminService.listarEstructuraAcademica(programaId);
  }

  @Post('areas')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear área temática oficial para una carrera CACES (Solo Superadmin)',
  })
  async crearArea(@Body() dto: CrearAreaDto) {
    return this.adminService.crearAreaAcademica(dto);
  }

  @Patch('areas/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar nombre o peso porcentual de un área temática (Solo Superadmin)',
  })
  async actualizarArea(
    @Param('id') id: string,
    @Body() dto: ActualizarAreaDto,
  ) {
    return this.adminService.actualizarAreaAcademica(id, dto);
  }

  @Delete('areas/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar área temática si no posee preguntas asociadas (Solo Superadmin)',
  })
  async eliminarArea(@Param('id') id: string) {
    return this.adminService.eliminarAreaAcademica(id);
  }

  // ============================================================================
  // 5.1 GESTIÓN DE SUBMÓDULOS ACADÉMICOS (NIVEL 2 DIRECTO)
  // ============================================================================

  @Get('submodulos')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar submódulos académicos con filtros y conteo de preguntas',
    description:
      'Devuelve el catálogo de submódulos (Nivel 2), filtrable por módulo/carrera y por estado activo/inactivo.',
  })
  @ApiQuery({
    name: 'programaId',
    required: false,
    description: 'Filtrar por ID de carrera/módulo (ej. MEDICINA, ENFERMERIA, ODONTOLOGIA)',
  })
  @ApiQuery({
    name: 'activo',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo (true/false)',
  })
  async listarSubmodulos(
    @Query('programaId') programaId?: string,
    @Query('activo') activo?: string,
  ) {
    const estadoActivo =
      activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.adminService.listarSubmodulos(programaId, estadoActivo);
  }

  @Get('submodulos/:id')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Consultar detalle de un submódulo académico por identificador',
  })
  @ApiParam({ name: 'id', description: 'ID del submódulo' })
  async obtenerSubmodulo(@Param('id') id: string) {
    return this.adminService.obtenerSubmoduloPorId(id);
  }

  @Post('submodulos')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo submódulo académico (Solo Superadmin)',
    description:
      'Registra un submódulo asociado obligatoriamente a un módulo existente, validando que no haya nombres duplicados en ese módulo.',
  })
  async crearSubmodulo(@Body() dto: CrearSubmoduloDto) {
    return this.adminService.crearSubmodulo(dto);
  }

  @Patch('submodulos/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar nombre, descripción o configuración de un submódulo (Solo Superadmin)',
  })
  async actualizarSubmodulo(
    @Param('id') id: string,
    @Body() dto: ActualizarSubmoduloDto,
  ) {
    return this.adminService.actualizarSubmodulo(id, dto);
  }

  @Patch('submodulos/:id/estado')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo de un submódulo académico (Solo Superadmin)',
  })
  async alternarEstadoSubmodulo(@Param('id') id: string) {
    return this.adminService.alternarEstadoSubmodulo(id);
  }

  @Delete('submodulos/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar submódulo académico si no contiene preguntas asociadas (Solo Superadmin)',
  })
  async eliminarSubmodulo(@Param('id') id: string) {
    return this.adminService.eliminarSubmodulo(id);
  }

  // ============================================================================
  // 6. GESTIÓN DE TRABAJADORES (STAFF / PERSONAL ADMINISTRATIVO)
  // ============================================================================

  @Get('trabajadores')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar equipo de trabajadores y personal administrativo',
    description:
      'Devuelve únicamente a los trabajadores del sistema (tabla PerfilTrabajador), permitiendo búsquedas rápidas y aisladas de los estudiantes.',
  })
  @ApiQuery({
    name: 'termino',
    required: false,
    description: 'Búsqueda por nombre, correo, cédula o cargo',
  })
  @ApiQuery({
    name: 'departamento',
    required: false,
    description: 'Filtro por departamento o área',
  })
  async listarTrabajadores(
    @Query('termino') termino?: string,
    @Query('departamento') departamento?: string,
  ) {
    return this.adminService.listarTrabajadores(termino, departamento);
  }

  @Get('trabajadores/:id')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Obtener detalle de un trabajador por ID',
  })
  async obtenerTrabajador(@Param('id') id: string) {
    return this.adminService.obtenerTrabajadorPorId(id);
  }

  @Post('trabajadores')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo trabajador en el sistema (Solo Superadmin)',
    description:
      'Crea la cuenta de usuario, asigna credenciales seguras, rol de staff y genera el registro en la tabla de PerfilTrabajador.',
  })
  async crearTrabajador(@Body() dto: CrearTrabajadorDto) {
    return this.adminService.crearTrabajador(dto);
  }

  @Patch('trabajadores/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar perfil y datos de un trabajador (Solo Superadmin)',
  })
  async actualizarTrabajador(
    @Param('id') id: string,
    @Body() dto: ActualizarTrabajadorDto,
  ) {
    return this.adminService.actualizarTrabajador(id, dto);
  }

  @Patch('trabajadores/:id/estado')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar o desactivar un trabajador (Solo Superadmin)',
  })
  async alternarEstadoTrabajador(@Param('id') id: string) {
    return this.adminService.alternarEstadoTrabajador(id);
  }

  // ============================================================================
  // 7. GESTIÓN DE DEPARTAMENTOS INSTITUCIONALES (CRUD SUPERADMIN)
  // ============================================================================

  @Get('departamentos')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar departamentos institucionales',
    description: 'Devuelve todos los departamentos y la cantidad de trabajadores asignados a cada uno.',
  })
  @ApiQuery({
    name: 'soloActivos',
    required: false,
    type: Boolean,
    description: 'Filtrar únicamente departamentos activos para asignación',
  })
  async listarDepartamentos(@Query('soloActivos') soloActivos?: string) {
    const filtrarActivos = soloActivos === 'true';
    return this.adminService.listarDepartamentos(filtrarActivos);
  }

  @Get('departamentos/:id')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Obtener detalle de un departamento institucional por ID',
  })
  async obtenerDepartamento(@Param('id') id: string) {
    return this.adminService.obtenerDepartamentoPorId(id);
  }

  @Post('departamentos')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo departamento institucional (Solo Superadmin)',
  })
  async crearDepartamento(@Body() dto: CrearDepartamentoDto) {
    return this.adminService.crearDepartamento(dto);
  }

  @Patch('departamentos/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar nombre o descripción de un departamento (Solo Superadmin)',
  })
  async actualizarDepartamento(
    @Param('id') id: string,
    @Body() dto: ActualizarDepartamentoDto,
  ) {
    return this.adminService.actualizarDepartamento(id, dto);
  }

  @Delete('departamentos/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar o desactivar un departamento (Solo Superadmin)',
    description: 'Si el departamento tiene trabajadores asignados se desactiva; si no tiene ninguno se elimina permanentemente.',
  })
  async eliminarDepartamento(@Param('id') id: string) {
    return this.adminService.eliminarDepartamento(id);
  }

  // ============================================================================
  // 7. ENTIDADES FINANCIERAS (BANCOS Y COOPERATIVAS)
  // ============================================================================

  @Get('bancos-cooperativas')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @ApiOperation({
    summary: 'Listar entidades financieras registradas (Superadmin / Tesorería)',
    description: 'Permite consultar bancos y cooperativas con conteo de transacciones.',
  })
  async listarBancosCooperativas(@Query('activo') activo?: string) {
    const filtrarActivo =
      activo !== undefined ? activo === 'true' : undefined;
    return this.adminService.listarBancosCooperativas(filtrarActivo);
  }

  @Post('bancos-cooperativas')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo banco o cooperativa oficial (Superadmin / Tesorería)',
    description: 'Permite incorporar una nueva entidad al catálogo cuando se detecta recurrencia en pagos declarados.',
  })
  async crearBancoCooperativa(@Body() dto: CrearBancoCooperativaDto) {
    return this.adminService.crearBancoCooperativa(dto);
  }

  @Patch('bancos-cooperativas/:id')
  @Roles(RolNombre.SUPERADMIN, RolNombre.TESORERIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar entidad financiera (Superadmin / Tesorería)',
    description: 'Modifica nombre, tipo o disponibilidad en combos.',
  })
  async actualizarBancoCooperativa(
    @Param('id') id: string,
    @Body() dto: ActualizarBancoCooperativaDto,
  ) {
    return this.adminService.actualizarBancoCooperativa(id, dto);
  }

  @Delete('bancos-cooperativas/:id')
  @Roles(RolNombre.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar o desactivar una entidad financiera (Solo Superadmin)',
    description: 'Si cuenta con transacciones históricas se desactiva; si no tiene uso se elimina físicamente.',
  })
  async eliminarBancoCooperativa(@Param('id') id: string) {
    return this.adminService.eliminarBancoCooperativa(id);
  }
}
