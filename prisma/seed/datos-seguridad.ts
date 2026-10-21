import * as bcrypt from 'bcryptjs';
import { RolNombre } from '@prisma/client';

export async function obtenerDatosSeguridad() {
  const salt = await bcrypt.genSalt(10);
  const contrasenaComunHash = await bcrypt.hash('CacesSeguro2026!', salt);

  const roles = [
    {
      nombre: RolNombre.ADMIN,
      descripcion: 'Administrador total de la plataforma y del catálogo académico',
    },
    {
      nombre: RolNombre.ESTUDIANTE,
      descripcion: 'Estudiante con acceso a simuladores, diagnósticos y prácticas',
    },
    {
      nombre: RolNombre.REVISOR_ACADEMICO,
      descripcion: 'Docente / especialista encargado de revisar y publicar preguntas',
    },
    {
      nombre: RolNombre.TUTOR,
      descripcion: 'Tutor de seguimiento y planes de estudio personalizados',
    },
  ];

  const usuarios = [
    {
      correo: 'admin@caces-prep.ec',
      contrasenaHash: contrasenaComunHash,
      nombreCompleto: 'Dr. Administrador CACES',
      rol: RolNombre.ADMIN,
      correoVerificado: true,
    },
    {
      correo: 'medicina.demo@caces-prep.ec',
      contrasenaHash: contrasenaComunHash,
      nombreCompleto: 'Estudiante Medicina Demo',
      rol: RolNombre.ESTUDIANTE,
      correoVerificado: true,
    },
    {
      correo: 'odontologia.demo@caces-prep.ec',
      contrasenaHash: contrasenaComunHash,
      nombreCompleto: 'Estudiante Odontología Demo',
      rol: RolNombre.ESTUDIANTE,
      correoVerificado: true,
    },
    {
      correo: 'enfermeria.demo@caces-prep.ec',
      contrasenaHash: contrasenaComunHash,
      nombreCompleto: 'Estudiante Enfermería Demo',
      rol: RolNombre.ESTUDIANTE,
      correoVerificado: true,
    },
    {
      correo: 'revisor.academico@caces-prep.ec',
      contrasenaHash: contrasenaComunHash,
      nombreCompleto: 'Dra. Revisora Académica',
      rol: RolNombre.REVISOR_ACADEMICO,
      correoVerificado: true,
    },
  ];

  return { roles, usuarios };
}
