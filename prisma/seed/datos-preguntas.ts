export function obtenerDatosPreguntas() {
  // Banco de preguntas vacío: las preguntas son administradas y creadas manualmente por los usuarios en la plataforma.
  const preguntasMedicina: any[] = [];
  const preguntasOdontologia: any[] = [];
  const preguntasEnfermeria: any[] = [];

  return { preguntasMedicina, preguntasOdontologia, preguntasEnfermeria };
}
