import {
  DificultadPregunta,
  EstadoPregunta,
  TipoPregunta,
} from '@prisma/client';

export function obtenerDatosPreguntas() {
  const preguntasMedicina = [
    {
      codigoPublico: 'MED-HTA-001',
      temaNombre: 'Hipertensión Arterial y Síndrome Coronario',
      enunciado:
        'Paciente masculino de 58 años, hipertenso con tratamiento irregular, acude a emergencia por dolor retroesternal opresivo de 2 horas de evolución, irradiado a mandíbula y brazo izquierdo, acompañado de diaforesis. En el electrocardiograma se observa elevación del segmento ST de 3 mm en derivaciones V1 a V4. La presión arterial es de 145/90 mmHg, frecuencia cardíaca 88 lpm. ¿Cuál es la conducta terapéutica inicial de mayor prioridad?',
      explicacionPedagogica:
        'El cuadro corresponde a un Síndrome Coronario Agudo con elevación del segmento ST (SCACEST) de cara anterior. La prioridad absoluta es la terapia de reperfusión inmediata (angioplastia coronaria primaria o fibrinolisis si el tiempo de traslado a sala de hemodinamia supera los 120 minutos), junto con la administración inmediata de antiagregación plaquetaria dual y anticoagulación.',
      dificultad: DificultadPregunta.MEDIA,
      tipo: TipoPregunta.CASO_CLINICO,
      estado: EstadoPregunta.PUBLICADA,
      referencia: {
        fuente: 'Guía ESC sobre el tratamiento del infarto agudo de miocardio',
        autor: 'Sociedad Europea de Cardiología (ESC)',
        anio: 2023,
        referenciaBibliografica:
          'Ibanez B, et al. Guía ESC 2023 para el manejo de los síndromes coronarios agudos. Rev Esp Cardiol. 2024;77(3):245-256.',
        tipoLicencia: 'REFERENCIA_ACADEMICA',
      },
      opciones: [
        {
          texto: 'Activación inmediata de reperfusión miocárdica (angioplastia primaria) y doble antiagregación',
          esCorrecta: true,
          orden: 1,
          retroalimentacionEspecifica: 'Correcto. La reapertura de la arteria culpable dentro de la ventana terapéutica es la medida que reduce la mortalidad.',
        },
        {
          texto: 'Realizar tomografía axial computarizada de tórax con contraste para descartar disección',
          esCorrecta: false,
          orden: 2,
          retroalimentacionEspecifica: 'Incorrecto. La clínica y el electrocardiograma son concluyentes de SCACEST; retrasar la reperfusión aumenta el daño miocárdico.',
        },
        {
          texto: 'Solicitar curva seriada de troponinas y esperar 3 horas para confirmar el diagnóstico',
          esCorrecta: false,
          orden: 3,
          retroalimentacionEspecifica: 'Incorrecto. En el SCACEST no se debe esperar el resultado de biomarcadores para iniciar la reperfusión.',
        },
        {
          texto: 'Administrar antibióticos de amplio espectro y analgesia con AINEs',
          esCorrecta: false,
          orden: 4,
          retroalimentacionEspecifica: 'Incorrecto. Los AINEs están contraindicados en el infarto agudo de miocardio por aumentar el riesgo de rotura y eventos adversos.',
        },
      ],
    },
    {
      codigoPublico: 'MED-PED-001',
      temaNombre: 'Infecciones Respiratorias Agudas Bajas en Pediatría',
      enunciado:
        'Lactante de 5 meses es llevado a consulta por tos, rinorrea y fiebre de bajo grado de 3 días de evolución, a lo que hoy se suma dificultad respiratoria. Al examen físico: taquipnea (FR 55 rpm), tiraje subcostal leve, sibilancias espiratorias bilaterales y subcrepitantes dispersos. Saturación de O2 al aire ambiente: 95%. Es su primer episodio de estas características. ¿Cuál es el diagnóstico más probable y el pilar terapéutico principal?',
      explicacionPedagogica:
        'Se trata de una Bronquiolitis aguda típica (primer episodio de sibilancias en menor de 2 años precedido de pródromo catarral). El pilar del tratamiento es de soporte: asegurar permeabilidad de la vía aérea, hidratación adecuada y oxigenoterapia únicamente si la saturación cae por debajo del 92%. Los broncodilatadores y corticoides no han demostrado beneficio sistemático.',
      dificultad: DificultadPregunta.FACIL,
      tipo: TipoPregunta.CASO_CLINICO,
      estado: EstadoPregunta.PUBLICADA,
      referencia: {
        fuente: 'Guía de Práctica Clínica de Bronquiolitis Aguda',
        autor: 'Ministerio de Salud Pública del Ecuador (MSP)',
        anio: 2022,
        referenciaBibliografica: 'MSP Ecuador. Bronquiolitis aguda en menores de 2 años. Guía de Práctica Clínica. Edición 2022.',
        tipoLicencia: 'REFERENCIA_ACADEMICA',
      },
      opciones: [
        {
          texto: 'Bronquiolitis aguda; tratamiento de soporte (aspiración de secreciones, hidratación y vigilancia)',
          esCorrecta: true,
          orden: 1,
          retroalimentacionEspecifica: 'Correcto. La bronquiolitis viral no requiere antibióticos ni corticoides de rutina.',
        },
        {
          texto: 'Asma bronquial del lactante; inicio de salbutamol nebulizado cada 20 minutos y dexametasona',
          esCorrecta: false,
          orden: 2,
          retroalimentacionEspecifica: 'Incorrecto. No se diagnostica asma en un primer episodio en un lactante de 5 meses.',
        },
        {
          texto: 'Neumonía bacteriana típica; inicio inmediato de amoxicilina oral a 90 mg/kg/día',
          esCorrecta: false,
          orden: 3,
          retroalimentacionEspecifica: 'Incorrecto. La auscultación bilateral con sibilancias y pródromo viral apunta a etiología viral bronquiolar.',
        },
        {
          texto: 'Laringotraqueítis aguda; nebulización con adrenalina racémica',
          esCorrecta: false,
          orden: 4,
          retroalimentacionEspecifica: 'Incorrecto. La laringotraqueítis afecta la vía aérea superior y cursa con estridor inspiratorio y tos perruna.',
        },
      ],
    },
  ];

  const preguntasOdontologia = [
    {
      codigoPublico: 'ODON-CIR-001',
      temaNombre: 'Exodoncia Compleja y Manejo de Infecciones Odontogénicas',
      enunciado:
        'Paciente de 32 años acude a la clínica 72 horas posteriores a la exodoncia de un tercer molar mandibular (pieza 38). Refiere dolor intenso, constante e irradiado al oído, que no cede con analgésicos convencionales. A la exploración intraoral se observa el alvéolo denudado, sin coágulo sanguíneo, con restos de alimentos y fetidez pronunciada. La mucosa adyacente no presenta tumefacción fluctuante ni fiebre. ¿Cuál es el diagnóstico y el tratamiento de elección?',
      explicacionPedagogica:
        'El cuadro es patognomónico de osteítis alveolar (alveolitis seca o fibrinolítica), complicación post-exodoncia caracterizada por lisis prematura del coágulo, dolor neurálgico severo e irradiado y exposición de paredes óseas. El manejo consiste en irrigación suave con suero fisiológico tibio para retirar restos necróticos y colocación de una pasta sedante intraalveolar (ej. alvogyl/óxido de zinc eugenol) con analgesia sistémica.',
      dificultad: DificultadPregunta.MEDIA,
      tipo: TipoPregunta.CASO_CLINICO,
      estado: EstadoPregunta.PUBLICADA,
      referencia: {
        fuente: 'Tratado de Cirugía Bucal',
        autor: 'Cosme Gay Escoda',
        anio: 2021,
        referenciaBibliografica: 'Gay Escoda C, Aytés Berini L. Cirugía Bucal. Ed. Ergón, Madrid, 2021: Cap. 12.',
        tipoLicencia: 'REFERENCIA_ACADEMICA',
      },
      opciones: [
        {
          texto: 'Alveolitis seca; lavado con solución salina estéril y colocación de apósito sedante analgésico',
          esCorrecta: true,
          orden: 1,
          retroalimentacionEspecifica: 'Correcto. La remoción de detritos y el alivio del dolor con apósito sedante es el protocolo estándar.',
        },
        {
          texto: 'Curetaje vigoroso del alvéolo bajo anestesia local para provocar un nuevo sangrado abundante',
          esCorrecta: false,
          orden: 2,
          retroalimentacionEspecifica: 'Incorrecto. El curetaje óseo vigoroso está contraindicado porque disemina la infección y retarda la cicatrización.',
        },
        {
          texto: 'Absceso periapical agudo; drenaje quirúrgico vestibular y antibioticoterapia intravenosa',
          esCorrecta: false,
          orden: 3,
          retroalimentacionEspecifica: 'Incorrecto. No hay colección fluctuante ni celulitis, se trata de una alveolitis seca.',
        },
        {
          texto: 'Fractura mandibular parasinfisaria; osteosíntesis con placas de titanio',
          esCorrecta: false,
          orden: 4,
          retroalimentacionEspecifica: 'Incorrecto. No existe traumatismo ni solución de continuidad en la cortical basal.',
        },
      ],
    },
  ];

  const preguntasEnfermeria = [
    {
      codigoPublico: 'ENF-FAR-001',
      temaNombre: 'Administración Segura de Medicamentos y Cuidados Intensivos',
      enunciado:
        'El médico prescribe una infusión de 500 ml de solución salina al 0.9% para pasar en 4 horas a través de un equipo de macrogoteo (factor de goteo: 20 gotas/ml). ¿A cuántas gotas por minuto debe calibrar el goteo el personal de enfermería?',
      explicacionPedagogica:
        'La fórmula estándar de cálculo de goteo con macrogotero es: Gotas por minuto = (Volumen total en ml * Factor de goteo) / (Tiempo en horas * 60 minutos). Gotas/min = (500 * 20) / (4 * 60) = 10,000 / 240 = 41.66 ≈ 42 gotas por minuto.',
      dificultad: DificultadPregunta.FACIL,
      tipo: TipoPregunta.OPCION_MULTIPLE,
      estado: EstadoPregunta.PUBLICADA,
      referencia: {
        fuente: 'Fundamentos de Enfermería',
        autor: 'Potter & Perry',
        anio: 2022,
        referenciaBibliografica: 'Potter PA, Perry AG. Fundamentos de Enfermería. 10ª edición. Elsevier; 2022.',
        tipoLicencia: 'REFERENCIA_ACADEMICA',
      },
      opciones: [
        {
          texto: '42 gotas por minuto',
          esCorrecta: true,
          orden: 1,
          retroalimentacionEspecifica: 'Correcto. 10,000 / 240 = 41.66 redondeado a 42 gotas/min.',
        },
        {
          texto: '21 gotas por minuto',
          esCorrecta: false,
          orden: 2,
          retroalimentacionEspecifica: 'Incorrecto. Ese valor correspondería a un tiempo de 8 horas.',
        },
        {
          texto: '60 gotas por minuto',
          esCorrecta: false,
          orden: 3,
          retroalimentacionEspecifica: 'Incorrecto. Sería la velocidad si el volumen fuera de 720 ml.',
        },
        {
          texto: '84 gotas por minuto',
          esCorrecta: false,
          orden: 4,
          retroalimentacionEspecifica: 'Incorrecto. Este valor duplica la velocidad calculada.',
        },
      ],
    },
  ];

  return { preguntasMedicina, preguntasOdontologia, preguntasEnfermeria };
}
