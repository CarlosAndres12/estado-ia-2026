/* Dev-only fixture videos for tools/dev/player.html and tools/snapshots.mjs (never loaded by the site).
 *
 *   vtest  short test video: 3 chapters, both voices, a checkpoint, a single and a double
 *          `advertencia`, an `ilustrativo` line, a glossary term ("benchmarks") and figures
 *          adop-1, cap-1 and edu-1 (rows copied verbatim from contenido/base-estado-ia-2026.md §13,
 *          added only when js/data/cifras.js does not already have them).
 *   vlong  synthetic ~15-minute timeline (33 scenes, 8 chapters, 5 checkpoints, a full-frame layer per
 *          scene) for `node tools/snapshots.mjs --perf`: steady frame time and flat memory.
 *
 * Voice lines of vtest are copied from the scripts of prompt §13 (V01, V02, V03); vlong uses filler
 * text without numbers. Scenes draw with the merged engine (env.ink, env.fig, env.tags). */
(function (EIA) {
  'use strict';

  // ---------------------------------------------------------------------------------------------
  // Fixture figures, sources and glossary (verbatim KB §13, §16, §12), only if missing.

  var CIFRAS = [
    { id: 'adop-1', tema: 'adopcion', cifra: '88% usa IA regularmente en al menos una función (78% un año antes)',
      alcance: 'Encuesta a 1.993 participantes de 105 países, del 25 de junio al 29 de julio de 2025',
      tipo: 'Uso declarado', clase: 'uso', fuentes: ['mck25'], estado: 'Verificada', sesiones: [1, 3, 7], enBanco: true },
    { id: 'cap-1', tema: 'capacidad', cifra: 'OSWorld: de ~12% a 66,3%; referencia humana 72,35%; fallan ~1 de cada 3 intentos',
      alcance: 'Benchmark de tareas en computador', tipo: 'Capacidad técnica', clase: 'capacidad', fuentes: ['hai2'],
      estado: 'Verificada', sesiones: [1, 2], enBanco: true },
    { id: 'edu-1', tema: 'educacion', cifra: '86% de los estudiantes usa IA; 54% al menos cada semana; 66% usa ChatGPT',
      alcance: '3.839 estudiantes de 16 países', tipo: 'Uso declarado', clase: 'uso', fuentes: ['dec'],
      estado: 'Verificada', sesiones: [1, 4], enBanco: true }
  ];
  var FUENTES = {
    mck25: { etiqueta: 'McKinsey, 2025', url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2025', titulo: 'The state of AI in 2025' },
    hai2: { etiqueta: 'Stanford, cap. 2', url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_2_technical.pdf', titulo: '2 Desempeño técnico' },
    dec: { etiqueta: 'DEC, 2024', url: 'https://www.digitaleducationcouncil.com/post/what-students-want-key-results-from-dec-global-ai-student-survey-2024', titulo: 'Global AI Student Survey 2024' }
  };
  var GLOSARIO = [
    { id: 'benchmark', termino: 'Benchmark', definicion: 'Prueba estandarizada que mide desempeño en condiciones controladas; no equivale a desempeño en el trabajo real.', variantes: ['benchmark', 'benchmarks'] }
  ];

  EIA.data.cifras = EIA.data.cifras || [];
  EIA.data.fuentes = EIA.data.fuentes || {};
  EIA.data.glosario = EIA.data.glosario || [];
  CIFRAS.forEach(function (c) {
    if (!EIA.data.cifras.some(function (x) { return x.id === c.id; })) EIA.data.cifras.push(c);
  });
  Object.keys(FUENTES).forEach(function (k) { if (!EIA.data.fuentes[k]) EIA.data.fuentes[k] = FUENTES[k]; });
  GLOSARIO.forEach(function (g) {
    if (!EIA.data.glosario.some(function (x) { return x.id === g.id; })) EIA.data.glosario.push(g);
  });
  if (EIA.cifra && EIA.cifra.reset) EIA.cifra.reset();

  // ---------------------------------------------------------------------------------------------
  // vtest data (prompt §5.5 shape)

  var vtest = {
    id: 'vtest', slug: 'video-de-prueba', title: 'Video de prueba del reproductor', sesion: 1,
    laminas: ['d01', 'd02'], rate: '0%', target: [45, 120], poster: { scene: 'benchmark', p: 0.8 },
    chapters: [
      { title: 'Lo que se ve', from: 'inicio' },
      { title: 'Un ejemplo', from: 'pasos' },
      { title: 'Advertencias', from: 'advertencia' }
    ],
    scenes: [
      {
        id: 'inicio', min: 8, seVe: 'Una página de libreta; el 88% se escribe con su etiqueta de fuente y la lectora aparece en la esquina.',
        rotulos: { cifra: { text: '88%', cifras: ['adop-1'] }, etiqueta: { text: 'de organizaciones usa IA en al menos una función', cifras: ['adop-1'] } },
        lines: [
          { voice: 'narrador', text: 'Según la encuesta de McKinsey de 2025, el 88% de las organizaciones usa IA de forma regular en al menos una función.', cifras: ['adop-1'] },
          { voice: 'lectora', text: 'Un momento: ¿qué mide exactamente esa cifra?' }
        ]
      },
      {
        id: 'benchmark', min: 8, seVe: 'Un panel azul pautado con la lámpara de IA; una barra pautada crece de cerca de 12% a 66,3%.',
        rotulos: { titulo: { text: 'Capacidad técnica' }, cifra: { text: '66,3%', cifras: ['cap-1'] } },
        lines: [
          { voice: 'narrador', text: 'Primero, la capacidad técnica: el desempeño en evaluaciones controladas, los llamados benchmarks.' },
          { voice: 'narrador', text: 'Por ejemplo, en la prueba OSWorld, los agentes de IA pasaron de cerca de 12% a 66,3% de éxito.', cifras: ['cap-1'] }
        ]
      },
      {
        id: 'pasos', min: 10, seVe: 'Un mar nocturno; veinte peldaños pautados y la lámpara que se atenúa un poco en cada uno.',
        rotulos: { cuenta: { text: '0,95 elevado a 20 ≈ 0,36', ilustrativo: true } },
        lines: [
          { voice: 'narrador', text: '¿Por qué fallan las tareas largas? Un ejemplo ilustrativo, que no viene de las fuentes: si cada paso sale bien el 95% de las veces y los pasos son independientes, una tarea de 20 pasos se completa solo el 36% de las veces.', ilustrativo: true, pause: 1 }
        ]
      },
      {
        id: 'advertencia', min: 8, seVe: 'Los sellos de las advertencias se estampan sobre la página.',
        rotulos: { titulo: { text: 'Cuatro advertencias' } },
        lines: [
          { voice: 'narrador', text: 'Primera advertencia del curso: uso no es valor. Una organización puede usar IA todos los días sin obtener resultados.', advertencia: 1 },
          { voice: 'narrador', text: 'Por eso el curso tiene cuatro advertencias. Uso no es valor. Benchmark no es desempeño real.', advertencia: [1, 2] },
          { voice: 'lectora', text: 'Las vamos a usar en cada sesión.' }
        ]
      },
      {
        id: 'cierre', min: 6, seVe: 'La lectora ata una etiqueta de fuente a un número grande; título final.',
        rotulos: { titulo: { text: 'Toda cifra va con su fuente.' } },
        lines: [
          { voice: 'narrador', text: 'Toda cifra va con su fuente, su alcance y su tipo de evidencia. Así empieza el criterio.' }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'benchmark',
        question: '«El 86% de los estudiantes usa IA» (Digital Education Council, 2024). ¿Qué tipo de evidencia es?',
        options: ['Capacidad técnica', 'Uso declarado', 'Resultado observado', 'Proyección'], answer: 1,
        explain: 'Es uso declarado: lo que los estudiantes dicen en una encuesta.',
        hint: 'Piensa en cómo se obtuvo la cifra: ¿se midió algo o se preguntó a las personas?',
        cifras: ['edu-1']
      }
    ]
  };

  // ---------------------------------------------------------------------------------------------
  // vlong data: ~15 minutes of filler narration (no numbers), for the performance check.

  var FILLER = [
    'La lectora abre su libreta y repasa con calma lo que vio en la sesión anterior, línea por línea, sin apuro.',
    'Cada idea tiene su escena, cada escena tiene su imagen y cada imagen se dibuja despacio, con trazos de tinta.',
    'Mientras tanto, las estrellas giran lentamente sobre la página y el equipo conversa alrededor de la mesa.'
  ];
  var KINDS = ['personas', 'datos', 'territorio', 'mar'];
  var vlong = {
    id: 'vlong', slug: 'linea-de-tiempo-larga', title: 'Línea de tiempo larga de prueba', sesion: 1,
    laminas: [], rate: '0%', target: [840, 960], poster: { scene: 's01', p: 0.5 },
    chapters: [], scenes: [], checkpoints: []
  };
  for (var i = 1; i <= 33; i++) {
    var id = 's' + (i < 10 ? '0' : '') + i;
    vlong.scenes.push({
      id: id, min: 20, seVe: 'Escena de prueba ' + id + '.',
      rotulos: { titulo: { text: 'Escena de prueba ' + id } },
      lines: FILLER.map(function (text, k) { return { voice: k === 1 ? 'lectora' : 'narrador', text: text }; })
    });
    if ((i - 1) % 4 === 0 && vlong.chapters.length < 8) vlong.chapters.push({ title: 'Capítulo de prueba ' + (vlong.chapters.length + 1), from: id });
    if (i % 6 === 0) {
      vlong.checkpoints.push({ after: id, question: '¿Qué hace la lectora en esta escena?', options: ['Abre su libreta', 'Mira el mar'], answer: 0,
        explain: 'Abre su libreta y repasa lo que vio.', hint: 'Fíjate en lo que tiene en las manos.' });
    }
  }

  EIA.data.videos = EIA.data.videos || [];
  [vtest, vlong].forEach(function (v) {
    if (!EIA.data.videos.some(function (x) { return x.id === v.id; })) EIA.data.videos.push(v);
  });

  // ---------------------------------------------------------------------------------------------
  // Modules

  function rot(s, key) { return (s.rotulos[key] && s.rotulos[key].text) || ''; }

  // Full-frame background pre-rendered once per scene (exercises the layers LRU).
  function backgroundLayer(kind, seed) {
    return function (env) {
      var c = env.canvas(env.W, env.H);
      env.ink.background(c.getContext('2d'), kind, { w: env.W, h: env.H, seed: seed });
      return { bg: c };
    };
  }

  function drawLayer(ctx, s, env) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, env.W, env.H);
  }

  EIA.videos.vtest = {
    setup: function (env) {
      var r = env.rng('vtest:steps');
      var steps = [];
      for (var k = 0; k < 20; k++) steps.push({ x: 150 + k * 50, y: 520 - k * 16, wobble: r.range(-2, 2) });
      return { steps: steps };
    },
    layers: {
      inicio: backgroundLayer('personas', 'vtest:inicio'),
      benchmark: backgroundLayer('personas', 'vtest:benchmark'),
      pasos: backgroundLayer('mar', 'vtest:pasos'),
      advertencia: backgroundLayer('personas', 'vtest:advertencia'),
      cierre: backgroundLayer('lienzo', 'vtest:cierre')
    },
    scenes: {
      inicio: function (ctx, s, env) {
        drawLayer(ctx, s, env);
        var a = s.at(0);
        env.ink.letter(ctx, rot(s, 'cifra'), 420, 150, { size: 150, p: env.ease.out(a), seed: 'vtest:88' });
        env.ink.text(ctx, rot(s, 'etiqueta'), 420, 340, { size: 30, maxWidth: 560, p: env.ease.segment(a, 0.4, 1) });
        if (a > 0) env.tags.sourceTag(ctx, 'adop-1', { x: 420, y: 420, p: env.ease.segment(a, 0.5, 1) });
        if (s.at(1) > 0) env.fig.lectora(ctx, 200, 640, 1.6, { p: env.ease.out(s.at(1)), seed: 'lectora' });
      },
      benchmark: function (ctx, s, env) {
        drawLayer(ctx, s, env);
        env.fig.panel(ctx, 160, 120, 960, 400, {});
        env.fig.lamp(ctx, 300, 320, 1.2, { t: s.t, p: s.intro });
        env.ink.letter(ctx, rot(s, 'titulo'), 440, 160, { size: 44, p: s.at(0), seed: 'vtest:titulo', color: env.pal.maquina.linea, underline: false });
        var b = env.ease.out(s.at(1));
        if (b > 0) {
          env.ink.rRect(ctx, 440, 300, 600 * 0.663 * b, 40, { fill: env.pal.maquina.linea, stroke: false });
          env.ink.rRect(ctx, 440, 300, 600, 40, { color: env.pal.maquina.linea });
          env.ink.text(ctx, rot(s, 'cifra'), 440, 360, { size: 40, weight: 700, color: env.pal.mundo.lienzo, p: env.ease.segment(s.at(1), 0.7, 1) });
          env.tags.sourceTag(ctx, 'cap-1', { x: 700, y: 360, p: env.ease.segment(s.at(1), 0.6, 1) });
        }
      },
      pasos: function (ctx, s, env) {
        drawLayer(ctx, s, env);
        var steps = s.state.steps;
        var shown = Math.round(steps.length * s.at(0));
        for (var k = 0; k < shown; k++) {
          env.ink.rLine(ctx, steps[k].x, steps[k].y, steps[k].x + 40, steps[k].y, { color: env.pal.maquina.linea, w: 2 });
        }
        var last = steps[Math.max(0, shown - 1)];
        env.fig.lamp(ctx, last.x + 20, last.y - 40, 0.6, { t: s.t, dim: s.at(0) * 0.6 });
        env.ink.text(ctx, rot(s, 'cuenta'), 760, 150, { size: 34, weight: 700, color: env.pal.mundo.lienzo, p: env.ease.segment(s.at(0), 0.85, 1) });
      },
      advertencia: function (ctx, s, env) {
        drawLayer(ctx, s, env);
        env.ink.letter(ctx, rot(s, 'titulo'), 180, 260, { size: 64, p: s.intro, seed: 'vtest:adv' });
        env.fig.team(ctx, 640, 640, 1.1, { n: 4, seed: 'vtest:team', p: s.at(0) });
      },
      cierre: function (ctx, s, env) {
        drawLayer(ctx, s, env);
        env.ink.letter(ctx, rot(s, 'titulo'), 640, 220, { size: 60, align: 'center', p: s.at(0), seed: 'vtest:cierre' });
        env.fig.lectora(ctx, 1040, 650, 1.5, { p: s.intro, seed: 'lectora' });
      }
    }
  };

  var longLayers = {}, longScenes = {};
  vlong.scenes.forEach(function (scene, k) {
    longLayers[scene.id] = backgroundLayer(KINDS[k % KINDS.length], 'vlong:' + scene.id);
    longScenes[scene.id] = function (ctx, s, env) {
      drawLayer(ctx, s, env);
      var dark = KINDS[k % KINDS.length] === 'mar';
      env.ink.letter(ctx, rot(s, 'titulo'), 120, 120, { size: 48, p: s.intro, seed: 'vlong:t' + k, color: dark ? env.pal.mundo.lienzo : env.pal.mundo.tinta });
      for (var j = 0; j < 7; j++) {
        var x = 220 + j * 140 + Math.sin(s.t * 0.4 + j) * 12;
        var y = 300 + Math.cos(s.t * 0.3 + j * 1.7) * 16;
        env.fig.sign(ctx, j % 2 ? 'estrella' : 'espiral', x, y, 56, { seed: 'vlong:' + j, p: env.ease.segment(s.at(j % 3), 0, 0.6) });
      }
      env.fig.person(ctx, 980, 660, 1.4, { role: 'docente', pose: s.line % 2 ? 'pointing' : 'standing', seed: 'vlong:p' + (k % 5), p: s.intro });
    };
  });
  EIA.videos.vlong = { setup: function () { return {}; }, layers: longLayers, scenes: longScenes };
})(window.EIA);
