/* js/data/correcciones.js — corrections and updates, KB §14 (prompt §9.6). The only file (with cifras.js, the KB §0 text of
 * asistente.js, the "Errores de lectura frecuentes" lists and lámina notes) allowed to hold the banned versions.
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.correcciones = {
 *   titulo, columnas,                      // KB §14 heading and table header, verbatim
 *   filas: [{ id, antes, ahora, fuente, fuentes, cifras }],
 *     // antes "Versión del informe base", ahora "Versión correcta", fuente the KB cell (markup),
 *     // fuentes its link keys, cifras the figure ids it touches (banco "Ver corrección")
 *   actualizacionesTitulo,
 *   actualizaciones: [{ id, titulo, texto, fuentes, cifras }]   // "Actualizaciones que conviene mencionar"
 * }
 */
EIA.data.correcciones = {
  titulo: 'Correcciones: no uses las versiones originales',
  columnas: ['Versión del informe base', 'Versión correcta', 'Fuente'],
  filas: [
    {
      id: 'unesco',
      antes: 'UNESCO: «la mitad se siente segura» y «34% con experiencias positivas en evaluación con IA»',
      ahora: '9 de cada 10 usan IA en su trabajo; más de la mitad se siente insegura o dubitativa para usarla en docencia o investigación. El 34% no aparece en la fuente.',
      fuente: '[UNESCO, 2025][unesco]',
      fuentes: ['unesco'],
      cifras: ['edu-5']
    },
    {
      id: 'clusteres',
      antes: 'América Latina: 3 clústeres de supercomputación estatales',
      ahora: '8 en 2025; el 3 corresponde a otras regiones',
      fuente: '[Stanford, cap. 8][hai8]',
      fuentes: ['hai8'],
      cifras: ['eco-7']
    },
    {
      id: 'cuatro-de-cada-cinco',
      antes: '«Cuatro de cada cinco universitarios usan IA»',
      ahora: 'Dato de estudiantes de secundaria y universidad de EE. UU.',
      fuente: '[Stanford, cap. 7][hai7]',
      fuentes: ['hai7'],
      cifras: ['edu-4']
    },
    {
      id: 'marketing',
      antes: 'Marketing «hasta +50%»',
      ahora: '+50%',
      fuente: '[Stanford, cap. 4][hai4]',
      fuentes: ['hai4'],
      cifras: ['prod-1']
    },
    {
      id: 'dispositivos',
      antes: '«Solo 2,4% de los dispositivos tuvo ensayos aleatorizados», junto a los 258 de 2025',
      ahora: 'El 2,4% sale de 1.016 autorizaciones hasta diciembre de 2024',
      fuente: '[Stanford, cap. 6][hai6]',
      fuentes: ['hai6'],
      cifras: ['med-6']
    },
    {
      id: 'referencias-humanas',
      antes: 'Los modelos «igualan o superan» las referencias humanas en ciencia, razonamiento multimodal y matemáticas',
      ahora: 'Superan a los expertos en GPQA y a los concursantes en matemáticas; en MMMU quedan 0,4 puntos por debajo del mejor experto',
      fuente: '[Stanford, cap. 2][hai2]',
      fuentes: ['hai2'],
      cifras: ['cap-3']
    },
    {
      id: 'conpes',
      antes: 'CONPES 4144: «más de 100 acciones» y «479.000 millones»',
      ahora: '106 acciones y 479.273 millones (las diapositivas redondean)',
      fuente: '[DNP][dnp]',
      fuentes: ['dnp'],
      cifras: ['alc-4']
    },
    {
      id: 'pwc',
      antes: 'PwC: 27% frente a 9%',
      ahora: '27,0% frente a 8,5% (la nota de prensa redondea a 9%)',
      fuente: '[PwC, 2025][pwc25]',
      fuentes: ['pwc25'],
      cifras: ['prod-5']
    }
  ],
  actualizacionesTitulo: 'Actualizaciones que conviene mencionar',
  actualizaciones: [
    {
      id: 'ley-ia',
      titulo: 'Ley de IA de la UE',
      texto: 'el Ómnibus Digital (Reglamento 2026/1744) aplazó las reglas de alto riesgo y no cambió las fechas para modelos de propósito general ([AI Act Service Desk][aisd]; [EUR-Lex][eurlex]).',
      fuentes: ['aisd', 'eurlex'],
      cifras: ['ries-3', 'ries-4']
    },
    {
      id: 'mckinsey-2026',
      titulo: 'McKinsey 2026',
      texto: '44% de las organizaciones escala la IA a toda la empresa y 37% reporta impacto en EBIT ([McKinsey, 2026][mck26]).',
      fuentes: ['mck26'],
      cifras: ['adop-7']
    },
    {
      id: 'metr',
      titulo: 'METR',
      texto: 'el ensayo de 2025 está marcado como desactualizado y su seguimiento de 2026 no fue concluyente ([METR, 2026][metr-up]). El horizonte de tareas se duplica hoy cada ~3 meses ([METR, 2026][metr-th11]).',
      fuentes: ['metr-up', 'metr-th11'],
      cifras: ['prod-3', 'prod-4', 'cap-8']
    },
    {
      id: 'pwc-2026',
      titulo: 'PwC 2026',
      texto: 'la prima salarial por habilidades de IA es de 62% ([PwC, 2026][pwc26]).',
      fuentes: ['pwc26'],
      cifras: ['prod-7']
    },
    {
      id: 'colombia',
      titulo: 'Clasificación de Colombia',
      texto: 'en el ILIA, Colombia es «adoptante». No repitas la etiqueta de «pionero» que usa un comunicado oficial.',
      fuentes: [],
      cifras: ['alc-3']
    }
  ]
};
