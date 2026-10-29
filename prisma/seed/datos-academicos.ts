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
            {
              codigo: 'MED-CARDIO-01',
              descripcion: 'Cardiología clínica y manejo de arritmias e insuficiencia cardíaca.',
              temas: [
                {
                  nombre: 'Cardiología',
                  subtemas: ['Insuficiencia cardíaca aguda y crónica', 'Fibrilación auricular'],
                },
              ],
            },
            {
              codigo: 'MED-NEUMO-01',
              descripcion: 'Neumología y patología respiratoria del adulto.',
              temas: [
                {
                  nombre: 'Neumología',
                  subtemas: ['EPOC y Asma bronquial', 'Tromboembolismo pulmonar'],
                },
              ],
            },
            {
              codigo: 'MED-NEFRO-01',
              descripcion: 'Nefrología y trastornos hidroelectrolíticos.',
              temas: [
                {
                  nombre: 'Nefrología',
                  subtemas: ['Lesión renal aguda', 'Enfermedad renal crónica'],
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
            {
              codigo: 'PED-NEO-01',
              descripcion: 'Neonatología y adaptación neonatal inmediata.',
              temas: [
                {
                  nombre: 'Neonatología',
                  subtemas: ['Reanimación neonatal', 'Ictericia neonatal y sepsis'],
                },
              ],
            },
            {
              codigo: 'PED-INF-01',
              descripcion: 'Infectología pediátrica y enfermedades exantemáticas.',
              temas: [
                {
                  nombre: 'Infectología Pediátrica',
                  subtemas: ['Exantemas infantiles', 'Síndrome febril sin foco'],
                },
              ],
            },
          ],
        },
        {
          nombre: 'Gíneco-obstetricia',
          competencias: [
            {
              codigo: 'GIN-OBS-01',
              descripcion: 'Control prenatal, complicaciones del embarazo y claves obstétricas MSP.',
              temas: [
                {
                  nombre: 'Control Prenatal y Alto Riesgo Obstétrico',
                  subtemas: ['Trastornos hipertensivos del embarazo', 'Preeclampsia y Eclampsia'],
                },
                {
                  nombre: 'Hemorragias de la Primera y Segunda Mitad del Embarazo',
                  subtemas: ['Placenta previa', 'Desprendimiento prematuro de placenta'],
                },
              ],
            },
            {
              codigo: 'GIN-GEN-01',
              descripcion: 'Ginecología general, patología benigna/maligna y anticoncepción.',
              temas: [
                {
                  nombre: 'Ginecología General y Salud Reproductiva',
                  subtemas: ['Cáncer de cuello uterino y VPH', 'Planificación familiar'],
                },
              ],
            },
          ],
        },
        {
          nombre: 'Cirugía',
          competencias: [
            {
              codigo: 'CIR-GEN-01',
              descripcion: 'Abdomen agudo quirúrgico y patología gastrointestinal de urgencia.',
              temas: [
                {
                  nombre: 'Abdomen Agudo Quirúrgico',
                  subtemas: ['Apendicitis aguda', 'Colecistitis aguda y coledocolitiasis'],
                },
              ],
            },
            {
              codigo: 'CIR-ORL-01',
              descripcion: 'Otorrinolaringología básica y patología de cabeza y cuello.',
              temas: [
                {
                  nombre: 'Otorrinolaringología',
                  subtemas: ['Epistaxis', 'Otitis media y sinusitis'],
                },
              ],
            },
            {
              codigo: 'CIR-TRAUMA-01',
              descripcion: 'Traumatología, ortopedia y atención inicial del politraumatizado (ATLS).',
              temas: [
                {
                  nombre: 'Traumatología y Ortopedia',
                  subtemas: ['Manejo de fracturas expuestas', 'Luxaciones y esguinces'],
                },
              ],
            },
            {
              codigo: 'CIR-OFTAL-01',
              descripcion: 'Oftalmología básica y urgencias oculares.',
              temas: [
                {
                  nombre: 'Oftalmología',
                  subtemas: ['Ojo rojo', 'Trauma ocular y glaucoma agudo'],
                },
              ],
            },
          ],
        },
        {
          nombre: 'Salud Mental',
          competencias: [
            {
              codigo: 'SM-PSI-01',
              descripcion: 'Diagnóstico y abordaje inicial de trastornos psiquiátricos prevalentes y urgencias.',
              temas: [
                {
                  nombre: 'Trastornos del Ánimo y Ansiedad',
                  subtemas: ['Trastorno depresivo mayor', 'Crisis de angustia y pánico'],
                },
                {
                  nombre: 'Urgencias Psiquiátricas',
                  subtemas: ['Riesgo suicida y agitación psicomotriz', 'Intoxicación y abstinencia'],
                },
              ],
            },
          ],
        },
        {
          nombre: 'Salud Pública',
          competencias: [
            {
              codigo: 'SP-EPI-01',
              descripcion: 'Epidemiología, vigilancia sanitaria y Modelo de Atención Integral en Salud (MAIS-FCI).',
              temas: [
                {
                  nombre: 'Epidemiología y Vigilancia en Salud',
                  subtemas: ['Diseños epidemiológicos', 'Indicadores de salud y brotes'],
                },
                {
                  nombre: 'Atención Primaria de Salud y MAIS-FCI',
                  subtemas: ['Niveles de atención', 'Estrategias de inmunización MSP'],
                },
              ],
            },
          ],
        },
        {
          nombre: 'Bioética',
          competencias: [
            {
              codigo: 'BIO-MED-01',
              descripcion: 'Principios bioéticos, consentimiento informado, deontología médica y medicina legal.',
              temas: [
                {
                  nombre: 'Bioética y Consentimiento Informado',
                  subtemas: ['Principios de Beauchamp y Childress', 'Secreto profesional y autonomía'],
                },
                {
                  nombre: 'Medicina Legal y Documentación Médica',
                  subtemas: ['Certificados de defunción y lesiones', 'Mala práctica y marco normativo ecuatoriano'],
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
