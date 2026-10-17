/* js/data/deck.js — the 17 láminas: the KB "Guion de diapositivas" (prompt §12, contracts §2).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 * Drawn text is verbatim KB, except the corrected versions of prompt §12.1 (D8 "27,0% vs 8,5%"; D15
 * "479.273" and "106 acciones") and the D7 caution line (rotulos.cautela); tools/check-content.mjs lists them.
 *
 * EIA.data.deck = [{
 *   id: 'd07', n: 7, sesion: 3,
 *   titulo,                 // KB heading after "Dn · ", no final period
 *   titular, subtitulo,     // drawn headline: KB "Titular"/"Subtítulo" for D1–D2, otherwise titular = titulo
 *   cifras: [{ valor, etiqueta, cifras }],               // ≤ 3, the big-figure column
 *   diagrama: { tipo, titulo, items: [{ text, cifras, … }], … } | null,
 *     // tipo: flujo | embudo | causal | columnas | pasos | ciclo | semaforo | linea | tarjetas | barras
 *     // items may carry: valor (number for proportional marks), aprox ('≈'), cuello (narrowest bar),
 *     // luz (1 lit, 0.5 half, 0 dark), carril (lane), signo (card sign), etiqueta (bar label);
 *     // ciclo: retorno (index the return arrow points to); causal: enlace (dotted-line label);
 *     // linea: hitos (milestone labels); columnas: cifras (figures of the whole diagram)
 *   ideaCentral: { text, cifras } | null,                // KB "Idea central" without its «»
 *   pie: { text } | null,                                // KB "Pie", citation labels as plain text
 *   rotulos: { [key]: { text, cifras?, valor?, aprox? } }, // other drawn strings (prompt §12.2)
 *   datos?: { [key]: { valor, cifras } },                // unlabeled numbers the illustration encodes
 *   notas: { decir, nota, metafora, correcciones? },     // KB "Qué decir", "Nota", "Metáfora"; correcciones ids
 *   kb: [{ label, text, items? }],                       // every KB sub-bullet, verbatim, in order
 *   contenido: [4]                                       // related "Contenido" point numbers of its session
 * }]
 */
