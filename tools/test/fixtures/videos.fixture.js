/* Test fixture for tools/check-content.mjs: a small js/data/videos.js in the prompt §5.5 shape.
 * Loaded after the real data with loadData({ extra: [...] }); it replaces EIA.data.videos.
 * Each scene exercises one rule; the expected findings are asserted in check-content.test.mjs. */
EIA.data.videos = [
  {
    id: 'v99',
    slug: 'fixture',
    title: 'Video de prueba',
    sesion: 3,
    laminas: ['d07'],
    rate: '0%',
    target: [60, 120],
    poster: { scene: 'backed', p: 0.5 },
    chapters: [{ title: 'Uno', from: 'backed' }],
    scenes: [
      {
        id: 'backed',
        min: 10,
        seVe: 'Una barra crece.',
        rotulos: { barra: { text: '88%', cifras: ['adop-1'] }, sinIds: { text: '39% reporta algún impacto' } },
        lines: [
          { voice: 'narrador', text: 'El 88% de las organizaciones usa IA en al menos una función.', cifras: ['adop-1'] },
          { voice: 'narrador', text: 'Y solo el 39% reporta algún impacto en EBIT.', cifras: ['adop-5'] },
          { voice: 'narrador', text: 'Con 95% por paso, 20 pasos salen bien el 36% de las veces.', ilustrativo: true },
          { voice: 'lectora', text: 'Entonces, decir que la ley se aplica completa desde agosto de 2026 es un error.', advertencia: [1, 2] }
        ]
      },
      {
        id: 'unbacked',
        min: 10,
        seVe: 'Una cifra sin respaldo.',
        rotulos: {},
        lines: [
          { voice: 'narrador', text: 'El 77% de algo que nadie midió.', cifras: ['adop-1'] },
          { voice: 'narrador', text: 'La Ley de IA se aplica completa desde agosto de 2026.' }
        ]
      },
      {
        id: 'serie',
        min: 10,
        seVe: 'Dos ediciones de la encuesta.',
        rotulos: {},
        lines: [
          { voice: 'narrador', text: 'En 2025, el 88% usaba IA.', cifras: ['adop-1'] },
          { voice: 'narrador', text: 'La edición 2026 reporta 44% que escala.', cifras: ['adop-7'] }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'backed',
        question: '¿Qué mide el 88%?',
        options: ['Uso declarado', 'Impacto'],
        answer: 0,
        explain: 'Es lo que dicen los encuestados.',
        hint: 'Piensa en quién respondió.',
        cifras: ['adop-1']
      }
    ]
  }
];
