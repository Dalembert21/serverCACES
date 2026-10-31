export function obtenerDatosComerciales() {
  const planes = [
    {
      id: 'PLAN_GRATUITO_BASE',
      nombre: 'Acceso Gratuito',
      descripcion:
        'Evaluación diagnóstica inicial sin costo para conocer el sistema. Incluye 20 reactivos con justificación y muestra de simulador.',
      precioDolares: 0.0,
      duracionDiasVigencia: 365,
      limitePreguntasGratis: 20,
      accesoSimuladoresIlimitados: false,
      accesoAnaliticaAvanzada: false,
      activo: true,
    },
    {
      id: 'PLAN_PRO_MENSUAL',
      nombre: 'Suscripción Mensual Pro',
      descripcion:
        'Preparación intensiva individual con renovación mensual flexible. Banco ilimitado de reactivos, simuladores tipo examen oficial y justificaciones del MSP.',
      precioDolares: 14.99,
      duracionDiasVigencia: 30,
      limitePreguntasGratis: 99999,
      accesoSimuladoresIlimitados: true,
      accesoAnaliticaAvanzada: true,
      activo: true,
    },
    {
      id: 'PLAN_TRIMESTRAL_PRO',
      nombre: 'Pase CACES Trimestral',
      descripcion:
        'Recomendado — Ahorro del 25%. Ciclo estructurado de 90 días para el internado y la recta final del examen. Acceso ilimitado, resúmenes imprimibles y soporte académico.',
      precioDolares: 34.99,
      duracionDiasVigencia: 90,
      limitePreguntasGratis: 99999,
      accesoSimuladoresIlimitados: true,
      accesoAnaliticaAvanzada: true,
      activo: true,
    },
    {
      id: 'PLAN_DUO_CACES',
      nombre: 'Plan Dúo CACES',
      descripcion:
        'Parejas de Estudio: Dos cuentas Pro 100% independientes con correo y clave propia ($9.99/mes por estudiante en un solo pago de $19.99). Sin mezclar telemetría.',
      precioDolares: 19.99,
      duracionDiasVigencia: 30,
      limitePreguntasGratis: 99999,
      accesoSimuladoresIlimitados: true,
      accesoAnaliticaAvanzada: true,
      activo: true,
    },
  ];

  const departamentos = [
    {
      nombre: 'Tesorería',
      descripcion: 'Gestión y auditoría de recaudación, validación de transferencias bancarias y emisión de accesos.',
      activo: true,
    },
    {
      nombre: 'Dirección Tecnológica',
      descripcion: 'Infraestructura en la nube, plataforma de simulación, seguridad y desarrollo continuo.',
      activo: true,
    },
    {
      nombre: 'Coordinación Académica',
      descripcion: 'Diseño curricular, validación de bancos de reactivos según guías CACES y MSP Ecuador.',
      activo: true,
    },
    {
      nombre: 'Auditoría y Soporte',
      descripcion: 'Atención a postulantes, control de calidad operativa y mesa de ayuda institucional.',
      activo: true,
    },
    {
      nombre: 'Dirección General y TI',
      descripcion: 'Supervisión integral de operaciones institucionales y tecnología de la información.',
      activo: true,
    },
  ];

  const bancosCooperativas = [
    {
      nombre: 'Banco Pichincha',
      tipo: 'BANCO' as const,
      activo: true,
    },
    {
      nombre: 'Banco Guayaquil',
      tipo: 'BANCO' as const,
      activo: true,
    },
  ];

  return { planes, departamentos, bancosCooperativas };
}
