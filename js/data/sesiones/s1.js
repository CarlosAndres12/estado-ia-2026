/* js/data/sesiones/s1.js — sesión 1, KB §4 (prompt §5.3; shape in odd/spec/data-model.md).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.sesiones[1] = { n, titulo, tema, signo, tesis, diapositivas, diapositivasMapa, laminas, videos,
 *   producto, productoSesion, pregunta, resultados, agendaTitulo, agenda: [{ desde, hasta, minutos, bloque, recurso }],
 *   bloques, contenido: [{ n, titulo, complemento?, cuerpo, bloque? }], actualizaciones: [{ contenido, fuente, caja? }],
 *   errores, actividades, discusionTitulo, discusion, quiz: [{ pregunta, opciones, respuesta, letra, explicacion, pista }], lecturas,
 *   facilitador: { laminas: { dNN: { decir, nota } }, claves: [{ actividad, titulo }] } }
 * Text fields keep the KB markup: [Etiqueta][clave], **negrita**, *cursiva*, "- " lists (two spaces per level),
 * "1. " lists, pipe tables; numbers from registered figures are wrapped as {{id|texto}}.
 */
EIA.data.sesiones[1] = {
  n: 1,
  titulo: 'Adopción masiva, valor por demostrar',
  tema: 'Adopción masiva, valor por demostrar',
  signo: 'iceberg',
  tesis: 'La IA ya es infraestructura de uso general, pero su valor no está demostrado. El {{adop-1|88%}} de las organizaciones la usa en al menos una función y solo {{adop-5|39%}} reporta algún impacto en EBIT, casi siempre menor de {{adop-5|5%}} ([McKinsey, 2025][mck25]).',
  diapositivas: '1 y 2',
  diapositivasMapa: '1–2',
  laminas: ['d01', 'd02'],
  videos: ['v01', 'v02'],
  producto: 'Ficha del caso de uso',
  productoSesion: 'ficha del caso de uso',
  pregunta: '¿Qué mide realmente cada cifra sobre IA?',
  resultados: [
    'Explicar la tesis del curso: adopción no equivale a valor.',
    'Clasificar una cifra según el tipo de evidencia que aporta.',
    'Reconocer el alcance y los sesgos de cada tipo de fuente.'
  ],
  agendaTitulo: 'Agenda (120 min)',
  agenda: [
    {
      desde: 0,
      hasta: 15,
      minutos: '0–15',
      bloque: 'Encuadre con la metáfora del iceberg',
      recurso: 'Diapositiva 1'
    },
    {
      desde: 15,
      hasta: 45,
      minutos: '15–45',
      bloque: 'Cómo leer la evidencia sobre IA',
      recurso: 'Sección 3'
    },
    {
      desde: 45,
      hasta: 70,
      minutos: '45–70',
      bloque: 'Ejercicio «¿Qué mide esta cifra?»',
      recurso: 'Actividad 1'
    },
    { desde: 70, hasta: 105, minutos: '70–105', bloque: 'Elección del caso de uso', recurso: 'Actividad 2' },
    {
      desde: 105,
      hasta: 120,
      minutos: '105–120',
      bloque: 'Ruta del curso, discusión y quiz',
      recurso: 'Diapositiva 2'
    }
  ],
  bloques: [],
  contenido: [
    {
      n: 1,
      titulo: 'Adopción masiva, valor por demostrar',
      cuerpo: 'En 2026 la IA pasó de tecnología experimental a infraestructura de propósito general en organizaciones, educación, ciencia y medicina. La transición está incompleta: cerca de dos tercios de las organizaciones no han escalado la IA a toda la organización ([McKinsey, 2025][mck25]). Lo visible, el uso, es la punta del iceberg. Debajo quedan escala, valor y gobernanza.'
    },
    {
      n: 2,
      titulo: 'Cinco tipos de evidencia',
      cuerpo: 'Los titulares mezclan capacidad técnica, uso declarado, resultado observado, expectativa y proyección. Cada tipo responde a una pregunta distinta (sección 3.1).'
    },
    {
      n: 3,
      titulo: 'No todas las fuentes valen lo mismo',
      cuerpo: 'Un índice comparable, una encuesta de percepción y un benchmark miden cosas diferentes (sección 3.2).'
    },
    {
      n: 4,
      titulo: 'Cobertura no es representatividad',
      cuerpo: 'Una encuesta grande sigue siendo una muestra de informantes, no un censo de empresas.'
    },
    {
      n: 5,
      titulo: 'La pregunta del curso',
      cuerpo: '¿Cuánto valor verificable produce la IA, para quién y con qué controles?'
    }
  ],
  actualizaciones: [],
  errores: [
    'Tomar el uso declarado («88% usa IA») como prueba de impacto.',
    'Leer un porcentaje de encuesta como si fuera un censo de empresas.',
    'Citar una proyección como si fuera un hecho observado.'
  ],
  actividades: ['s1-que-mide', 's1-ficha-caso'],
  discusionTitulo: 'Discusión',
  discusion: [
    '¿Qué cifra sobre IA escuchó recientemente y qué tipo de evidencia era?',
    '¿Por qué una organización puede usar IA a diario sin obtener valor?'
  ],
  quiz: [
    {
      pregunta: '«88% de las organizaciones usa IA» es:',
      opciones: ['resultado observado', 'uso declarado', 'proyección'],
      respuesta: 1,
      letra: 'b',
      explicacion: 'Es lo que reportan los encuestados, no un impacto medido.',
      pista: '¿alguien midió un impacto o los encuestados dijeron algo?'
    },
    {
      pregunta: 'Un benchmark alto demuestra:',
      opciones: ['desempeño en el trabajo real', 'desempeño en condiciones controladas', 'impacto económico'],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'recuerda la segunda advertencia del curso.'
    },
    {
      pregunta: '¿Qué fuente se basa sobre todo en percepciones de encuestados?',
      opciones: ['OIT', 'McKinsey', 'CEPAL'],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'en la tabla «Qué mide cada fuente», dos de estas fuentes aparecen juntas con indicadores comparables entre países.'
    }
  ],
  lecturas: [
    'informe base («Resumen ejecutivo» y «Alcance y método»)',
    '[Stanford AI Index 2026][hai]',
    '[McKinsey, The state of AI in 2025][mck25]'
  ],
  facilitador: {
    laminas: {
      d01: {
        decir: 'lo visible es el uso; lo que decide el valor está bajo la superficie ([McKinsey, 2025][mck25]).',
        nota: ''
      },
      d02: { decir: '', nota: '' }
    },
    claves: [
      { actividad: 's1-que-mide', titulo: 'Clave para el docente' }
    ]
  }
};
