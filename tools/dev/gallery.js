/* Dev-only gallery and self-test for the drawing engine (T04). Not part of the site.
 *
 *   gallery.html?section=<name>[&page=N][&p=0..1][&t=seconds][&dpr=2]
 *   gallery.html?test=1          determinism, honest-chart measurements, no exceptions
 *
 * Captions on the sheets are developer labels (identifiers), not course copy.
 */
(function (EIA) {
  'use strict';

  var E = EIA.engine;
  var q = EIA.util.query();
  var W = 1280, H = 720;
  var sections = {};
  var order = [];

  function section(name, pages, fn) { sections[name] = { pages: pages, fn: fn }; order.push(name); }

  function devLabel(ctx, text, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.size || 12) + 'px ui-monospace, monospace';
    ctx.fillStyle = o.color || 'rgba(21,18,15,0.55)';
    ctx.textAlign = o.align || 'center';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function grid(n, cols, x0, y0, w, h) {
    var rows = Math.ceil(n / cols), cw = w / cols, ch = h / rows, out = [];
    for (var i = 0; i < n; i++) {
      var c = i % cols, r = Math.floor(i / cols);
      out.push({ x: x0 + c * cw + cw / 2, y: y0 + r * ch + ch / 2, w: cw, h: ch });
    }
    return out;
  }

  function opts() {
    return { p: q.p == null ? 1 : Number(q.p), t: q.t == null ? 0 : Number(q.t), page: Number(q.page) || 1 };
  }

  // ---------------------------------------------------------------------------------------------
  // Sheets

  section('ink', 1, function (ctx, o) {
    var ink = E.ink, m = E.palette.mundo;
    ink.background(ctx, 'personas', { seed: 'gallery-ink' });
    var profiles = ['swell', 'blunt', 'outline', 'lift', 'press', 'even', 'hair'];
    profiles.forEach(function (pr, i) {
      var y = 70 + i * 52;
      var pts = [150, y + 10, 260, y - 14, 380, y + 12, 500, y - 8];
      ink.line(ctx, pts, { w: pr === 'hair' ? 2 : 9, profile: pr, seed: 'g' + pr, p: o.p, dot: i % 3 === 0, second: i === 0 });
      devLabel(ctx, pr, 90, y + 4, { align: 'left' });
    });
    ink.shape(ctx, ink.blobPoints(E.rng.create('b1'), 700, 160, 90, 70, 9, 0.25), { fill: m.rojo, w: 7, seed: 'sh1', p: o.p });
    ink.shape(ctx, ink.blobPoints(E.rng.create('b2'), 860, 200, 80, 90, 8, 0.3), { fill: m.amarillo, w: 6, seed: 'sh2', p: o.p });
    ink.shape(ctx, ink.blobPoints(E.rng.create('b3'), 1040, 150, 100, 60, 10, 0.2), { fill: m.azul, w: 8, seed: 'sh3', p: o.p });
    ink.circle(ctx, 1150, 300, 50, { fill: m.rojo, w: 3, line: false, seed: 'sun' });
    ink.spatter(ctx, 700, 420, 60, { seed: 'sp1' });
    ink.dotCluster(ctx, 860, 420, 40, { seed: 'dc1', n: 13 });
    ink.contours(ctx, 1060, 430, 120, 50, { seed: 'ct1' });
    ink.arrow(ctx, [620, 560, 760, 520, 900, 560], { w: 4, seed: 'ar1', p: o.p });
    ink.arrow(ctx, [940, 600, 1200, 600], { dotted: true, seed: 'ar2', p: o.p });
    ink.wave(ctx, 150, 470, 560, { amp: 7, len: 60, w: 5, dot: true, seed: 'wv', profile: 'press', p: o.p });
    ink.card(ctx, 150, 520, 380, 150, { seed: 'card1', peek: m.azul, peekCorner: 'tr', p: o.p });
    ink.rRect(ctx, 960, 470, 180, 90, { color: E.palette.maquina.linea });
  });

  section('signs', 3, function (ctx, o) {
    var ink = E.ink, fig = E.figures;
    ink.background(ctx, 'personas', { seed: 'gallery-signs' });
    var names = fig.signNames();
    if (o.page === 1) {
      var cells = grid(names.length, 10, 20, 14, W - 40, H - 28);
      names.forEach(function (n, i) {
        var c = cells[i];
        fig.sign(ctx, n, c.x, c.y - 8, Math.min(c.w, c.h) * 0.66, { seed: 'g', p: o.p });
        devLabel(ctx, n, c.x, c.y + c.h / 2 - 6, { size: 11 });
      });
    } else if (o.page === 2) {
      // Monochrome forms (tinta only) and a large reading of the evidence and estado signs.
      var legend = ['matraz', 'bocadillo', 'lupa', 'catalejo', 'cometa', 'sello-visto', 'asterisco', 'luna', 'libro', 'cuadrado'];
      legend.forEach(function (n, i) {
        var x = 80 + i * 124;
        fig.sign(ctx, n, x, 110, 100, { seed: 'g', p: o.p });
        fig.sign(ctx, n, x, 250, 100, { seed: 'g', mono: true, p: o.p });
        fig.sign(ctx, n, x, 360, 32, { seed: 'g', p: o.p });
        fig.sign(ctx, n, x, 410, 22, { seed: 'g', p: o.p });
        devLabel(ctx, n, x, 450, { size: 11 });
      });
      ['estrella', 'luna', 'sol', 'pajaro', 'espiral', 'constelacion'].forEach(function (n, i) {
        fig.sign(ctx, n, 110 + i * 210, 590, 190, { seed: 'big' + i, p: o.p });
      });
    } else {
      // Seed variation: the same sign with eight seeds.
      ['estrella', 'pajaro', 'constelacion', 'mancha', 'cabellos', 'salpicadura'].forEach(function (n, row) {
        for (var k = 0; k < 10; k++) fig.sign(ctx, n, 70 + k * 118, 66 + row * 116, 92, { seed: 's' + k, p: o.p });
      });
    }
  });

  // Chart strings below are verbatim KB fragments (KB §13 and the D7 slide script).
  var D7_ITEMS = [
    { text: '88% usa IA en al menos una función', cifras: ['adop-1'] },
    { text: '62% experimenta o escala agentes', cifras: ['adop-2'] },
    { text: '~1/3 escala la IA en toda la organización (la barra más estrecha, el cuello de botella)', cifras: ['adop-4'] },
    { text: '39% reporta algún impacto en EBIT (normalmente <5%)', cifras: ['adop-5'] }
  ];
  EIA.dev.D7_ITEMS = D7_ITEMS;

  section('charts', 2, function (ctx, o) {
    var ink = E.ink, chart = E.chart, m = E.palette.mundo;
    ink.background(ctx, 'datos', { seed: 'gallery-charts' });
    if (o.page === 1) {
      chart.bars(ctx, D7_ITEMS, { x: 70, y: 50, len: 380, h: 30, gap: 30, p: o.p, labelSize: 20, labelWidth: 230, tag: false });
      chart.unitGrid(ctx, { x: 70, y: 330, w: 220, total: 100, value: 23, p: o.p, seed: 'g23' });
      chart.unitGrid(ctx, { x: 330, y: 330, w: 320, total: 1000, percent: 3.3, p: o.p, litColor: m.tinta, seed: 'g33' });
      chart.dots(ctx, { x: 160, y: 620, count: 44, pitch: 15, p: o.p, seed: 'd44' });
      chart.dots(ctx, { x: 330, y: 620, count: 8, pitch: 15, p: o.p, seed: 'd8' });
      var sc = chart.scale(100, 700, 330);
      chart.band(ctx, { text: '+14–15%', scale: sc, y: 60, p: o.p });
      chart.bar(ctx, { text: 'Hasta −83% de tiempo de redacción de notas clínicas', scale: sc, y: 120, h: 28, p: o.p, color: m.verde, labelWidth: 200, cifras: ['med-1'] });
      chart.bar(ctx, { text: '<20%', label: '', scale: sc, y: 190, h: 28, p: o.p, color: m.rojo });
      chart.bar(ctx, { text: 'Más de 90% (91,2%)', scale: sc, y: 250, h: 28, p: o.p, color: m.amarillo, labelWidth: 120 });
      chart.interval(ctx, { min: -50, max: 20, x: 700, len: 500, y: 400, lo: chart.parseValue('−38%').value, hi: chart.parseValue('+9%').value,
        point: chart.parseValue('−18%').value, labels: { lo: '−38%', hi: '+9%', point: '−18%' }, p: o.p });
      chart.gauge(ctx, { x: 780, y: 600, r: 80, max: 400, text: '362 (2025)', ghost: chart.parseValue('233 (2024)').value, p: o.p, cifras: ['ries-1'] });
      ink.machineGrid(ctx, 1060, 500, 190, 190, { cell: 12 });
      chart.gauge(ctx, { x: 1155, y: 600, r: 62, max: 100, text: '55,84', style: 'ruled', p: o.p });
    } else {
      chart.funnel(ctx, { x: 60, y: 60, w: 360, items: D7_ITEMS, p: o.p, labelWidth: 290 });
      chart.timeline(ctx, { x: 60, y: 470, w: 1160, from: '1 de enero de 2024', to: '1 de enero de 2029', p: o.p, items: [
        { text: '1 de agosto de 2024: entra en vigor' }, { text: '2 de febrero de 2025: prohibiciones y alfabetización en IA' },
        { text: '2 de agosto de 2025: obligaciones para modelos de propósito general' }, { text: '2 de diciembre de 2027' }, { text: '2 de agosto de 2028' }] });
      chart.panels(ctx, { x: 760, y: 560, w: 460, h: 140, p: o.p, panels: [
        { draw: function (c, r, pp) { E.ink.text(c, '88%', r.x + r.w / 2, r.y + 40, { size: 40, weight: 700, align: 'center', p: pp }); } },
        { draw: function (c, r, pp) { E.ink.text(c, '~9 de 10', r.x + r.w / 2, r.y + 44, { size: 34, weight: 700, align: 'center', p: pp }); } }] });
    }
  });

  // Diagram fixtures: item texts are verbatim KB strings (slide scripts and video rótulos).
  var DIAGRAMS = [
    { tipo: 'flujo', items: [{ text: 'Capital' }, { text: 'Cómputo' }, { text: 'Modelos' }, { text: 'Productos' }] },
    { tipo: 'pasos', items: [{ text: 'Producto auténtico' }, { text: 'Bitácora de proceso' }, { text: 'Defensa oral' }, { text: 'Uso declarado de IA' }] },
    { tipo: 'causal', items: [{ text: 'Capital, datos, gestión' }, { text: 'Exposición a IA' }, { text: 'Ingreso por empleado' }, { text: 'asociación' }] },
    { tipo: 'columnas', items: [{ text: 'Uso malicioso', sign: 'anzuelo' }, { text: 'Fallos', sign: 'grieta' }, { text: 'Riesgos sistémicos', sign: 'red-pueblo' }] },
    { tipo: 'ciclo', items: [{ text: 'Inventario' }, { text: 'Clasificar riesgo' }, { text: 'Evaluar' }, { text: 'Supervisar' }, { text: 'Monitorear incidentes' }, { text: 'Corregir' }] },
    { tipo: 'semaforo', items: [{ text: 'evidencia insuficiente' }, { text: 'resultado de laboratorio' }, { text: 'apoyo al flujo de trabajo' }] },
    { tipo: 'linea', items: [{ text: '1 de agosto de 2024: entra en vigor' }, { text: '2 de febrero de 2025: prohibiciones y alfabetización en IA' },
      { text: '2 de agosto de 2025: obligaciones para modelos de propósito general' }] },
    { tipo: 'tarjetas', items: [{ text: 'Gobiernos' }, { text: 'Universidades' }, { text: 'Organizaciones' }] }
  ];

  section('lamina', 3, function (ctx, o) {
    var lam = E.lamina;
    if (o.page === 1) { lam.render(ctx, 'd07', { t: o.t, still: q.still === '1' }); return; }
    if (o.page === 2) { lam.render(ctx, 'd06', { t: o.t, still: q.still === '1' }); return; }
    E.ink.background(ctx, 'personas', { seed: 'gallery-diagrams' });
    var cells = [
      { x: 30, y: 20, w: 600, h: 130 }, { x: 650, y: 20, w: 600, h: 150 },
      { x: 30, y: 170, w: 600, h: 200 }, { x: 650, y: 190, w: 600, h: 150 },
      { x: 30, y: 400, w: 420, h: 300 }, { x: 470, y: 400, w: 330, h: 190 },
      { x: 820, y: 360, w: 440, h: 190 }, { x: 470, y: 600, w: 790, h: 100 }
    ];
    DIAGRAMS.forEach(function (d, i) {
      lam.diagram(ctx, d, cells[i], { p: o.p });
      devLabel(ctx, d.tipo, cells[i].x + 4, cells[i].y + 12, { align: 'left', size: 11 });
    });
  });

  section('people', 3, function (ctx, o) {
    var fig = E.figures, ink = E.ink;
    ink.background(ctx, 'personas', { seed: 'gallery-people' });
    if (o.page === 1) {
      // La lectora in every pose, then at 80, 160 and 400 px tall.
      ['reading', 'writing', 'asking', 'pointing', 'catching', 'tying', 'lookingUp', 'walking'].forEach(function (pose, i) {
        fig.lectora(ctx, 80 + i * 92, 300, 2.2, { pose: pose, p: o.p });
        devLabel(ctx, pose, 80 + i * 92, 320, { size: 11 });
      });
      fig.lectora(ctx, 70, 700, 0.8, { pose: 'writing', p: o.p });
      fig.lectora(ctx, 180, 700, 1.6, { pose: 'asking', p: o.p, facing: -1 });
      fig.lectora(ctx, 1000, 712, 4, { pose: 'reading', p: o.p });
      return;
    }
    if (o.page === 2) {
      var roles = ['directiva', 'servidor', 'docente', 'investigadora', 'medica', 'desarrollador', 'estudiante', 'campesina'];
      var props = [null, 'folder', 'book', 'flask', 'clipboard', 'laptop', 'phone', null];
      var poses = ['presenting', 'standing', 'pointing', 'reading', 'writing', 'reading', 'walking', 'waving'];
      roles.forEach(function (role, i) {
        fig.person(ctx, 80 + i * 158, 330, 2.6, { role: role, seed: 'g' + role, pose: poses[i], prop: props[i], p: o.p });
        devLabel(ctx, role, 80 + i * 158, 350, { size: 11 });
      });
      for (var k = 0; k < 12; k++) fig.person(ctx, 60 + k * 100, 690, 1.5, { seed: 'crowd' + k, pose: fig.poses()[k % fig.poses().length], p: o.p });
      return;
    }
    fig.team(ctx, 330, 420, 1, { p: o.p });
    fig.students(ctx, 330, 690, 1.3, { p: o.p });
    fig.youngLadder(ctx, 980, 680, 1.4, { p: o.p });
  });

  section('machine', 1, function (ctx, o) {
    var fig = E.figures, chart = E.chart, ink = E.ink;
    ink.background(ctx, 'personas', { seed: 'gallery-machine' });
    // Lamps at several sizes on a navy field, and one dimmed.
    fig.panel(ctx, 20, 20, 400, 200);
    fig.lamp(ctx, 90, 120, 1, { t: o.t, p: o.p });
    fig.lamp(ctx, 200, 120, 0.6, { t: o.t, p: o.p });
    fig.lamp(ctx, 280, 120, 0.3, { t: o.t, p: o.p });
    fig.lamp(ctx, 360, 120, 0.6, { t: o.t, p: o.p, dim: 0.8 });
    // Agent loop (V03 rótulos).
    fig.agentLoop(ctx, 440, 20, 0.78, { labels: ['Objetivo', 'Planificar', 'Usar herramientas', 'Ejecutar', 'Verificar'], returnTo: 1, at: 0.3, t: o.t, p: o.p });
    // Ruled ladder with rungs at exact heights (values parsed from the KB row of cap-1).
    var lo = chart.parseValue('~12%').value, hi = chart.parseValue('66,3%').value, ref = chart.parseValue('72,35%').value;
    fig.ruledLadder(ctx, 980, 300, 0.75, { max: 100, rungs: [{ value: lo }, { value: hi, crack: true }], ref: ref, lampAt: hi, t: o.t, p: o.p });
    fig.examPanel(ctx, 20, 250, 0.8, { checked: 3, t: o.t, p: o.p });
    fig.serverTower(ctx, 470, 560, 0.9, { p: o.p });
    fig.computeBlock(ctx, 560, 300, 0.75, { fraction: chart.parseValue('9,6%').value / 100, p: o.p });
    fig.computeBlock(ctx, 560, 420, 0.75, { fraction: chart.parseValue('22,6%').value / 100, p: o.p });
    fig.panel(ctx, 20, 500, 400, 210);
    ['puntos', 'rayas', 'estrellas'].forEach(function (pt, i) { fig.lampOnWheels(ctx, 90 + i * 120, 690, 0.8, { pattern: pt, t: o.t, p: o.p }); });
    fig.panel(ctx, 820, 330, 450, 380);
    fig.ruledSieve(ctx, 920, 440, 0.8, { t: o.t, p: o.p });
    fig.weightsBox(ctx, 1030, 380, 0.85, { lid: 'transparent', drawers: 2, p: o.p });
    fig.weightsBox(ctx, 850, 560, 0.7, { lid: 'closed', p: o.p });
  });

  section('tags', 1, function (ctx, o) {
    var ink = E.ink, tags = E.tags, L = E.palette.legend;
    ink.background(ctx, 'personas', { seed: 'gallery-tags' });
    // Source tags tied to big numbers (the number text here is a dev stand-in for a rótulo).
    var ids = ['adop-1', 'cap-3', 'adop-7', 'adop-8', 'trab-1', 'ries-2'];
    ids.forEach(function (id, i) {
      var x = 60 + (i % 3) * 410, y = 60 + Math.floor(i / 3) * 170;
      ctx.font = '900 40px "EIA Display"';
      ctx.fillStyle = E.palette.mundo.tinta;
      ctx.fillText(id, x, y + 40);
      tags.sourceTag(ctx, id, { near: { x: x + 4, y: y + 56, side: 'below', gap: 26 }, anchor: { x: x + 30, y: y + 50 }, p: o.p });
    });
    // Chips, full and monochrome, plus the neutral chip.
    L.tipos.forEach(function (t, i) {
      tags.chip(ctx, t.clase, t.label, { x: 50 + i * 238, y: 400, size: 16, pill: true, p: o.p });
      tags.chip(ctx, t.clase, t.label, { x: 50 + i * 238, y: 440, size: 16, mono: true, p: o.p });
    });
    tags.chip(ctx, 'neutral', 'Proyección/índice', { x: 1060, y: 470, size: 16, pill: true, p: o.p });
    // Estado signs.
    ['verificada', 'con-matiz', 'actualizacion', 'informe-base'].forEach(function (k, i) {
      tags.estadoSign(ctx, k, 80 + i * 60, 520, 40);
    });
    tags.illustrativeStamp(ctx, 330, 500, 1, o.p);
    tags.updateRibbon(ctx, 720, 505, 1, o.p);
    for (var n = 1; n <= 4; n++) tags.warningStamp(ctx, n, 80 + (n - 1) * 175, 640, 150, o.p);
    tags.marginNote(ctx, 'Benchmark', 'Prueba estandarizada para comparar sistemas en una tarea definida (texto de prueba).', 760, 570, 480, o.p);
  });

  section('lettering', 1, function (ctx, o) {
    var ink = E.ink;
    ink.background(ctx, 'personas', { seed: 'gallery-letter' });
    ink.letter(ctx, 'Estado de la IA 2026', 140, 60, { size: 92, maxWidth: 1060, seed: 'l1', p: o.p });
    ink.letter(ctx, 'Del uso al valor: el embudo de la adopción', 140, 240, { size: 60, maxWidth: 1000, seed: 'l2', p: o.p });
    ink.letter(ctx, 'Medir confiabilidad, no solo precisión.', 140, 420, { size: 48, font: 'sans', maxWidth: 1000, seed: 'l3', p: o.p });
    ink.text(ctx, 'Lo que personas u organizaciones dicen hacer. Texto de cuerpo en EIA Sans a 22 px, envuelto en un ancho máximo de 700 píxeles para revisar la medida.',
      140, 560, { size: 22, maxWidth: 700 });
    ink.text(ctx, 'Nota en cursiva, estilo margen', 900, 560, { size: 20, italic: true, maxWidth: 300 });
  });

  section('backgrounds', 1, function (ctx, o) {
    var ink = E.ink;
    var kinds = ['personas', 'datos', 'territorio', 'mar', 'maquina', 'lienzo'];
    var cells = grid(kinds.length, 3, 0, 0, W, H);
    kinds.forEach(function (k, i) {
      var c = cells[i];
      ctx.save();
      ctx.beginPath();
      ctx.rect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);
      ctx.clip();
      ctx.translate(c.x - c.w / 2, c.y - c.h / 2);
      ctx.scale(c.w / W, c.h / H);
      ink.background(ctx, k, { seed: 'bg-' + k });
      ctx.restore();
      devLabel(ctx, k, c.x, c.y + c.h / 2 - 10, { size: 14, color: k === 'mar' || k === 'maquina' ? '#F4EEDF' : '#15120F' });
    });
  });

  // ---------------------------------------------------------------------------------------------
  // Runner

  var stage = document.getElementById('stage');
  var dpr = Math.min(2, Number(q.dpr) || 1);
  stage.width = W * dpr;
  stage.height = H * dpr;
  stage.style.width = W + 'px';
  stage.style.height = H + 'px';

  function renderSection(ctx, name, o) {
    var s = sections[name];
    if (!s) throw new Error('Unknown section: ' + name);
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    s.fn(ctx, o);
    ctx.restore();
  }

  function nav() {
    var el = document.getElementById('nav');
    el.innerHTML = order.map(function (n) { return '<a href="?section=' + n + '">' + n + '</a>'; }).join('') +
      '<a href="?test=1">self-test</a>';
  }

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 40px "EIA Display"'),
      document.fonts.load('700 40px "EIA Display"'),
      document.fonts.load('400 20px "EIA Sans"'),
      document.fonts.load('700 20px "EIA Sans"'),
      document.fonts.load('italic 400 20px "EIA Sans"')
    ]).then(function () { return document.fonts.ready; });
  }

  EIA.dev = EIA.dev || {};
  EIA.dev.sections = sections;
  EIA.dev.renderSection = renderSection;

  // ?mount=<id>: the same code path as index.html?lamina=<id> (bare canvas, renderFrame, renderReady),
  // fed by the fixture deck while the real js/data/deck.js is a stub.
  if (q.mount) {
    E.lamina.mountRender(q.mount, q).then(function () { document.title = 'READY ' + q.mount; });
    return;
  }

  fontsReady().then(function () {
    nav();
    var ctx = stage.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (q.test) {
      if (EIA.dev.runTests) EIA.dev.runTests(ctx);
      return;
    }
    try {
      renderSection(ctx, q.section || 'ink', opts());
      document.title = 'OK ' + (q.section || 'ink');
    } catch (err) {
      document.getElementById('results').textContent = 'FAIL render: ' + (err && err.stack || err);
      throw err;
    }
  });
})(window.EIA);