EIA.data.deck = [
  {
    id: 'd01',
    n: 1,
    sesion: 1,
    titulo: 'Portada',
    titular: 'Estado de la IA 2026',
    subtitulo: 'Adopción masiva, valor aún por demostrar',
    cifras: [],
    diagrama: null,
    ideaCentral: null,
    pie: { text: 'Síntesis de Stanford AI Index 2026, McKinsey, OIT, UNESCO, CEPAL · Octubre 2026' },
    rotulos: {
      punta: { text: '88% de organizaciones usa IA', cifras: ['adop-1'] },
      masa: { text: 'Escala · Valor · Gobernanza' }
    },
    notas: {
      decir: 'lo visible es el uso; lo que decide el valor está bajo la superficie ([McKinsey, 2025][mck25]).',
      nota: '',
      metafora: 'iceberg en un mar nocturno. La punta luminosa dice «88% de organizaciones usa IA» y la masa sumergida dice «Escala · Valor · Gobernanza».'
    },
    kb: [
      {
        label: 'Titular',
        text: '«Estado de la IA 2026». Subtítulo: «Adopción masiva, valor aún por demostrar».'
      },
      {
        label: 'Metáfora',
        text: 'iceberg en un mar nocturno. La punta luminosa dice «88% de organizaciones usa IA» y la masa sumergida dice «Escala · Valor · Gobernanza».'
      },
      {
        label: 'Pie',
        text: '«Síntesis de Stanford AI Index 2026, McKinsey, OIT, UNESCO, CEPAL · Octubre 2026».'
      },
      {
        label: 'Qué decir',
        text: 'lo visible es el uso; lo que decide el valor está bajo la superficie ([McKinsey, 2025][mck25]).'
      }
    ],
    contenido: [1]
  },
  {
    id: 'd02',
    n: 2,
    sesion: 1,
    titulo: 'Ruta de lectura',
    titular: 'De la capacidad a la gobernanza',
    subtitulo: '',
    cifras: [],
    diagrama: {
      tipo: 'flujo',
      titulo: '',
      items: [
        { text: '1 Capacidad técnica', cifras: [] },
        { text: '2 Economía y adopción', cifras: [] },
        { text: '3 Trabajo y educación', cifras: [] },
        { text: '4 Ciencia y salud', cifras: [] },
        { text: '5 Riesgo y gobernanza', cifras: [] },
        { text: 'Agenda 2026–2028', cifras: [] }
      ]
    },
    ideaCentral: { text: '¿Cuánto valor verificable produce la IA, para quién y con qué controles?', cifras: [] },
    pie: { text: 'informe base (corte: 14 de octubre de 2026)' },
    rotulos: {},
    notas: { decir: '', nota: '', metafora: 'mapa de ruta con brújula.' },
    kb: [
      { label: 'Titular', text: '«De la capacidad a la gobernanza».' },
      {
        label: 'Diagrama',
        text: '1 Capacidad técnica → 2 Economía y adopción → 3 Trabajo y educación → 4 Ciencia y salud → 5 Riesgo y gobernanza → Agenda 2026–2028.'
      },
      { label: 'Metáfora', text: 'mapa de ruta con brújula.' },
      {
        label: 'Idea central',
        text: '«¿Cuánto valor verificable produce la IA, para quién y con qué controles?».'
      },
      { label: 'Pie', text: 'informe base (corte: 14 de octubre de 2026).' }
    ],
    contenido: [5]
  },
  {
    id: 'd03',
    n: 3,
    sesion: 2,
    titulo: 'La frontera irregular',
    titular: 'La frontera irregular',
    subtitulo: '',
    cifras: [],
    diagrama: {
      tipo: 'pasos',
      titulo: '',
      items: [
        { text: 'El promedio oculta las colas de error', cifras: [] },
        { text: 'Un benchmark alto no equivale a desempeño real', cifras: [] },
        { text: 'Medir confiabilidad, no solo precisión', cifras: [] }
      ]
    },
    ideaCentral: { text: 'Capacidades sobresalientes en tareas delimitadas, junto con errores elementales', cifras: [] },
    pie: { text: 'Stanford AI Index 2026 (cap. 2; cap. 5)' },
    rotulos: {
      pico1: { text: 'Ciencia de nivel doctoral', cifras: ['cap-3'] },
      pico2: { text: 'Matemáticas de competición', cifras: ['cap-3'] },
      valle1: { text: 'Replicación en astrofísica: <20%', cifras: ['cap-5'] },
      valle2: { text: 'PaperArena: agente 38,8% vs expertos 83,5%', cifras: ['cap-6'] }
    },
    notas: {
      decir: '',
      nota: '',
      metafora: 'cordillera cruzada por un escalador. Los picos luminosos dicen «Ciencia de nivel doctoral» y «Matemáticas de competición». Los valles oscuros dicen «Replicación en astrofísica: <20%» y «PaperArena: agente 38,8% vs expertos 83,5%».'
    },
    kb: [
      {
        label: 'Metáfora',
        text: 'cordillera cruzada por un escalador. Los picos luminosos dicen «Ciencia de nivel doctoral» y «Matemáticas de competición». Los valles oscuros dicen «Replicación en astrofísica: <20%» y «PaperArena: agente 38,8% vs expertos 83,5%».'
      },
      {
        label: 'Diagrama de tres pasos',
        text: '«El promedio oculta las colas de error» → «Un benchmark alto no equivale a desempeño real» → «Medir confiabilidad, no solo precisión».'
      },
      {
        label: 'Idea central',
        text: '«Capacidades sobresalientes en tareas delimitadas, junto con errores elementales».'
      },
      { label: 'Pie', text: 'Stanford AI Index 2026 ([cap. 2][hai2]; [cap. 5][hai5]).' }
    ],
    contenido: [1]
  },
  {
    id: 'd04',
    n: 4,
    sesion: 2,
    titulo: 'De chatbot a agente',
    titular: 'De chatbot a agente',
    subtitulo: '',
    cifras: [
      { valor: '23%', etiqueta: 'escala agentes', cifras: ['adop-2'] },
      { valor: '10%', etiqueta: 'ninguna función lo supera', cifras: ['adop-3'] }
    ],
    diagrama: {
      tipo: 'ciclo',
      titulo: '',
      items: [
        { text: 'Objetivo', cifras: [] },
        { text: 'Planificar', cifras: [] },
        { text: 'Usar herramientas', cifras: [] },
        { text: 'Ejecutar', cifras: [] },
        { text: 'Verificar', cifras: [] }
      ],
      retorno: 1
    },
    ideaCentral: { text: 'Los errores se acumulan en tareas de muchos pasos', cifras: [] },
    pie: null,
    rotulos: {
      pregunta: { text: 'Pregunta' },
      respuesta: { text: 'Respuesta' },
      peldanoBajo: { text: 'OSWorld 12%', cifras: ['cap-1'], valor: 12, aprox: '≈' },
      peldanoAlto: { text: '~66%', cifras: ['cap-1', 'ctx-osworld-peldanos'], valor: 66, aprox: '≈' },
      peldanoRoto: { text: '≈1 de cada 3 falla', cifras: ['cap-1'] }
    },
    notas: {
      decir: 'usar el ejemplo ilustrativo 0,95^20.',
      nota: '',
      metafora: 'escalera con un robot aprendiz. El peldaño bajo dice «OSWorld 12%», el alto «~66%» y el último, agrietado, «≈1 de cada 3 falla» ([Stanford, cap. 2][hai2]).'
    },
    kb: [
      {
        label: 'Cifras',
        text: '«23% escala agentes» y «10%: ninguna función lo supera» ([McKinsey, 2025][mck25]).'
      },
      {
        label: 'Diagrama',
        text: 'arriba, Pregunta → Respuesta. Abajo, el bucle Objetivo → Planificar → Usar herramientas → Ejecutar → Verificar, con una flecha de retorno a Planificar.'
      },
      {
        label: 'Metáfora',
        text: 'escalera con un robot aprendiz. El peldaño bajo dice «OSWorld 12%», el alto «~66%» y el último, agrietado, «≈1 de cada 3 falla» ([Stanford, cap. 2][hai2]).'
      },
      { label: 'Idea central', text: '«Los errores se acumulan en tareas de muchos pasos».' },
      { label: 'Qué decir', text: 'usar el ejemplo ilustrativo 0,95^20.' }
    ],
    contenido: [3, 4, 5]
  },
  {
    id: 'd05',
    n: 5,
    sesion: 2,
    titulo: 'Convergencia de modelos, concentración de poder',
    titular: 'Convergencia de modelos, concentración de poder',
    subtitulo: '',
    cifras: [
      { valor: '>90%', etiqueta: 'de los modelos notables viene de la industria', cifras: ['cap-9'] },
      { valor: '47 de 102', etiqueta: 'modelos notables con acceso por API', cifras: ['cap-11'] }
    ],
    diagrama: {
      tipo: 'barras',
      titulo: 'Modelos notables 2025',
      items: [
        { text: 'EE. UU. 59', cifras: ['cap-10'], etiqueta: 'EE. UU.', valor: 59 },
        { text: 'China 35', cifras: ['cap-10'], etiqueta: 'China', valor: 35 }
      ]
    },
    ideaCentral: { text: 'Si el desempeño converge, compiten costo, latencia, privacidad y apertura', cifras: [] },
    pie: null,
    rotulos: {},
    datos: {
      lamparas: { valor: 6, cifras: ['ctx-modelos-convergen'] }
    },
    notas: {
      decir: '',
      nota: '',
      metafora: 'pelotón de ciclistas muy juntos en la cima, cada uno con un banderín distinto.'
    },
    kb: [
      {
        label: 'Cifras',
        text: '«>90% de los modelos notables viene de la industria» y «47 de 102 modelos notables con acceso por API» ([Stanford, cap. 1][hai1]).'
      },
      {
        label: 'Diagrama',
        text: 'barras «Modelos notables 2025: EE. UU. 59 · China 35» ([Stanford, cap. 1][hai1]).'
      },
      {
        label: 'Metáfora',
        text: 'pelotón de ciclistas muy juntos en la cima, cada uno con un banderín distinto.'
      },
      {
        label: 'Idea central',
        text: '«Si el desempeño converge, compiten costo, latencia, privacidad y apertura».'
      }
    ],
    contenido: [7, 8, 9]
  },
  {
    id: 'd06',
    n: 6,
    sesion: 3,
    titulo: 'Capital e infraestructura',
    titular: 'Capital e infraestructura',
    subtitulo: '',
    cifras: [
      { valor: '+127,5%', etiqueta: 'inversión privada 2025', cifras: ['eco-1'] },
      { valor: '23×', etiqueta: 'EE. UU. frente a China', cifras: ['eco-3'] },
      { valor: '29,6 GW', etiqueta: 'centros de datos de IA', cifras: ['eco-4'] }
    ],
    diagrama: {
      tipo: 'flujo',
      titulo: '',
      items: [
        { text: 'Capital', cifras: [] },
        { text: 'Cómputo', cifras: [] },
        { text: 'Modelos', cifras: [] },
        { text: 'Productos', cifras: [] }
      ]
    },
    ideaCentral: { text: 'La corrida final de entrenamiento es solo 9,6%–22,6% del cómputo de I+D', cifras: ['eco-6'] },
    pie: null,
    rotulos: {
      medidor: { text: '29,6 GW', cifras: ['eco-4'], valor: 29.6 }
    },
    notas: {
      decir: '',
      nota: '',
      metafora: 'río de monedas luminosas que desemboca en un embalse con una sola compuerta, junto a una torre de servidores con medidor de energía.'
    },
    kb: [
      {
        label: 'Cifras',
        text: '«+127,5%» (inversión privada 2025), «23×» (EE. UU. frente a China) y «29,6 GW» (centros de datos de IA) ([Stanford, cap. 4][hai4]; [cap. 1][hai1]).'
      },
      { label: 'Diagrama', text: 'Capital → Cómputo → Modelos → Productos.' },
      {
        label: 'Metáfora',
        text: 'río de monedas luminosas que desemboca en un embalse con una sola compuerta, junto a una torre de servidores con medidor de energía.'
      },
      {
        label: 'Idea central',
        text: '«La corrida final de entrenamiento es solo 9,6%–22,6% del cómputo de I+D» ([Epoch AI][epoch]).'
      }
    ],
    contenido: [1, 2, 3]
  },
  {
    id: 'd07',
    n: 7,
    sesion: 3,
    titulo: 'Del uso al valor: el embudo de la adopción',
    titular: 'Del uso al valor: el embudo de la adopción',
    subtitulo: '',
    cifras: [],
    diagrama: {
      tipo: 'embudo',
      titulo: '',
      items: [
        { text: '88% usa IA en al menos una función', cifras: ['adop-1'], valor: 88 },
        { text: '62% experimenta o escala agentes', cifras: ['adop-2'], valor: 62 },
        {
          text: '~1/3 escala la IA en toda la organización',
          cifras: ['adop-4'],
          valor: 33.333333333333336,
          aprox: '≈',
          cuello: true
        },
        { text: '39% reporta algún impacto en EBIT (normalmente <5%)', cifras: ['adop-5'], valor: 39 }
      ]
    },
    ideaCentral: { text: 'El cuello de botella es organizacional, no el acceso al modelo', cifras: [] },
    pie: null,
    rotulos: {
      cautela: { text: 'Cada barra sale de una pregunta distinta de la misma encuesta.' },
      cuello: { text: 'cuello de botella' },
      uso: { text: 'Uso' },
      valor: { text: 'Valor' }
    },
    notas: {
      decir: 'los niveles vienen de preguntas distintas; mencionar la edición 2026.',
      nota: '',
      metafora: 'puente sobre un abismo, de «Uso» a «Valor», con el último tramo en construcción.'
    },
    kb: [
      {
        label: 'Diagrama',
        text: 'embudo con barras proporcionales a cada porcentaje ([McKinsey, 2025][mck25]):',
        items: [
          '88% usa IA en al menos una función;',
          '62% experimenta o escala agentes;',
          '~1/3 escala la IA en toda la organización (la barra más estrecha, el cuello de botella);',
          '39% reporta algún impacto en EBIT (normalmente <5%).'
        ]
      },
      {
        label: 'Metáfora',
        text: 'puente sobre un abismo, de «Uso» a «Valor», con el último tramo en construcción.'
      },
      { label: 'Idea central', text: '«El cuello de botella es organizacional, no el acceso al modelo».' },
      { label: 'Qué decir', text: 'los niveles vienen de preguntas distintas; mencionar la edición 2026.' }
    ],
    contenido: [4]
  },
  {
    id: 'd08',
    n: 8,
    sesion: 3,
    titulo: 'Productividad: real, pero heterogénea',
    titular: 'Productividad: real, pero heterogénea',
    subtitulo: '',
    cifras: [
      {
        valor: '27,0% vs 8,5%',
        etiqueta: 'ingreso por empleado en industrias más y menos expuestas',
        cifras: ['prod-5']
      },
      { valor: '56%', etiqueta: 'prima salarial', cifras: ['prod-6'] }
    ],
    diagrama: {
      tipo: 'causal',
      titulo: '',
      items: [
        { text: 'Capital, datos, gestión', cifras: [] },
        { text: 'Exposición a IA', cifras: [] },
        { text: 'Ingreso por empleado', cifras: [] }
      ],
      enlace: 'asociación'
    },
    ideaCentral: {
      text: 'Depende de la tarea, el usuario y el costo de verificar; asociación no es causalidad',
      cifras: []
    },
    pie: null,
    rotulos: {
      soporte: { text: 'Soporte al cliente +14–15%', cifras: ['prod-1'] },
      software: { text: 'Software +26%', cifras: ['prod-1'] },
      marketing: { text: 'Marketing +50%', cifras: ['prod-1'] },
      reloj: { text: 'Desarrolladores expertos: +19% más tiempo (METR)', cifras: ['prod-3'] },
      desactualizado: { text: 'METR lo marca hoy como desactualizado', cifras: ['prod-3'] }
    },
    notas: {
      decir: '',
      nota: '',
      metafora: 'balanza. En un platillo, «Soporte al cliente +14–15%», «Software +26%» y «Marketing +50%». En el otro, un reloj de arena: «Desarrolladores expertos: +19% más tiempo (METR)».',
      correcciones: ['pwc']
    },
    kb: [
      {
        label: 'Cifras',
        text: '«27% vs 9%» (ingreso por empleado en industrias más y menos expuestas) y «56%» (prima salarial) ([PwC, 2025][pwc25]).'
      },
      {
        label: 'Diagrama',
        text: '«Capital, datos, gestión» influye a la vez en «Exposición a IA» y en «Ingreso por empleado». Entre estos dos, una flecha punteada marcada «asociación».'
      },
      {
        label: 'Metáfora',
        text: 'balanza. En un platillo, «Soporte al cliente +14–15%», «Software +26%» y «Marketing +50%». En el otro, un reloj de arena: «Desarrolladores expertos: +19% más tiempo (METR)».'
      },
      {
        label: 'Idea central',
        text: '«Depende de la tarea, el usuario y el costo de verificar; asociación no es causalidad».'
      }
    ],
    contenido: [6, 7]
  },
  {
    id: 'd09',
    n: 9,
    sesion: 4,
    titulo: 'Trabajo: transformación de tareas, presión en la entrada',
    titular: 'Trabajo: transformación de tareas, presión en la entrada',
    subtitulo: '',
    cifras: [
      { valor: '25%', etiqueta: 'con alguna exposición', cifras: ['trab-1'] },
      {
        valor: '3,3%',
        etiqueta: 'en exposición máxima, con mujeres 4,7% y hombres 2,4%',
        cifras: ['trab-2', 'trab-3']
      },
      { valor: 'casi −20%', etiqueta: 'en desarrolladores de 22–25 años desde 2024', cifras: ['trab-4'] }
    ],
    diagrama: {
      tipo: 'flujo',
      titulo: 'No son lo mismo',
      items: [
        { text: 'Exposición', cifras: [] },
        { text: 'Automatización', cifras: [] },
        { text: 'Desplazamiento', cifras: [] }
      ]
    },
    ideaCentral: { text: 'La OIT ve más probable la transformación de tareas que la desaparición de puestos', cifras: [] },
    pie: null,
    rotulos: {
      peldano: { text: 'Puestos de entrada' }
    },
    notas: {
      decir: '',
      nota: '',
      metafora: 'escalera profesional cuyo primer peldaño («Puestos de entrada») se desvanece, con una persona joven mirando hacia arriba.'
    },
    kb: [
      {
        label: 'Cifras',
        text: '«25%» con alguna exposición y «3,3%» en exposición máxima, con mujeres 4,7% y hombres 2,4% ([OIT][ilo]); «casi −20%» en desarrolladores de 22–25 años desde 2024 ([Stanford][hai4]).'
      },
      { label: 'Diagrama «No son lo mismo»', text: 'Exposición → Automatización → Desplazamiento.' },
      {
        label: 'Metáfora',
        text: 'escalera profesional cuyo primer peldaño («Puestos de entrada») se desvanece, con una persona joven mirando hacia arriba.'
      },
      {
        label: 'Idea central',
        text: '«La OIT ve más probable la transformación de tareas que la desaparición de puestos».'
      }
    ],
    contenido: [1, 2, 3, 4]
  },
  {
    id: 'd10',
    n: 10,
    sesion: 4,
    titulo: 'Universidad: se usa más de lo que se gobierna',
    titular: 'Universidad: se usa más de lo que se gobierna',
    subtitulo: '',
    cifras: [
      { valor: '86%', etiqueta: 'de estudiantes usa IA, 24% a diario', cifras: ['edu-1', 'edu-2'] },
      { valor: '58%', etiqueta: 'dice no tener habilidades suficientes', cifras: ['edu-3'] },
      { valor: '9 de cada 10', etiqueta: 'académicos usan IA en su trabajo', cifras: ['edu-5'] }
    ],
    diagrama: {
      tipo: 'flujo',
      titulo: '',
      items: [
        { text: 'Producto auténtico', cifras: [] },
        { text: 'Bitácora de proceso', cifras: [] },
        { text: 'Defensa oral', cifras: [] },
        { text: 'Uso declarado de IA', cifras: [] }
      ]
    },
    ideaCentral: { text: 'Evaluar el aprendizaje, no el texto', cifras: [] },
    pie: null,
    rotulos: {},
    notas: {
      decir: '',
      nota: 'se retiró el «34%» del guion original porque no está en la fuente.',
      metafora: 'lancha veloz con motor potente, sin brújula ni mapa, y un faro lejano.'
    },
    kb: [
      {
        label: 'Cifras',
        text: '«86%» de estudiantes usa IA, 24% a diario ([DEC][dec]; [Campus Technology][ct]); «58%» dice no tener habilidades suficientes ([DEC][dec]); «9 de cada 10 académicos usan IA en su trabajo» ([UNESCO][unesco]).'
      },
      {
        label: 'Diagrama',
        text: 'Producto auténtico → Bitácora de proceso → Defensa oral → Uso declarado de IA.'
      },
      { label: 'Metáfora', text: 'lancha veloz con motor potente, sin brújula ni mapa, y un faro lejano.' },
      { label: 'Idea central', text: '«Evaluar el aprendizaje, no el texto».' },
      { label: 'Nota', text: 'se retiró el «34%» del guion original porque no está en la fuente.' }
    ],
    contenido: [6, 7, 8, 9]
  },
  {
    id: 'd11',
    n: 11,
    sesion: 5,
    titulo: 'Ciencia: acelera piezas, no el ciclo completo',
    titular: 'Ciencia: acelera piezas, no el ciclo completo',
    subtitulo: '',
    cifras: [
      { valor: '~80.150', etiqueta: 'publicaciones (+26%)', cifras: ['cien-1'] },
      { valor: '<20%', etiqueta: 'en replicación de astrofísica', cifras: ['cap-5'] },
      {
        valor: '38,8%',
        etiqueta: 'del agente frente a 83,5% de los expertos en PaperArena',
        cifras: ['cap-6']
      }
    ],
    diagrama: {
      tipo: 'pasos',
      titulo: '',
      items: [
        { text: 'Hipótesis', cifras: [], luz: 1 },
        { text: 'Diseño', cifras: [], luz: 1 },
        { text: 'Ejecución', cifras: [], luz: 0.5 },
        { text: 'Validación', cifras: [], luz: 0 },
        { text: 'Interpretación', cifras: [], luz: 0 }
      ]
    },
    ideaCentral: { text: 'Producir manuscritos no es producir conocimiento válido', cifras: [] },
    pie: null,
    rotulos: {},
    notas: { decir: '', nota: '', metafora: 'telescopio y microscopio apuntando a un mapa del proceso científico.' },
    kb: [
      {
        label: 'Cifras',
        text: '«~80.150» publicaciones (+26%); «<20%» en replicación de astrofísica; «38,8%» del agente frente a 83,5% de los expertos en PaperArena ([Stanford, cap. 5][hai5]).'
      },
      {
        label: 'Diagrama',
        text: 'barra de proceso Hipótesis › Diseño › Ejecución › Validación › Interpretación. Los dos primeros pasos están iluminados, el tercero a medias y los dos últimos apagados.'
      },
      { label: 'Metáfora', text: 'telescopio y microscopio apuntando a un mapa del proceso científico.' },
      { label: 'Idea central', text: '«Producir manuscritos no es producir conocimiento válido».' }
    ],
    contenido: [1, 2, 3]
  },
  {
    id: 'd12',
    n: 12,
    sesion: 5,
    titulo: 'Medicina: potencia con evidencia desigual',
    titular: 'Medicina: potencia con evidencia desigual',
    subtitulo: '',
    cifras: [],
    diagrama: {
      tipo: 'flujo',
      titulo: 'Antes de escalar',
      items: [
        { text: 'Validación externa', cifras: [] },
        { text: 'Seguimiento posdespliegue', cifras: [] },
        { text: 'Responsabilidad clínica', cifras: [] }
      ]
    },
    ideaCentral: { text: 'Un resultado de laboratorio no es efectividad clínica', cifras: [] },
    pie: null,
    rotulos: {
      luzRoja: { text: 'Rojo' },
      luzAmbar: { text: 'Ámbar' },
      luzVerde: { text: 'Verde' },
      verde: { text: 'Notas clínicas: hasta −83% de tiempo de redacción', cifras: ['med-1'] },
      ambar: {
        text: 'Sistema multiagente 85,5% vs 20% de médicos sin sus herramientas habituales',
        cifras: ['med-2']
      },
      rojo1: { text: 'Solo 5% de estudios con datos clínicos reales', cifras: ['med-3'] },
      rojo2: { text: 'FDA autorizó 258 dispositivos de IA en 2025', cifras: ['med-5'] },
      rojo3: { text: 'Solo 2,4% con estudios clínicos tuvo ensayos aleatorizados (hasta 2024)', cifras: ['med-6'] }
    },
    notas: { decir: '', nota: '', metafora: '' },
    kb: [
      {
        label: '',
        text: 'Semáforo ([Stanford, cap. 6][hai6]):',
        items: [
          'verde: «Notas clínicas: hasta −83% de tiempo de redacción»;',
          'ámbar: «Sistema multiagente 85,5% vs 20% de médicos sin sus herramientas habituales»;',
          'rojo: «Solo 5% de estudios con datos clínicos reales · FDA autorizó 258 dispositivos de IA en 2025 · Solo 2,4% con estudios clínicos tuvo ensayos aleatorizados (hasta 2024)».'
        ]
      },
      {
        label: 'Diagrama «Antes de escalar»',
        text: 'Validación externa → Seguimiento posdespliegue → Responsabilidad clínica.'
      },
      { label: 'Idea central', text: '«Un resultado de laboratorio no es efectividad clínica».' }
    ],
    contenido: [5, 6]
  },
  {
    id: 'd13',
    n: 13,
    sesion: 6,
    titulo: 'Riesgos: crecen junto con las capacidades',
    titular: 'Riesgos: crecen junto con las capacidades',
    subtitulo: '',
    cifras: [
      {
        valor: '+55%',
        etiqueta: 'los incidentes documentados pasaron de 233 (2024) a 362 (2025)',
        cifras: ['ries-1']
      }
    ],
    diagrama: {
      tipo: 'columnas',
      titulo: '',
      items: [
        { text: 'Uso malicioso', cifras: [] },
        { text: 'Fallos', cifras: [] },
        { text: 'Riesgos sistémicos', cifras: [] }
      ],
      cifras: ['ries-2']
    },
    ideaCentral: { text: 'Menos transparencia técnica y sin tasas comparables: el conteo bruto no basta', cifras: [] },
    pie: null,
    rotulos: {
      aguja: { text: '362', cifras: ['ries-1'], valor: 362 },
      fantasma: { text: '233', cifras: ['ries-1'], valor: 233 }
    },
    notas: { decir: '', nota: '', metafora: 'tablero de control con un indicador que sube de 233 a 362.' },
    kb: [
      {
        label: 'Cifra',
        text: '«+55%»; los incidentes documentados pasaron de 233 (2024) a 362 (2025) ([Stanford, cap. 3][hai3]).'
      },
      {
        label: 'Diagrama de tres columnas',
        text: '«Uso malicioso» · «Fallos» · «Riesgos sistémicos» ([IASR 2026][iasr]).'
      },
      { label: 'Metáfora', text: 'tablero de control con un indicador que sube de 233 a 362.' },
      {
        label: 'Idea central',
        text: '«Menos transparencia técnica y sin tasas comparables: el conteo bruto no basta».'
      }
    ],
    contenido: [1, 2]
  },
  {
    id: 'd14',
    n: 14,
    sesion: 6,
    titulo: 'Regulación y gobernanza: del texto a la práctica',
    titular: 'Regulación y gobernanza: del texto a la práctica',
    subtitulo: '',
    cifras: [],
    diagrama: {
      tipo: 'ciclo',
      titulo: '',
      items: [
        { text: 'Inventario', cifras: [] },
        { text: 'Clasificar riesgo', cifras: [] },
        { text: 'Evaluar', cifras: [] },
        { text: 'Supervisar', cifras: [] },
        { text: 'Monitorear incidentes', cifras: [] },
        { text: 'Corregir', cifras: [] }
      ]
    },
    ideaCentral: { text: 'Gobernar sistemas sociotécnicos, no solo modelos', cifras: [] },
    pie: null,
    rotulos: {
      lineaTitulo: { text: 'Línea de tiempo para modelos GPAI' },
      ago2025: { text: 'Ago 2025: aplican las obligaciones', cifras: ['ries-3'] },
      ago2026: { text: 'Ago 2026: la Comisión puede hacerlas cumplir', cifras: ['ries-3'] },
      ago2027: { text: 'Ago 2027: plazo para los modelos previos a agosto de 2025', cifras: ['ries-3'] },
      omnibus: {
        text: 'el Ómnibus Digital (2026) aplazó las reglas de alto riesgo a diciembre de 2027 y agosto de 2028',
        cifras: ['ries-4']
      }
    },
    notas: {
      decir: '',
      nota: 'el Ómnibus Digital (2026) aplazó las reglas de alto riesgo a diciembre de 2027 y agosto de 2028 ([calendario][aisd]).',
      metafora: ''
    },
    kb: [
      {
        label: '',
        text: 'Línea de tiempo para modelos GPAI ([Comisión Europea][ec-gpai-gl]):',
        items: [
          'Ago 2025: aplican las obligaciones;',
          'Ago 2026: la Comisión puede hacerlas cumplir;',
          'Ago 2027: plazo para los modelos previos a agosto de 2025.'
        ]
      },
      {
        label: 'Nota',
        text: 'el Ómnibus Digital (2026) aplazó las reglas de alto riesgo a diciembre de 2027 y agosto de 2028 ([calendario][aisd]).'
      },
      {
        label: 'Diagrama',
        text: 'el ciclo de seis pasos alrededor de un volante con un disco de freno: Inventario → Clasificar riesgo → Evaluar → Supervisar → Monitorear incidentes → Corregir.'
      },
      { label: 'Idea central', text: '«Gobernar sistemas sociotécnicos, no solo modelos».' }
    ],
    contenido: [4, 5, 7]
  },
  {
    id: 'd15',
    n: 15,
    sesion: 7,
    titulo: 'América Latina y Colombia: consumo rápido, capacidad por construir',
    titular: 'América Latina y Colombia: consumo rápido, capacidad por construir',
    subtitulo: '',
    cifras: [
      { valor: '14% vs 11%', etiqueta: '', cifras: ['alc-1'] },
      { valor: '55,84', etiqueta: 'Colombia en el ILIA 2025, cuarta en la región', cifras: ['alc-3'] },
      {
        valor: '479.273',
        etiqueta: 'millones de pesos y 106 acciones hasta 2030 en el CONPES 4144',
        cifras: ['alc-4']
      }
    ],
    diagrama: {
      tipo: 'flujo',
      titulo: '',
      items: [
        { text: 'Adoptante', cifras: [] },
        { text: 'Cómputo, datos y talento', cifras: [] },
        { text: 'Soberanía', cifras: [] }
      ]
    },
    ideaCentral: { text: 'Convertir consumo en capacidad productiva y científica', cifras: [] },
    pie: null,
    rotulos: {
      orillaUso: { text: 'Uso' },
      orillaCapacidad: { text: 'Capacidad propia' }
    },
    notas: {
      decir: '',
      nota: '',
      metafora: 'puente colgante entre la orilla «Uso», iluminada, y la orilla «Capacidad propia», en construcción.',
      correcciones: ['conpes']
    },
    kb: [
      {
        label: 'Cifras',
        text: '',
        items: [
          '«14% vs 11%» ([CEPAL][cepal-pr]);',
          '«55,84»: Colombia en el ILIA 2025, cuarta en la región ([Minciencias][minciencias]);',
          '«479.000»: millones de pesos y más de 100 acciones hasta 2030 en el CONPES 4144 ([DNP][dnp]). Las cifras exactas son 479.273 millones y 106 acciones.'
        ]
      },
      { label: 'Diagrama', text: 'Adoptante → Cómputo, datos y talento → Soberanía.' },
      {
        label: 'Metáfora',
        text: 'puente colgante entre la orilla «Uso», iluminada, y la orilla «Capacidad propia», en construcción.'
      },
      { label: 'Idea central', text: '«Convertir consumo en capacidad productiva y científica».' }
    ],
    contenido: [1, 2, 3, 4]
  },
  {
    id: 'd16',
    n: 16,
    sesion: 7,
    titulo: 'Agenda 2026–2028',
    titular: 'Agenda 2026–2028',
    subtitulo: '',
    cifras: [],
    diagrama: {
      tipo: 'linea',
      titulo: 'Hoja de ruta en tres carriles',
      hitos: ['2026', '2027', '2028'],
      items: [
        { text: 'medición, cómputo compartido, regulación por riesgo', cifras: [], carril: 'Gobiernos' },
        {
          text: 'política común, alfabetización transversal, evaluación auténtica',
          cifras: [],
          carril: 'Universidades'
        },
        {
          text: 'pocos flujos de alto valor, línea base, agentes con permisos mínimos',
          cifras: [],
          carril: 'Organizaciones'
        }
      ]
    },
    ideaCentral: { text: 'Indicador común: valor verificable, costo total y riesgo controlado', cifras: [] },
    pie: null,
    rotulos: {
      nota: { text: 'el orden por año es una secuencia propuesta' }
    },
    notas: {
      decir: '',
      nota: 'el orden por año es una secuencia propuesta; el informe no fija un año para cada acción.',
      metafora: 'camino con hitos y brújula.'
    },
    kb: [
      {
        label: '',
        text: 'Hoja de ruta en tres carriles, con hitos en 2026, 2027 y 2028:',
        items: [
          'Gobiernos: medición, cómputo compartido, regulación por riesgo.',
          'Universidades: política común, alfabetización transversal, evaluación auténtica.',
          'Organizaciones: pocos flujos de alto valor, línea base, agentes con permisos mínimos.'
        ]
      },
      { label: 'Metáfora', text: 'camino con hitos y brújula.' },
      {
        label: 'Idea central',
        text: '«Indicador común: valor verificable, costo total y riesgo controlado».'
      },
      {
        label: 'Nota',
        text: 'el orden por año es una secuencia propuesta; el informe no fija un año para cada acción.'
      }
    ],
    contenido: [6, 7]
  },
  {
    id: 'd17',
    n: 17,
    sesion: 7,
    titulo: 'Cinco mensajes para decidir',
    titular: 'Cinco mensajes para decidir',
    subtitulo: '',
    cifras: [],
    diagrama: {
      tipo: 'tarjetas',
      titulo: '',
      items: [
        { text: 'La capacidad es irregular.', cifras: [], signo: 'cordillera' },
        {
          text: 'Adopción no es valor (88% de uso frente a 39% con impacto en EBIT).',
          cifras: ['adop-1', 'adop-5'],
          signo: 'iceberg'
        },
        { text: 'En el trabajo cambian tareas, no solo puestos.', cifras: [], signo: 'escalera' },
        { text: 'En educación se evalúa el aprendizaje, no el texto.', cifras: [], signo: 'lancha' },
        { text: 'La gobernanza es proporcional al riesgo.', cifras: [], signo: 'volante' }
      ]
    },
    ideaCentral: null,
    pie: { text: 'Stanford, McKinsey, OIT, UNESCO, CEPAL, Comisión Europea' },
    rotulos: {
      fraseFinal: { text: 'No importa cuánta IA se usa, sino cuánto valor verificable produce' }
    },
    notas: { decir: '', nota: '', metafora: 'brújula sobre el mar que apunta a un faro.' },
    kb: [
      { label: '', text: 'Cinco tarjetas con ícono (ver el contenido 9).' },
      { label: 'Metáfora', text: 'brújula sobre el mar que apunta a un faro.' },
      { label: 'Frase final', text: '«No importa cuánta IA se usa, sino cuánto valor verificable produce».' },
      { label: 'Pie', text: 'Stanford, McKinsey, OIT, UNESCO, CEPAL, Comisión Europea.' }
    ],
    contenido: [9]
  }
];
