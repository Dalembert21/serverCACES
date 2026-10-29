export enum RolNombre {
  SUPERADMIN = 'SUPERADMIN',
  TESORERIA = 'TESORERIA',
  ESTUDIANTE = 'ESTUDIANTE',
}

export interface UsuarioSeed {
  correo: string;
  contrasenaHash: string;
  nombreCompleto: string;
  rol: RolNombre;
  correoVerificado: boolean;
}

export async function obtenerDatosSeguridad() {
  const roles = [
    {
      nombre: RolNombre.SUPERADMIN,
      descripcion:
        'Administrador supremo con control total de la plataforma y gestión de administradores',
    },
    {
      nombre: RolNombre.TESORERIA,
      descripcion:
        'Encargado de verificar cobros, validar transferencias y activar cuentas/suscripciones',
    },
    {
      nombre: RolNombre.ESTUDIANTE,
      descripcion:
        'Estudiante con acceso a simuladores, diagnósticos y prácticas',
    },
  ];

  const usuarios: UsuarioSeed[] = [];

  return { roles, usuarios };
}
