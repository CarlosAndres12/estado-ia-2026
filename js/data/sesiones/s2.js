/* js/data/sesiones/s2.js — sesión 2, KB §5 (prompt §5.3; shape in odd/spec/data-model.md).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.sesiones[2] = { n, titulo, tema, signo, tesis, diapositivas, diapositivasMapa, laminas, videos,
 *   producto, productoSesion, pregunta, resultados, agendaTitulo, agenda: [{ desde, hasta, minutos, bloque, recurso }],
 *   bloques, contenido: [{ n, titulo, complemento?, cuerpo, bloque? }], actualizaciones: [{ contenido, fuente, caja? }],
 *   errores, actividades, discusionTitulo, discusion, quiz: [{ pregunta, opciones, respuesta, letra, explicacion, pista }], lecturas,
 *   facilitador: { laminas: { dNN: { decir, nota } }, claves: [{ actividad, titulo }] } }
 * Text fields keep the KB markup: [Etiqueta][clave], **negrita**, *cursiva*, "- " lists (two spaces per level),
 * "1. " lists, pipe tables; numbers from registered figures are wrapped as {{id|texto}}.
 */
EIA.data.sesiones[2] = {
  n: 2,
  titulo: 'Capacidad técnica: frontera irregular, agentes y concentración',
  tema: 'Capacidad técnica',
  signo: 'cordillera',
  tesis: 'La IA rinde como experta en tareas bien delimitadas y falla en tareas largas o abiertas. En OSWorld, los agentes pasaron de cerca de {{cap-1|12%}} a {{cap-1|66,3%}} de éxito, pero aún fallan cerca de uno de cada tres intentos ([Stanford, cap. 2][hai2]).',
  diapositivas: '3, 4 y 5',
  diapositivasMapa: '3–5',
  laminas: ['d03', 'd04', 'd05'],
  videos: ['v03'],
  producto: 'Mapa de picos y valles',
  productoSesion: 'mapa de picos y valles del caso',
  pregunta: '¿Dónde es confiable la IA y dónde no?',
  resultados: [
    'Explicar la frontera irregular con ejemplos de picos y valles.',
    'Describir qué distingue a un agente de un chatbot y por qué se acumulan los errores.',
    'Analizar la convergencia de los modelos y la concentración de su producción.'
  ],
  agendaTitulo: 'Agenda (120 min)',
  agenda: [
    {
      desde: 0,
      hasta: 10,
      minutos: '0–10',
      bloque: 'Pregunta detonante: ¿le confiaría a un agente una tarea de 20 pasos?',
      recurso: '—'
    },
    {
      desde: 10,
      hasta: 45,
      minutos: '10–45',
      bloque: 'Frontera irregular, agentes y convergencia',
      recurso: 'Diapositivas 3–5'
    },
    {
      desde: 45,
      hasta: 60,
      minutos: '45–60',
      bloque: 'Cálculo en vivo: acumulación de errores',
      recurso: 'Contenido 4'
    },
    { desde: 60, hasta: 100, minutos: '60–100', bloque: 'Picos y valles del caso', recurso: 'Actividad' },
    { desde: 100, hasta: 120, minutos: '100–120', bloque: 'Discusión y quiz', recurso: '—' }
  ],
  bloques: [],
  contenido: [
    {
      n: 1,
      titulo: 'La frontera irregular',
      cuerpo: '- Picos: los mejores modelos superan la referencia de expertos en preguntas científicas de nivel doctoral (GPQA, referencia de {{cap-3|81,2%}}) y alcanzan o superan a los mejores concursantes en matemáticas de competición ([Stanford, cap. 2][hai2]).\n- Casi pico: en razonamiento multimodal (MMMU) llegan a {{cap-3|88,2%}}, {{cap-3|0,4 puntos}} por debajo del mejor experto humano ([Stanford, cap. 2][hai2]).\n- Valles: logran menos de {{cap-5|20%}} al replicar investigaciones de astrofísica (ReplicationBench). En PaperArena, el mejor agente llega a {{cap-6|38,8%}} frente a {{cap-6|83,5%}} de expertos doctorales ([Stanford, cap. 5][hai5]).\n- Lección: el promedio oculta las colas de error. En decisiones críticas importan la frecuencia y la gravedad del peor resultado.'
    },
    {
      n: 2,
      titulo: 'Benchmarks que se saturan',
      cuerpo: 'Entre 2023 y 2024 el desempeño subió {{cap-4|18,8 puntos}} en MMMU, {{cap-4|48,9}} en GPQA y {{cap-4|67,3}} en SWE-bench ([IBM sobre el AI Index 2025][ibm25]). Una prueba saturada deja de distinguir entre sistemas. Por eso la medición migra hacia evaluaciones dinámicas, tareas no contaminadas, confiabilidad en varios intentos, desempeño fuera de distribución y medición de daños.'
    },
    {
      n: 3,
      titulo: 'De chatbot a agente',
      cuerpo: 'Un chatbot responde una pregunta. Un agente persigue un objetivo en bucle: planifica, usa herramientas, ejecuta, verifica y vuelve a planificar.\n- En OSWorld el éxito pasó de cerca de {{cap-1|12%}} a {{cap-1|66,3%}}, frente a una referencia humana de {{cap-1|72,35%}} ([Stanford, cap. 2][hai2]).\n- En Terminal-Bench 2.0 pasó de {{cap-2|20%}} (febrero de 2025) a {{cap-2|77,3%}} (inicios de 2026) ([Stanford, cap. 2][hai2]).\n- En las empresas, {{adop-2|23%}} escala agentes en alguna función, y en ninguna función el escalamiento supera {{adop-3|10%}} ([McKinsey, 2025][mck25]).'
    },
    {
      n: 4,
      titulo: 'Por qué se acumulan los errores',
      cuerpo: 'Si cada paso tiene una probabilidad de éxito p y los pasos son independientes, una tarea de n pasos se completa con probabilidad P = p^n. Ejemplo ilustrativo, no tomado de las fuentes:\n- con 95% de éxito por paso, una tarea de 20 pasos se completa 36% de las veces (0,95^20 ≈ 0,36);\n- con 99% por paso, se completa 82% de las veces (0,99^20 ≈ 0,82).'
    },
    {
      n: 5,
      titulo: 'Tres límites de la autonomía',
      cuerpo: '- Los errores se acumulan en las tareas largas.\n- Hay poca observabilidad: no siempre se sabe por qué el sistema eligió una acción.\n- Hay riesgos de seguridad: un agente con acceso a correo, archivos o sistemas amplía el daño de instrucciones maliciosas, permisos excesivos o errores.'
    },
    {
      n: 6,
      titulo: 'Tendencia, no pronóstico',
      cuerpo: 'METR estimó que la duración de las tareas de software que los agentes completan con {{cap-8|50%}} de éxito se duplicó cada siete meses aproximadamente entre 2019 y 2025 ([METR, 2025][metr-th]). Con su metodología actualizada (Time Horizon 1.1, enero de 2026), el tiempo de duplicación desde 2024 es de unos {{cap-8|89}} días, cerca de tres meses ([METR, 2026][metr-th11]). Los resultados varían mucho entre clases de tareas, así que no se pueden extrapolar mecánicamente.'
    },
    {
      n: 7,
      titulo: 'Convergencia de modelos',
      cuerpo: 'En marzo de 2026, modelos de Anthropic, xAI, Google, OpenAI, Alibaba y DeepSeek aparecían dentro de un margen estrecho en clasificaciones de preferencia. Stanford considera que la brecha entre Estados Unidos y China prácticamente se cerró ([UNU C3][unu]). Si el desempeño converge, la competencia se traslada al costo, la latencia, la confiabilidad, la privacidad, la integración y la apertura.'
    },
    {
      n: 8,
      titulo: 'Concentración de poder',
      cuerpo: '- Más de {{cap-9|90%}} ({{cap-9|91,2%}}) de los modelos notables de 2025 vino de la industria ([Stanford, cap. 1][hai1]).\n- Estados Unidos produjo {{cap-10|59}}, China {{cap-10|35}} y Corea del Sur {{cap-10|8}} ([Stanford, cap. 1][hai1]).\n- China lidera en publicaciones, citaciones y patentes concedidas; Estados Unidos, en modelos notables y patentes de mayor impacto.\n- Además, cae la transparencia: varias organizaciones ya no revelan parámetros, datos ni duración del entrenamiento ([UNU C3][unu]).'
    },
    {
      n: 9,
      titulo: 'Modelos pequeños y abiertos',
      cuerpo: '- Un modelo de proteínas de {{cap-12|111 millones}} de parámetros y uno genómico de {{cap-12|200 millones}} superaron a sistemas mucho mayores en evaluaciones específicas ([Stanford, Medicina][hai-med]).\n- En 2025, el acceso por API fue el formato más común entre los modelos notables ({{cap-11|47}} de {{cap-11|102}}), seguido de los pesos abiertos sin restricciones ([Stanford, cap. 1][hai1]).\n- «Pesos abiertos» no significa código, datos y proceso abiertos.'
    }
  ],
  actualizaciones: [
    { contenido: 6, fuente: 'metr-th11' }
  ],
  errores: [
    'Creer que «supera a humanos en un benchmark» significa «puede reemplazar a un profesional».',
    'Pensar que un promedio alto garantiza confiabilidad, sin mirar las colas de error ni la consistencia.',
    'Confundir «pesos abiertos» con código abierto.',
    'Leer una tendencia de METR como un pronóstico de fechas.'
  ],
  actividades: ['s2-pasos', 's2-picos-valles'],
  discusionTitulo: 'Discusión',
  discusion: [
    '¿Qué evidencia de confiabilidad pediría a un proveedor antes de desplegar un agente?',
    '¿Qué gana y qué pierde una entidad pública al elegir una API cerrada frente a un modelo de pesos abiertos?'
  ],
  quiz: [
    {
      pregunta: 'Con 95% de acierto por paso, ¿qué probabilidad tiene un agente de completar 20 pasos?',
      opciones: ['95%', 'cerca de 36%', 'cerca de 80%'],
      respuesta: 1,
      letra: 'b',
      explicacion: 'Es 0,95^20 ≈ 0,36 (ejemplo ilustrativo).',
      pista: 'los errores se acumulan: multiplica la probabilidad de cada paso por sí misma tantas veces como pasos haya.'
    },
    {
      pregunta: '¿Qué proporción de los modelos notables de 2025 vino de la industria?',
      opciones: ['cerca de la mitad', 'más de 90%', '23%'],
      respuesta: 1,
      letra: 'b',
      explicacion: '(91,2%).',
      pista: 'el 23% pertenece a otra cifra de la sesión: la de las empresas que escalan agentes.'
    },
    {
      pregunta: '«Pesos abiertos» significa:',
      opciones: [
        'código, datos y proceso abiertos',
        'acceso a los parámetros, no necesariamente a los datos ni al código',
        'acceso solo por API'
      ],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'la sesión advierte que «pesos abiertos» no significa código, datos y proceso abiertos. ¿Qué se publica, entonces?'
    }
  ],
  lecturas: [
    'informe base («Capacidades técnicas»)',
    '[Stanford AI Index 2026, cap. 1 (PDF)][hai1]',
    '[Stanford AI Index 2026, cap. 2 (PDF)][hai2]'
  ],
  facilitador: {
    laminas: {
      d03: { decir: '', nota: '' },
      d04: { decir: 'usar el ejemplo ilustrativo 0,95^20.', nota: '' },
      d05: { decir: '', nota: '' }
    },
    claves: []
  }
};
