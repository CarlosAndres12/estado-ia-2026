/* js/data/asistente.js — the course assistant page (prompt §9.9).
 * kb0.texto is KB §0 verbatim (the instructions the user copies); the rest is the prompt's final copy.
 *
 * EIA.data.asistente = {
 *   intro,                                   // page intro
 *   kb0: { titulo, texto },                  // KB §0 "Instrucciones para el agente", verbatim Markdown
 *   base: { archivo, nota },                 // link to the KB file and its note
 *   plantillas: [{ id, titulo, texto, blancos }],  // six templates; blancos = the [blanks] of texto, in order
 *   cierre                                   // closing note
 * }
 */
EIA.data.asistente = {
  intro: 'La base de conocimiento del curso incluye instrucciones para configurar un asistente de IA. Úsalo para repasar, aclarar cifras y revisar avances; comprueba siempre cada cifra en el banco.',
  kb0: {
    titulo: 'Instrucciones para el agente',
    texto: '**Rol.** Eres el asistente del curso *Estado de la IA 2026*. Explicas contenidos y diapositivas, resuelves dudas sobre cifras y fuentes, guías las actividades y acompañas el proyecto final de participantes y docentes.\n\n**Reglas de respuesta**\n1. Toda cifra va con su fuente. El banco de cifras (sección 13) es tu referencia principal.\n2. No inventes, combines ni extrapoles cifras. Si un dato no está en esta base, dilo y sugiere dónde buscarlo.\n3. Indica el tipo de evidencia de cada cifra: capacidad técnica, uso declarado, resultado observado, expectativa o proyección (sección 3).\n4. Precisa el alcance: país, año, población y método. Ejemplo: «4 de cada 5 estudiantes usan IA» es un dato de Estados Unidos.\n5. Usa solo las versiones corregidas de la sección 14. Nunca cites el «34% con experiencias positivas en evaluación con IA» atribuido a UNESCO, porque no aparece en la fuente.\n6. Si existe una edición más reciente de una fuente (McKinsey 2026, METR 2026, PwC 2026, Ómnibus Digital de la UE), menciónala y aclara que el curso usa la edición del informe base.\n7. No presentes como una serie comparable las cifras de ediciones distintas de una misma encuesta.\n8. Distingue los datos de los ejemplos ilustrativos, como el cálculo 0,95^20 de la sesión 2.\n9. Recuerda las cuatro advertencias del curso cuando apliquen: uso no es valor; benchmark no es desempeño real; exposición no es desempleo; asociación no es causalidad.\n10. En temas legales (Ley de IA de la UE, CONPES 4144) da información y fuentes, no asesoría jurídica.\n11. La base refleja lo publicado hasta octubre de 2026. Para hechos posteriores, recomienda verificar en la fuente.\n12. Responde en español, con frases cortas y ejemplos latinoamericanos cuando ayuden.\n13. Para retroalimentar trabajos usa la rúbrica (sección 11) y el principio del curso: evaluar el aprendizaje, no el texto. Guía el razonamiento del equipo; no escribas el proyecto por ellos.\n\n**Tareas típicas:** explicar un concepto o una diapositiva; aclarar una cifra y su fuente; guiar una actividad paso a paso; revisar avances con la rúbrica; generar preguntas de práctica; resumir una sesión.'
  },
  base: {
    archivo: 'contenido/base-estado-ia-2026.md',
    nota: 'Carga este archivo, junto con las instrucciones, en la herramienta de IA que uses.'
  },
  plantillas: [
    {
      id: 'explicar',
      titulo: 'Explicar un concepto o una diapositiva',
      texto: 'Explícame [concepto o número de diapositiva] del curso Estado de la IA 2026 en frases cortas, con un ejemplo latinoamericano. Para cada cifra que uses, dime su fuente y su tipo de evidencia.',
      blancos: ['concepto o número de diapositiva']
    },
    {
      id: 'aclarar-cifra',
      titulo: 'Aclarar una cifra',
      texto: 'Aclárame esta cifra: «[cifra]». Dime su fuente, su tipo de evidencia y su alcance (país, año, población y método), y si la base del curso tiene una versión corregida o una edición más reciente.',
      blancos: ['cifra']
    },
    {
      id: 'guiar-actividad',
      titulo: 'Guiar una actividad',
      texto: 'Guíanos paso a paso en la actividad «[nombre de la actividad]» de la sesión [número], para este caso: [describe el caso sin datos personales]. Haznos preguntas y no la resuelvas por nosotros.',
      blancos: ['nombre de la actividad', 'número', 'describe el caso sin datos personales']
    },
    {
      id: 'revisar-avance',
      titulo: 'Revisar un avance con la rúbrica',
      texto: 'Revisa este avance de nuestro proyecto con la rúbrica del curso: [pega el texto]. Para cada criterio, nombra el nivel actual con una evidencia tomada del texto y propón una acción concreta para subir un nivel. No reescribas el trabajo.',
      blancos: ['pega el texto']
    },
    {
      id: 'preguntas-practica',
      titulo: 'Preguntas de práctica',
      texto: 'Hazme [número] preguntas de práctica de opción múltiple sobre la sesión [número], con la respuesta correcta y una explicación corta basada solo en la base del curso.',
      blancos: ['número', 'número']
    },
    {
      id: 'resumir-sesion',
      titulo: 'Resumir una sesión',
      texto: 'Resume la sesión [número] en [número] frases: la tesis, tres cifras con su fuente y su tipo de evidencia, y la advertencia del curso que más aplica.',
      blancos: ['número', 'número']
    }
  ],
  cierre: 'Lo que responda cualquier asistente puede tener errores: comprueba cada cifra en el banco antes de usarla.'
};
