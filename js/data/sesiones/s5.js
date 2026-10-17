/* js/data/sesiones/s5.js — sesión 5, KB §8 (prompt §5.3; shape in odd/spec/data-model.md).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.sesiones[5] = { n, titulo, tema, signo, tesis, diapositivas, diapositivasMapa, laminas, videos,
 *   producto, productoSesion, pregunta, resultados, agendaTitulo, agenda: [{ desde, hasta, minutos, bloque, recurso }],
 *   bloques, contenido: [{ n, titulo, complemento?, cuerpo, bloque? }], actualizaciones: [{ contenido, fuente, caja? }],
 *   errores, actividades, discusionTitulo, discusion, quiz: [{ pregunta, opciones, respuesta, letra, explicacion, pista }], lecturas,
 *   facilitador: { laminas: { dNN: { decir, nota } }, claves: [{ actividad, titulo }] } }
 * Text fields keep the KB markup: [Etiqueta][clave], **negrita**, *cursiva*, "- " lists (two spaces per level),
 * "1. " lists, pipe tables; numbers from registered figures are wrapped as {{id|texto}}.
 */
EIA.data.sesiones[5] = {
  n: 5,
  titulo: 'Ciencia y medicina',
  tema: 'Ciencia y medicina',
  signo: 'microscopio',
  tesis: 'La IA acelera piezas del trabajo científico y clínico, pero la evidencia de impacto real es desigual: de más de {{med-3|500}} estudios médicos revisados, solo {{med-3|5%}} usó datos clínicos reales ([Stanford, cap. 6][hai6]).',
  diapositivas: '11 y 12',
  diapositivasMapa: '11–12',
  laminas: ['d11', 'd12'],
  videos: ['v07'],
  producto: 'Semáforo de evidencia',
  productoSesion: 'semáforo de evidencia del caso',
  pregunta: '¿Qué evidencia basta para confiar?',
  resultados: [
    'Explicar qué partes del ciclo científico acelera la IA y cuáles no.',
    'Graduar la evidencia, del benchmark al ensayo aleatorizado y el seguimiento posdespliegue.',
    'Aplicar un semáforo de evidencia a un caso propio.'
  ],
  agendaTitulo: 'Agenda (120 min)',
  agenda: [
    {
      desde: 0,
      hasta: 30,
      minutos: '0–30',
      bloque: 'Ciencia: producción, frontera irregular y ciclo científico',
      recurso: 'Diapositiva 11'
    },
    {
      desde: 30,
      hasta: 60,
      minutos: '30–60',
      bloque: 'Medicina: el semáforo clínico',
      recurso: 'Diapositiva 12'
    },
    { desde: 60, hasta: 75, minutos: '60–75', bloque: 'Escalera de evidencia', recurso: 'Contenido 6' },
    {
      desde: 75,
      hasta: 110,
      minutos: '75–110',
      bloque: 'Semáforo de evidencia del caso',
      recurso: 'Actividad'
    },
    { desde: 110, hasta: 120, minutos: '110–120', bloque: 'Discusión y quiz', recurso: '—' }
  ],
  bloques: ['Ciencia', 'Medicina'],
  contenido: [
    {
      n: 1,
      titulo: 'Más ciencia con IA',
      cuerpo: 'Las publicaciones de ciencias naturales relacionadas con IA llegaron a cerca de {{cien-1|80.150}} en 2025, frente a {{cien-1|63.547}} en 2024, un aumento de {{cien-1|26%}} ([Stanford, cap. 5][hai5]). Según el informe base, la IA ya representa entre {{cien-2|5,8%}} y {{cien-2|8,8%}} de la producción científica, según el campo, frente a menos de {{cien-2|1%}} en 2010 ([Stanford, Ciencia][hai-sci]). Hay modelos fundacionales en astronomía, meteorología, biología molecular, química y ciencias de la Tierra.',
      bloque: 'Ciencia'
    },
    {
      n: 2,
      titulo: 'Frontera irregular en el laboratorio',
      cuerpo: 'Los modelos superan en promedio a químicos humanos en ChemBench ([Stanford, Ciencia][hai-sci]). Pero logran menos de {{cap-5|20%}} al replicar investigaciones de astrofísica. En PaperArena, el mejor agente (Gemini 2.5 Pro en configuración multiagente) logra {{cap-6|38,8%}} frente a {{cap-6|83,5%}} de expertos doctorales ([Stanford, cap. 5][hai5]).',
      bloque: 'Ciencia'
    },
    {
      n: 3,
      titulo: 'Piezas, no el ciclo completo',
      cuerpo: 'El ciclo científico va de la hipótesis al diseño, la ejecución, la validación y la interpretación. La IA ilumina en parte los primeros pasos; validar e interpretar sigue dependiendo del juicio experto. En 2025, un taller con revisión por pares aceptó un artículo generado íntegramente por IA, pero los descubrimientos experimentales confirmados siguen siendo pocos ([Stanford, Ciencia][hai-sci]). Producir manuscritos no es producir conocimiento válido.',
      bloque: 'Ciencia'
    },
    {
      n: 4,
      titulo: 'Adecuación al propósito',
      cuerpo: 'Un modelo de proteínas de {{cap-12|111 millones}} de parámetros y uno genómico de {{cap-12|200 millones}} superaron a sistemas mucho mayores en evaluaciones específicas ([Stanford, Medicina][hai-med]).',
      bloque: 'Ciencia'
    },
    {
      n: 5,
      titulo: 'El semáforo clínico',
      complemento: '([Stanford, cap. 6][hai6])',
      cuerpo: '- *Verde, apoyo al flujo de trabajo:* médicos de Sharp HealthCare reportan hasta {{med-1|83%}} menos tiempo escribiendo notas clínicas.\n- *Ámbar, resultado de laboratorio:* un sistema multiagente logró {{med-2|85,5%}} en casos difíciles publicados en NEJM. Un grupo de {{med-2|21}} médicos con {{ctx-medicos-experiencia|5 a 20 años de experiencia}}, que trabajó sin sus herramientas habituales, logró cerca de {{med-2|20%}}. No es práctica clínica.\n- *Rojo, evidencia insuficiente:*\n  - De más de {{med-3|500}} estudios, casi la mitad usó preguntas tipo examen y solo {{med-3|5%}} usó datos clínicos reales.\n  - En una evaluación abierta, modelos generales dieron entre {{med-4|11,8}} y {{med-4|14,6}} recomendaciones gravemente dañinas por cada {{med-4|100}} casos (dato del informe base).\n  - La FDA autorizó {{med-5|258}} dispositivos con IA en 2025, cerca de {{med-5|1.400}} en total. La mayoría entró por vías que no exigen nuevos ensayos.\n  - De {{med-6|1.016}} autorizaciones hasta diciembre de 2024, solo {{med-6|2,4%}} de los dispositivos con estudios clínicos tuvo evidencia de ensayos aleatorizados.\n- Prioridades: validación externa, seguimiento posdespliegue, representatividad poblacional, interacción humano–IA y responsabilidad clínica.',
      bloque: 'Medicina'
    },
    {
      n: 6,
      titulo: 'Escalera de evidencia',
      cuerpo: 'Es una herramienta del curso que ordena las afirmaciones de menor a mayor solidez:\n1. Puntaje en un benchmark o examen.\n2. Casos publicados o simulados.\n3. Datos retrospectivos reales del contexto.\n4. Validación externa en otra institución o población.\n5. Ensayo aleatorizado o diseño cuasiexperimental sólido.\n6. Seguimiento posdespliegue con monitoreo de daños.',
      bloque: 'Medicina'
    }
  ],
  actualizaciones: [],
  errores: [
    'Tomar un puntaje en un examen médico como efectividad clínica.',
    'Confundir la autorización regulatoria con evidencia aleatorizada.',
    'Atribuir el 2,4% a los 258 dispositivos autorizados en 2025.',
    'Contar los artículos aceptados como si fueran descubrimientos.'
  ],
  actividades: ['s5-escalera', 's5-semaforo'],
  discusionTitulo: 'Discusión',
  discusion: [
    '¿Qué tendría que pasar para que usted confiara en un sistema de diagnóstico con IA en su sistema de salud?',
    '¿Cómo distinguiría un avance científico real de un manuscrito producido en masa?'
  ],
  quiz: [
    {
      pregunta: '¿Qué proporción de los estudios médicos revisados usó datos clínicos reales?',
      opciones: ['50%', '5%', '83%'],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'en el semáforo clínico, esta cifra está en la luz roja: evidencia insuficiente.'
    },
    {
      pregunta: 'El 2,4% con ensayos aleatorizados se refiere a:',
      opciones: [
        'los 258 dispositivos de 2025',
        'los dispositivos con estudios clínicos, entre 1.016 autorizaciones hasta 2024',
        'todos los estudios con modelos de lenguaje'
      ],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'ese porcentaje no sale de los dispositivos de un solo año.'
    },
    {
      pregunta: 'En la replicación de investigaciones de astrofísica, la IA logra:',
      opciones: ['más de 80%', 'menos de 20%', '38,8%'],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'en la frontera irregular, replicar investigaciones de astrofísica es un valle, no un pico.'
    }
  ],
  lecturas: ['informe base («Ciencia y medicina»)', '[Stanford, Ciencia][hai-sci]', '[Stanford, Medicina][hai-med]'],
  facilitador: {
    laminas: {
      d11: { decir: '', nota: '' },
      d12: { decir: '', nota: '' }
    },
    claves: [
      { actividad: 's5-escalera', titulo: 'Clave orientativa para el docente' }
    ]
  }
};
