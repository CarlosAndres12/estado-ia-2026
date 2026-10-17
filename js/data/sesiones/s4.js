/* js/data/sesiones/s4.js — sesión 4, KB §7 (prompt §5.3; shape in odd/spec/data-model.md).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.sesiones[4] = { n, titulo, tema, signo, tesis, diapositivas, diapositivasMapa, laminas, videos,
 *   producto, productoSesion, pregunta, resultados, agendaTitulo, agenda: [{ desde, hasta, minutos, bloque, recurso }],
 *   bloques, contenido: [{ n, titulo, complemento?, cuerpo, bloque? }], actualizaciones: [{ contenido, fuente, caja? }],
 *   errores, actividades, discusionTitulo, discusion, quiz: [{ pregunta, opciones, respuesta, letra, explicacion, pista }], lecturas,
 *   facilitador: { laminas: { dNN: { decir, nota } }, claves: [{ actividad, titulo }] } }
 * Text fields keep the KB markup: [Etiqueta][clave], **negrita**, *cursiva*, "- " lists (two spaces per level),
 * "1. " lists, pipe tables; numbers from registered figures are wrapped as {{id|texto}}.
 */
EIA.data.sesiones[4] = {
  n: 4,
  titulo: 'Trabajo y educación superior',
  tema: 'Trabajo y educación',
  signo: 'escalera',
  tesis: 'La IA transforma tareas antes que puestos: {{trab-1|25%}} del empleo mundial tiene alguna exposición y solo {{trab-2|3,3%}} está en la categoría más alta ([OIT, 2025][ilo]). En la universidad se usa más de lo que se gobierna: {{edu-1|86%}} de los estudiantes la usa y {{edu-3|58%}} dice no tener habilidades suficientes ([Digital Education Council, 2024][dec]).',
  diapositivas: '9 y 10',
  diapositivasMapa: '9–10',
  laminas: ['d09', 'd10'],
  videos: ['v05', 'v06'],
  producto: 'Análisis de tareas y evaluación rediseñada',
  productoSesion: 'análisis de tareas y evaluación rediseñada',
  pregunta: '¿Qué tareas cambian y cómo evaluamos el aprendizaje?',
  resultados: [
    'Diferenciar exposición, automatización y desplazamiento.',
    'Identificar los grupos con mayor presión: ocupaciones administrativas, mujeres, jóvenes y puestos de entrada.',
    'Rediseñar una evaluación con producto auténtico, bitácora de proceso, defensa oral y uso declarado de IA.'
  ],
  agendaTitulo: 'Agenda (120 min)',
  agenda: [
    {
      desde: 0,
      hasta: 30,
      minutos: '0–30',
      bloque: 'Trabajo: exposición, desigualdad y puestos de entrada',
      recurso: 'Diapositiva 9'
    },
    { desde: 30, hasta: 50, minutos: '30–50', bloque: 'Tareas del caso', recurso: 'Actividad A' },
    {
      desde: 50,
      hasta: 75,
      minutos: '50–75',
      bloque: 'Universidad: adopción, preparación y evaluación',
      recurso: 'Diapositiva 10'
    },
    { desde: 75, hasta: 110, minutos: '75–110', bloque: 'Rediseño de una evaluación', recurso: 'Actividad B' },
    { desde: 110, hasta: 120, minutos: '110–120', bloque: 'Discusión y quiz', recurso: '—' }
  ],
  bloques: ['Trabajo', 'Educación superior'],
  contenido: [
    {
      n: 1,
      titulo: 'Exposición no es pérdida',
      cuerpo: 'La OIT estima que {{trab-1|25%}} del empleo mundial está en ocupaciones con alguna exposición a la IA generativa: {{trab-1|34%}} en los países de ingresos altos y {{trab-1|11%}} en los de ingresos bajos. Solo {{trab-2|3,3%}} está en la categoría de exposición más alta, y la OIT considera más probable la transformación de tareas que la desaparición de puestos ([OIT, 2025][ilo]; [nota de prensa][ilo-news]).',
      bloque: 'Trabajo'
    },
    {
      n: 2,
      titulo: 'Tres conceptos distintos',
      cuerpo: 'Una ocupación *expuesta* tiene tareas que la IA puede apoyar o realizar. La *automatización* efectiva exige además integración organizacional. El *desplazamiento* depende también de la demanda, los costos, la regulación, la reorganización y las nuevas tareas. Por eso las cifras de exposición no son pronósticos de desempleo.',
      bloque: 'Trabajo'
    },
    {
      n: 3,
      titulo: 'Distribución desigual',
      cuerpo: 'Las ocupaciones administrativas son las más expuestas, y la multimodalidad amplía el alcance a medios, software y finanzas. La exposición más alta afecta a {{trab-3|4,7%}} del empleo femenino mundial y a {{trab-3|2,4%}} del masculino. En los países de ingresos altos, la diferencia es {{trab-3|9,6%}} frente a {{trab-3|3,5%}} ([OIT, 2025][ilo]).',
      bloque: 'Trabajo'
    },
    {
      n: 4,
      titulo: 'Presión en los puestos de entrada',
      cuerpo: 'El empleo de desarrolladores de software de {{trab-4|22}} a {{trab-4|25}} años cayó casi {{trab-4|20%}} desde 2024, aunque las pérdidas agregadas de empleo aún no muestran un patrón general ([Stanford, cap. 4][hai4]). Una hipótesis plausible, no demostrada, es que se automatizan las tareas que antes servían de escalón de entrada.',
      bloque: 'Trabajo'
    },
    {
      n: 5,
      titulo: 'Competencias que cambian',
      cuerpo: 'El {{trab-5|39%}} de las competencias centrales cambiará hacia 2030 ([WEF, 2025][wef-jobs]). Las que más rápido crecen son IA y datos, redes y ciberseguridad, y alfabetización tecnológica. Pensamiento creativo, resiliencia, flexibilidad y colaboración siguen siendo críticos. El informe base propone un marco de alfabetización avanzada con siete capacidades:\n- comprender capacidades y límites de la IA;\n- formular problemas y elegir herramientas;\n- verificar fuentes, sesgos e incertidumbre;\n- proteger datos y propiedad intelectual;\n- diseñar y supervisar flujos humano–IA;\n- documentar decisiones y asumir responsabilidad;\n- evaluar efectos en calidad, productividad, aprendizaje y equidad.',
      bloque: 'Trabajo'
    },
    {
      n: 6,
      titulo: 'Uso masivo',
      cuerpo: '- En Estados Unidos, cuatro de cada cinco estudiantes de secundaria y universidad usan IA generativa. A nivel global, Stanford cita una encuesta de Chegg (2025) con {{edu-4|80%}} de universitarios en {{edu-4|15}} países ([Stanford, cap. 7][hai7]).\n- La encuesta mundial del Digital Education Council ({{edu-1|3.839}} estudiantes de {{edu-1|16}} países) halló {{edu-1|86%}} de uso y {{edu-1|54%}} de uso al menos semanal. ChatGPT fue la herramienta más usada, con {{edu-1|66%}} ([DEC, 2024][dec]).\n- El {{edu-2|24%}} de uso diario aparece en la cobertura de [Campus Technology][ct].',
      bloque: 'Educación superior'
    },
    {
      n: 7,
      titulo: 'Uso no es preparación',
      cuerpo: 'El {{edu-3|58%}} dice no tener conocimientos ni habilidades suficientes en IA. El {{edu-3|48%}} no se siente preparado para un mercado laboral con IA. El {{edu-3|80%}} considera que la integración de la IA en su universidad no cumple sus expectativas ([DEC, 2024][dec]).',
      bloque: 'Educación superior'
    },
    {
      n: 8,
      titulo: 'Profesorado sin respaldo suficiente',
      cuerpo: 'En una encuesta de UNESCO a cátedras UNESCO y redes UNITWIN (unas {{edu-5|400}} respuestas de {{edu-5|90}} países), nueve de cada diez usan IA en su trabajo profesional ([UNESCO, 2025][unesco]). Pero más de la mitad se siente insegura o dubitativa para usarla en docencia o investigación. Dos tercios de las instituciones tienen lineamientos de uso o están preparándolos. La brecha es de formación, tiempo, soporte, seguridad jurídica y claridad institucional, no de mera resistencia.',
      bloque: 'Educación superior'
    },
    {
      n: 9,
      titulo: 'Evaluar el aprendizaje, no el texto',
      cuerpo: 'Perseguir la detección perfecta de texto generado no es sostenible. Las prácticas emergentes son el producto auténtico, la bitácora de proceso, la defensa oral, las versiones sucesivas, la reflexión metacognitiva y el uso declarado de IA ([EDUCAUSE, 2026][edu]; [CSUN][csun]). La pregunta pasa de «¿usó IA?» a «¿qué aprendió, qué decidió y puede justificarlo?».',
      bloque: 'Educación superior'
    },
    {
      n: 10,
      titulo: 'Riesgos para el aprendizaje',
      cuerpo: 'La IA puede mejorar la tutoría, la retroalimentación y la accesibilidad. También puede generar dependencia cognitiva, respuestas homogéneas y aprendizaje superficial. El *International AI Safety Report 2026* advierte efectos sobre las habilidades cognitivas, la formación de creencias y la autonomía ([IASR 2026][iasr-pdf]). Conviene preservar actividades sin IA cuando forman habilidades fundamentales.',
      bloque: 'Educación superior'
    },
    {
      n: 11,
      titulo: 'Agenda universitaria en cinco frentes',
      cuerpo: '- Gobernanza: política, responsables y gestión de incidentes.\n- Currículo: alfabetización transversal y por disciplina.\n- Evaluación: diseños auténticos y usos permitidos explícitos.\n- Infraestructura: herramientas aprobadas y protección de datos.\n- Investigación: protocolos de uso en revisión, análisis, escritura y autoría.',
      bloque: 'Educación superior'
    }
  ],
  actualizaciones: [],
  errores: [
    'Presentar las cifras de exposición como pronósticos de desempleo.',
    'Suponer que el uso estudiantil equivale a aprendizaje.',
    'Creer que prohibir o detectar reemplaza el rediseño de la evaluación.',
    'Citar «4 de cada 5 estudiantes» como si fuera un dato mundial.'
  ],
  actividades: ['s4-tareas', 's4-evaluacion'],
  discusionTitulo: 'Discusión',
  discusion: [
    '¿Qué pasa con la formación de las personas nuevas si la IA hace sus tareas de aprendizaje?',
    '¿Qué actividades de su curso o equipo deberían quedar libres de IA y por qué?'
  ],
  quiz: [
    {
      pregunta: '¿Qué proporción del empleo mundial está en la categoría de exposición más alta?',
      opciones: ['25%', '3,3%', '34%'],
      respuesta: 1,
      letra: 'b',
      explicacion: 'El 25% es «alguna exposición» y el 34% corresponde a los países de ingresos altos.',
      pista: 'distingue «alguna exposición» de la categoría de exposición más alta: no son la misma cifra.'
    },
    {
      pregunta: 'En la exposición máxima mundial:',
      opciones: ['mujeres 4,7% y hombres 2,4%', 'igual para ambos', 'hombres 4,7% y mujeres 2,4%'],
      respuesta: 0,
      letra: 'a',
      explicacion: '',
      pista: 'revisa qué grupos tienen mayor presión según los resultados de aprendizaje de esta sesión.'
    },
    {
      pregunta: '¿Qué porcentaje de estudiantes dice no tener habilidades suficientes en IA?',
      opciones: ['86%', '58%', '24%'],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'el 86% mide uso, y la sesión insiste en que uso no es preparación.'
    }
  ],
  lecturas: [
    'informe base («Trabajo y habilidades» y «Educación superior»)',
    '[OIT, 2025][ilo]',
    '[EDUCAUSE Horizon Report 2026 (PDF)][edu]'
  ],
  facilitador: {
    laminas: {
      d09: { decir: '', nota: '' },
      d10: { decir: '', nota: 'se retiró el «34%» del guion original porque no está en la fuente.' }
    },
    claves: []
  }
};
