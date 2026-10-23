export function obtenerDatosComerciales() {
  const planes = [
    {
      id: 'PLAN_GRATUITO_BASE',
      nombre: 'Plan Demostración Gratuito',
      descripcion:
        'Acceso de muestra con 20 preguntas formativas y un simulacro diagnóstico.',
      precioDolares: 0.0,
      duracionDiasVigencia: 365,
      limitePreguntasGratis: 20,
      accesoSimuladoresIlimitados: false,
      accesoAnaliticaAvanzada: false,
      activo: true,
    },
    {
      id: 'PLAN_PRO_MENSUAL',
      nombre: 'Suscripción Pro Mensual CACES',
      descripcion:
        'Acceso ilimitado al banco de preguntas, todos los simuladores tipo examen oficial y analítica de debilidades.',
      precioDolares: 19.99,
      duracionDiasVigencia: 30,
      limitePreguntasGratis: 99999,
      accesoSimuladoresIlimitados: true,
      accesoAnaliticaAvanzada: true,
      activo: true,
    },
  ];

  return { planes };
}
