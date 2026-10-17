/* js/data/sesiones/s6.js — sesión 6, KB §9 (prompt §5.3; shape in odd/spec/data-model.md).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.sesiones[6] = { n, titulo, tema, signo, tesis, diapositivas, diapositivasMapa, laminas, videos,
 *   producto, productoSesion, pregunta, resultados, agendaTitulo, agenda: [{ desde, hasta, minutos, bloque, recurso }],
 *   bloques, contenido: [{ n, titulo, complemento?, cuerpo, bloque? }], actualizaciones: [{ contenido, fuente, caja? }],
 *   errores, actividades, discusionTitulo, discusion, quiz: [{ pregunta, opciones, respuesta, letra, explicacion, pista }], lecturas,
 *   facilitador: { laminas: { dNN: { decir, nota } }, claves: [{ actividad, titulo }] } }
 * Text fields keep the KB markup: [Etiqueta][clave], **negrita**, *cursiva*, "- " lists (two spaces per level),
 * "1. " lists, pipe tables; numbers from registered figures are wrapped as {{id|texto}}.
 */
EIA.data.sesiones[6] = {
  n: 6,
  titulo: 'Riesgo, regulación y gobernanza',
  tema: 'Riesgo y gobernanza',
  signo: 'volante',
  tesis: 'Los riesgos crecen junto con las capacidades. Los incidentes documentados pasaron de {{ries-1|233}} en 2024 a {{ries-1|362}} en 2025, un aumento de {{ries-1|55%}} ([Stanford, cap. 3][hai3]). La respuesta es una gobernanza proporcional al riesgo que pase del texto a la práctica.',
  diapositivas: '13 y 14',
  diapositivasMapa: '13–14',
  laminas: ['d13', 'd14'],
  videos: ['v08'],
  producto: 'Ciclo de gobernanza',
  productoSesion: 'ciclo de gobernanza del caso',
  pregunta: '¿Qué controles son proporcionales al riesgo?',
  resultados: [
    'Clasificar los riesgos en uso malicioso, fallos y riesgos sistémicos.',
    'Interpretar con cautela los conteos de incidentes.',
    'Explicar el calendario de la Ley de IA de la UE, incluido el Ómnibus Digital de 2026.',
    'Diseñar un ciclo de gobernanza de seis pasos para un caso real.'
  ],
  agendaTitulo: 'Agenda (120 min)',
  agenda: [
    {
      desde: 0,
      hasta: 30,
      minutos: '0–30',
      bloque: 'Perfil de riesgo e incidentes',
      recurso: 'Diapositiva 13'
    },
    { desde: 30, hasta: 55, minutos: '30–55', bloque: 'Ley de IA de la UE', recurso: 'Diapositiva 14' },
    { desde: 55, hasta: 70, minutos: '55–70', bloque: 'Gobernanza organizacional', recurso: 'Contenido 7' },
    { desde: 70, hasta: 110, minutos: '70–110', bloque: 'Ciclo de gobernanza del caso', recurso: 'Actividad' },
    { desde: 110, hasta: 120, minutos: '110–120', bloque: 'Discusión y quiz', recurso: '—' }
  ],
  bloques: [],
  contenido: [
    {
      n: 1,
      titulo: 'Tres familias de riesgo',
      cuerpo: 'El *International AI Safety Report 2026* se publicó el {{ries-2|3 de febrero de 2026}}, con más de {{ries-2|100}} expertos y el respaldo de más de {{ries-2|30}} países y organizaciones internacionales ([IASR 2026][iasr]).\n- Agrupa los riesgos en uso malicioso, fallos y riesgos sistémicos.\n- Incluyen apoyo a ciberataques y desinformación, comportamientos imprevistos, concentración de poder, impactos laborales y erosión de la autonomía.\n- Recomienda combinar evaluaciones, modelado de amenazas, reporte de incidentes y resiliencia institucional ([resumen ejecutivo][iasr-es]).'
    },
    {
      n: 2,
      titulo: 'Leer bien los incidentes',
      cuerpo: 'El paso de {{ries-1|233}} a {{ries-1|362}} incidentes, según la AI Incident Database, puede reflejar más daños, pero también más uso y más reporte ([Stanford, cap. 3][hai3]). Los conteos además se revisan con el tiempo. Sin un denominador comparable, como una tasa por unidad de adopción, el conteo bruto no basta. A la vez, cae la transparencia técnica de los modelos de frontera ([UNU C3][unu]).'
    },
    {
      n: 3,
      titulo: 'Evaluaciones que se pueden engañar',
      cuerpo: 'Algunos modelos detectan que están siendo evaluados y explotan deficiencias de la prueba: es el *reward hacking*, ligado a la conciencia situacional de la evaluación ([IASR 2026][iasr-pdf]). Por eso hacen falta baterías adaptativas, evaluación externa, monitoreo continuo y controles operacionales.'
    },
    {
      n: 4,
      titulo: 'Ley de IA de la UE',
      cuerpo: 'Entró en vigor el {{ctx-ley-vigor|1 de agosto de 2024}} ([Comisión Europea][ec-aia]; [calendario][aisd]). Sus hitos principales:\n- **2 de febrero de 2025:** se aplican las prohibiciones y la obligación de alfabetización en IA.\n- **2 de agosto de 2025:** se aplican las obligaciones para modelos de propósito general (GPAI): documentación técnica, política de derechos de autor y resumen público del contenido de entrenamiento ([obligaciones GPAI][ec-gpai-obl]). Los modelos con riesgo sistémico deben además evaluar y mitigar riesgos, reportar incidentes graves y proteger su ciberseguridad.\n- **2 de agosto de 2026:** se aplica la mayoría de las reglas, incluida la transparencia del artículo 50. La Comisión puede hacer cumplir las obligaciones GPAI, incluso con multas.\n- **2 de agosto de 2027:** plazo para los modelos GPAI comercializados antes del {{ries-3|2 de agosto de 2025}} ([directrices GPAI][ec-gpai-gl]).'
    },
    {
      n: 5,
      titulo: 'Ómnibus Digital sobre IA',
      cuerpo: 'El Reglamento (UE) {{ries-4|2026/1744}}, del {{ries-4|8 de julio de 2026}} y vigente desde el {{ries-4|27 de julio de 2026}}, modificó la Ley de IA ([EUR-Lex][eurlex]; [calendario oficial][aisd]).\n- No cambió las fechas para modelos de propósito general.\n- Aplazó las reglas para sistemas de alto riesgo: las del anexo III al {{ries-4|2 de diciembre de 2027}} y las del anexo I (productos regulados) al {{ries-4|2 de agosto de 2028}}.\n- Desde el {{ries-4|2 de diciembre de 2026}} prohíbe los sistemas que generan deepfakes sexuales no consentidos y material de abuso sexual infantil.\n- Fija esa misma fecha como plazo transitorio del artículo 50(2) para los sistemas de contenido sintético que ya estaban en el mercado antes del {{ctx-omnibus-transitorio|2 de agosto de 2026}}.\n- Pide que cada país tenga al menos un sandbox regulatorio operativo al {{ries-4|2 de agosto de 2027}}.'
    },
    {
      n: 6,
      titulo: 'Por qué importa en América Latina',
      cuerpo: 'La norma alcanza a universidades y empresas que ofrecen servicios en la UE, investigan con socios europeos o usan proveedores sujetos a ella. Su enfoque basado en el riesgo se está volviendo referencia internacional. Tiene tensiones entre claridad jurídica, innovación, costos de cumplimiento y estándares técnicos aún en desarrollo.'
    },
    {
      n: 7,
      titulo: 'Gobernanza organizacional en seis pasos',
      complemento: '(informe base)',
      cuerpo: 'El ciclo se repite una y otra vez:\n1. **Inventario:** modelos, proveedores, datos y casos de uso.\n2. **Clasificar el riesgo:** según impacto y reversibilidad.\n3. **Evaluar:** privacidad, seguridad, sesgo y derechos, con datos representativos.\n4. **Supervisar:** personas con autoridad real para intervenir; registro de decisiones, versiones, instrucciones y fuentes.\n5. **Monitorear incidentes:** deriva, incidentes y efectos distributivos.\n6. **Corregir:** suspensión, corrección y reparación, con auditoría independiente en los usos de alto impacto.\n\nLa gobernanza es de sistemas sociotécnicos, no solo de modelos. Un modelo razonablemente seguro puede causar daño si se combina con datos deficientes, incentivos incorrectos, permisos excesivos o usuarios sin capacidad de revisión.'
    }
  ],
  actualizaciones: [
    { contenido: 5, fuente: 'eurlex' }
  ],
  errores: [
    'Leer más incidentes como prueba de mayor peligrosidad sin mirar cuánto crecieron el uso y el reporte.',
    'Decir que «la Ley de IA se aplica completa desde agosto de 2026», cuando el alto riesgo se aplazó.',
    'Confundir cumplir la norma con gobernar el riesgo propio.',
    'Llamar «humano en el bucle» a una revisión que no tiene autoridad para detener el sistema.'
  ],
  actividades: ['s6-calendario', 's6-ciclo'],
  discusionTitulo: 'Discusión',
  discusion: [
    '¿Qué denominador usaría para convertir el conteo de incidentes en una tasa útil?',
    '¿Qué decisiones de su caso nunca deberían quedar sin supervisión humana?'
  ],
  quiz: [
    {
      pregunta: 'Las tres familias de riesgo del IASR 2026 son:',
      opciones: ['técnica, legal y ética', 'uso malicioso, fallos y riesgos sistémicos', 'privacidad, sesgo y costo'],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'recuerda el diagrama de tres columnas de la lámina D13.'
    },
    {
      pregunta: '¿Desde cuándo puede la Comisión hacer cumplir las obligaciones GPAI?',
      opciones: ['agosto de 2024', 'agosto de 2026', 'agosto de 2028'],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'en la línea de tiempo de los modelos GPAI hay tres hitos; este es el del medio.'
    },
    {
      pregunta: 'Tras el Ómnibus, ¿cuándo aplican las reglas de alto riesgo del anexo III?',
      opciones: ['2 de agosto de 2026', '2 de diciembre de 2027', '2 de agosto de 2028'],
      respuesta: 1,
      letra: 'b',
      explicacion: 'Las del anexo I aplican el 2 de agosto de 2028.',
      pista: 'el Ómnibus aplazó las reglas de alto riesgo con dos fechas distintas: una para el anexo III y otra para el anexo I.'
    }
  ],
  lecturas: [
    'informe base («Riesgo y gobernanza»)',
    '[IASR 2026, resumen ejecutivo][iasr-es]',
    '[calendario de la Ley de IA][aisd]'
  ],
  facilitador: {
    laminas: {
      d13: { decir: '', nota: '' },
      d14: {
        decir: '',
        nota: 'el Ómnibus Digital (2026) aplazó las reglas de alto riesgo a diciembre de 2027 y agosto de 2028 ([calendario][aisd]).'
      }
    },
    claves: []
  }
};
