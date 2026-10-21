export function obtenerDatosAcademicos() {
  const examen = {
    codigo: 'CACES_EC',
    nombre: 'Examen de Habilitación para el Ejercicio Profesional (CACES)',
    pais: 'EC',
  };

  const programas = [
    {
      codigo: 'MEDICINA',
      nombre: 'Medicina Humana',
      descripcion:
        'Preparación integral para el examen CACES de Medicina Humana con casos clínicos y razonamiento diagnóstico.',
      areas: [
        {
          nombre: 'Medicina Interna',
          competencias: [
            {
              codigo: 'MED-INT-01',
              descripcion:
                'Diagnóstico y manejo terapéutico de enfermedades cardiovasculares y metabólicas prevalentes.',
              temas: [
                {
                  nombre: 'Hipertensión Arterial y Síndrome Coronario',
                  subtemas: ['Estratificación de riesgo', 'Crisis hipertensivas'],
                },
                {
                  nombre: 'Diabetes Mellitus tipo 2 y Complicaciones Agudas',
                  subtemas: ['Cetoacidosis diabética', 'Manejo insulínico'],
                },
              ],
            },
          ],
        },
        {
          nombre: 'Pediatría',
          competencias: [
            {
              codigo: 'PED-01',
              descripcion:
                'Evaluación del crecimiento, desarrollo e infecciones prevalentes en la infancia.',
              temas: [
                {
                  nombre: 'Infecciones Respiratorias Agudas Bajas en Pediatría',
                  subtemas: ['Bronquiolitis', 'Neumonía adquirida en la comunidad'],
                },
              ],
            },
          ],
        },
      ],
      simuladores: [
        {
          titulo: 'Simulacro Diagnóstico Rápido - Medicina',
          descripcion: 'Evaluación rápida de 30 preguntas para medir el nivel base del estudiante.',
          duracionMinutos: 45,
          totalPreguntas: 30,
        },
        {
          titulo: 'Simulacro Oficial CACES - Medicina Humana',
          descripcion: 'Simulación completa con condiciones reales de tiempo y dificultad oficial.',
          duracionMinutos: 240,
          totalPreguntas: 150,
        },
      ],
    },
    {
      codigo: 'ODONTOLOGIA',
      nombre: 'Odontología',
      descripcion:
        'Preparación para el examen CACES de Odontología con énfasis en diagnóstico clínico, operatoria y cirugía bucal.',
      areas: [
        {
          nombre: 'Cirugía Bucal y Maxilofacial',
          competencias: [
            {
              codigo: 'ODON-CIR-01',
              descripcion:
                'Procedimientos quirúrgicos ambulatorios, farmacología y manejo de urgencias odontológicas.',
              temas: [
                {
                  nombre: 'Exodoncia Compleja y Manejo de Infecciones Odontogénicas',
                  subtemas: ['Terceros molares retenidos', 'Angina de Ludwig'],
                },
              ],
            },
          ],
        },
        {
          nombre: 'Periodoncia y Endodoncia',
          competencias: [
            {
              codigo: 'ODON-PERIO-01',
              descripcion: 'Diagnóstico y tratamiento de patologías pulpares y periodontales.',
              temas: [
                {
                  nombre: 'Periodontitis y Lesiones Endoperiodontales',
                  subtemas: ['Clasificación AAP 2017', 'Urgencias pulpares'],
                },
              ],
            },
          ],
        },
      ],
      simuladores: [
        {
          titulo: 'Simulacro Diagnóstico - Odontología',
          descripcion: 'Evaluación de diagnóstico odontológico de 30 preguntas.',
          duracionMinutos: 45,
          totalPreguntas: 30,
        },
        {
          titulo: 'Simulacro Oficial CACES - Odontología',
          descripcion: 'Simulador completo con tiempo y distribución de competencias CACES.',
          duracionMinutos: 240,
          totalPreguntas: 150,
        },
      ],
    },
    {
      codigo: 'ENFERMERIA',
      nombre: 'Enfermería',
      descripcion:
        'Preparación para el examen CACES de Enfermería: cuidados clínicos, materno-infantil y gestión del cuidado.',
      areas: [
        {
          nombre: 'Cuidados de Enfermería en el Adulto y Adulto Mayor',
          competencias: [
            {
              codigo: 'ENF-ADUL-01',
              descripcion:
                'Aplicación del Proceso de Atención de Enfermería (PAE) en pacientes hospitalizados y críticos.',
              temas: [
                {
                  nombre: 'Administración Segura de Medicamentos y Cuidados Intensivos',
                  subtemas: ['Cálculo de dosis', 'Manejo de accesos venosos'],
                },
              ],
            },
          ],
        },
        {
          nombre: 'Salud Materno-Infantil y Comunitaria',
          competencias: [
            {
              codigo: 'ENF-MAT-01',
              descripcion:
                'Atención integral de enfermería durante el embarazo, parto, puerperio y control del niño sano.',
              temas: [
                {
                  nombre: 'Control Prenatal, Score MAMÁ y Manejo de Claves Obstétricas',
                  subtemas: ['Clave Roja', 'Clave Azul'],
                },
              ],
            },
          ],
        },
      ],
      simuladores: [
        {
          titulo: 'Simulacro Diagnóstico - Enfermería',
          descripcion: 'Diagnóstico inicial de 30 preguntas para enfermería.',
          duracionMinutos: 45,
          totalPreguntas: 30,
        },
        {
          titulo: 'Simulacro Oficial CACES - Enfermería',
          descripcion: 'Simulador completo de 150 preguntas ajustado al perfil CACES.',
          duracionMinutos: 240,
          totalPreguntas: 150,
        },
      ],
    },
  ];

  return { examen, programas };
}
