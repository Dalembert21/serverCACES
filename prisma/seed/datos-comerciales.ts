export function obtenerDatosComerciales() {
  const planes = [
    {
      codigo: 'GRATUITO',
      nombre: 'Plan Demostración Gratuito',
      descripcion:
        'Acceso de muestra con preguntas limitadas y un simulacro diagnóstico.',
      precioCentavos: 0,
      moneda: 'USD',
      periodoDias: 365,
      limitePreguntasDiarias: 30,
      permiteSimuladorReal: false,
      permiteAnalisisAvanzado: false,
      activo: true,
    },
    {
      codigo: 'PRO_MENSUAL',
      nombre: 'Suscripción Pro Mensual CACES',
      descripcion:
        'Acceso ilimitado al banco de preguntas, todos los simuladores tipo examen oficial y analítica de debilidades.',
      precioCentavos: 1999, // $19.99 USD
      moneda: 'USD',
      periodoDias: 30,
      limitePreguntasDiarias: null,
      permiteSimuladorReal: true,
      permiteAnalisisAvanzado: true,
      activo: true,
    },
  ];

  return { planes };
}
